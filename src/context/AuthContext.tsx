import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile, OrderConfirmation, UserRole, UserAccountStatus } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isManagement: boolean;
  isCustomer: boolean;
  canSeeAdminPortal: boolean;
  isPortalLocked: boolean;
  isManagementLockedOut: boolean;
  togglePortalLock: (locked: boolean) => Promise<void>;
  updateUserRoleAndStatus: (userId: string, role: UserRole, accountStatus?: UserAccountStatus) => Promise<void>;
  adminSession: boolean;
  adminLogin: (codeOrKey: string) => boolean;
  adminLogout: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateShippingProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  getUserOrders: () => Promise<OrderConfirmation[]>;
  getAllOrders: () => Promise<OrderConfirmation[]>;
  updateOrderStatus: (orderId: string, status: OrderConfirmation['status'], trackingNumber?: string) => Promise<void>;
  getAllUsers: () => Promise<UserProfile[]>;
  createOrAddUser: (profile: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Persistent Portal Lock state
  const [isPortalLocked, setIsPortalLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('moon_portal_locked') === 'true';
    } catch {
      return false;
    }
  });

  const OWNER_EMAILS = [
    'starknilex20050426@gmail.com',
    'admin@moonapparel.lk',
  ];

  // Sync portal lock status from Firestore
  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'store_access'));
        if (snap.exists()) {
          const locked = Boolean(snap.data()?.isPortalLocked);
          setIsPortalLocked(locked);
          localStorage.setItem('moon_portal_locked', String(locked));
        }
      } catch (err) {
        // Fallback to local storage state
      }
    };
    fetchLockStatus();
  }, []);

  // Helper to reliably persist users in local registry and backend API across sessions and devices
  const saveUserToRegistry = (profile: UserProfile) => {
    try {
      const raw = localStorage.getItem('moon_registered_users_registry');
      const existing: UserProfile[] = raw ? JSON.parse(raw) : [];
      const index = existing.findIndex(
        (u) =>
          (u.uid && profile.uid && u.uid === profile.uid) ||
          (u.email && profile.email && u.email.toLowerCase() === profile.email.toLowerCase())
      );
      if (index >= 0) {
        existing[index] = { ...existing[index], ...profile };
      } else {
        existing.push(profile);
      }
      localStorage.setItem('moon_registered_users_registry', JSON.stringify(existing));
    } catch (e) {
      console.warn('Error saving user to registry:', e);
    }

    // Also persist to server database across all devices and browsers
    try {
      apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});
    } catch {}
  };

  // Sync user profile document from Firestore
  const syncUserProfile = async (firebaseUser: User, extraData?: Partial<UserProfile>) => {
    const userEmail = (firebaseUser.email || '').toLowerCase();
    const isConfiguredOwner = OWNER_EMAILS.includes(userEmail);

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // The store owner email always keeps owner role
        let resolvedRole: UserRole = data.role as UserRole;
        if (isConfiguredOwner) {
          resolvedRole = 'owner';
        } else if (!resolvedRole || (resolvedRole as string) === 'admin') {
          resolvedRole = (resolvedRole as string) === 'admin' ? 'management' : 'customer';
        }

        const resolvedStatus: UserAccountStatus = data.accountStatus || 'active';

        const updatedProfile: UserProfile = {
          ...data,
          role: resolvedRole,
          accountStatus: resolvedStatus,
        };
        setUserProfile(updatedProfile);
        saveUserToRegistry(updatedProfile);

        if (data.role !== resolvedRole || !data.accountStatus) {
          await setDoc(userRef, { role: resolvedRole, accountStatus: resolvedStatus }, { merge: true });
        }
      } else {
        const assignedRole: UserRole = isConfiguredOwner ? 'owner' : (extraData?.role || 'customer');
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: extraData?.displayName || firebaseUser.displayName || (isConfiguredOwner ? 'Store Owner' : 'Customer'),
          phoneNumber: extraData?.phoneNumber || firebaseUser.phoneNumber || '',
          role: assignedRole,
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
          defaultDistrict: extraData?.defaultDistrict || 'Colombo',
        };
        await setDoc(userRef, newProfile, { merge: true });
        setUserProfile(newProfile);
        saveUserToRegistry(newProfile);
      }
    } catch (err) {
      console.warn('Profile sync fallback:', err);
      const assignedRole: UserRole = isConfiguredOwner ? 'owner' : (extraData?.role || 'customer');
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: extraData?.displayName || firebaseUser.displayName || (isConfiguredOwner ? 'Store Owner' : 'Customer'),
        phoneNumber: extraData?.phoneNumber || '',
        role: assignedRole,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        defaultDistrict: extraData?.defaultDistrict || 'Colombo',
      };
      setUserProfile(fallbackProfile);
      saveUserToRegistry(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(cred.user);
  };

  const signUpWithEmail = async (name: string, email: string, pass: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    const newCustomerProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: name,
      phoneNumber: phone || '',
      role: 'customer',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      defaultDistrict: 'Colombo',
    };
    saveUserToRegistry(newCustomerProfile);
    try {
      await setDoc(doc(db, 'users', cred.user.uid), newCustomerProfile, { merge: true });
    } catch (e) {
      console.warn('Direct user setDoc fallback in signUpWithEmail:', e);
    }
    await syncUserProfile(cred.user, { displayName: name, phoneNumber: phone, role: 'customer' });
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(cred.user);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateShippingProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profileData, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...profileData } : null));
    } catch (err) {
      console.warn('Error updating profile in Firestore:', err);
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    try {
      if (profileData.displayName && profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }

      const payload: Partial<UserProfile> = {
        ...profileData,
        defaultAddress: profileData.addressLine || profileData.defaultAddress,
        defaultCity: profileData.city || profileData.defaultCity,
        defaultDistrict: profileData.district || profileData.defaultDistrict,
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, payload, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...payload } : (payload as UserProfile)));
    } catch (err) {
      console.warn('Error updating user profile:', err);
      setUserProfile((prev) => (prev ? { ...prev, ...profileData } : null));
    }
  };

  const getUserOrders = async (): Promise<OrderConfirmation[]> => {
    if (!user) return [];
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const orders: OrderConfirmation[] = [];
      querySnapshot.forEach((d) => {
        orders.push(d.data() as OrderConfirmation);
      });
      orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      return orders;
    } catch (err) {
      console.warn('Error loading orders from Firestore:', err);
      const cached = localStorage.getItem(`moon_orders_${user.uid}`);
      return cached ? JSON.parse(cached) : [];
    }
  };

  const [adminSession, setAdminSession] = useState<boolean>(() => {
    try {
      return localStorage.getItem('moon_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  // Role calculations
  const isOwner = Boolean(
    (user?.email && OWNER_EMAILS.includes(user.email.toLowerCase())) ||
    userProfile?.role === 'owner'
  );

  const isManagement = Boolean(
    userProfile?.role === 'management' ||
    (userProfile?.role === ('admin' as any) && !isOwner)
  );

  const isCustomer = Boolean(!isOwner && !isManagement);

  // Management is locked out if owner locked the portal
  const isManagementLockedOut = Boolean(isManagement && isPortalLocked && !isOwner);

  // Normal customers or unauthenticated users CANNOT see the Admin Portal button!
  const canSeeAdminPortal = Boolean(isOwner || isManagement || adminSession);

  // Full admin access
  const isAdmin = Boolean(
    isOwner ||
    (isManagement && !isPortalLocked) ||
    adminSession
  );

  const togglePortalLock = async (locked: boolean) => {
    setIsPortalLocked(locked);
    try {
      localStorage.setItem('moon_portal_locked', String(locked));
      await setDoc(
        doc(db, 'settings', 'store_access'),
        {
          isPortalLocked: locked,
          lockedAt: new Date().toISOString(),
          lockedBy: user?.email || 'owner',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error saving portal lock state to Firestore:', err);
    }
  };

  const updateUserRoleAndStatus = async (
    targetUserId: string,
    role: UserRole,
    accountStatus: UserAccountStatus = 'active'
  ) => {
    // Only Store Owner (or master admin passkey session) can change Assign Role
    // Managers cannot change Assign Role (only account states)
    const isOwnerOrMaster = isOwner || adminSession;
    if (!isOwnerOrMaster) {
      try {
        const raw = localStorage.getItem('moon_registered_users_registry');
        const list: UserProfile[] = raw ? JSON.parse(raw) : [];
        const existing = list.find(
          (u) => u.uid === targetUserId || (u.email && u.email.toLowerCase() === targetUserId.toLowerCase())
        );
        if (existing && existing.role && existing.role !== role) {
          console.warn('Unauthorized: Manager account cannot change Assign Role.');
          throw new Error('Permission denied: Manager accounts cannot change Assign Role. Only the Store Owner can change user roles.');
        }
      } catch (err: any) {
        if (err?.message && err.message.includes('Permission denied')) {
          throw err;
        }
      }

      // Verify caller has management permissions for state changes
      if (!isManagement && !isAdmin) {
        throw new Error('Permission denied: Only Store Owner or Management can update user status.');
      }
    }

    // 1. Update in Firestore with graceful fallback
    try {
      const userRef = doc(db, 'users', targetUserId);
      await setDoc(userRef, { role, accountStatus }, { merge: true });
    } catch (err) {
      console.warn('Firestore user update fallback (saving locally):', err);
    }

    // 2. Update via Moon server API across all devices
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetUserId)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          accountStatus,
          callerRole: isOwner || adminSession ? 'owner' : isManagement ? 'management' : 'customer',
          callerEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update user role');
      }
    } catch (err: any) {
      if (err?.message && err.message.includes('Permission denied')) {
        throw err;
      }
      console.warn('Server user role update fallback:', err);
    }

    // 3. Update in local registry
    try {
      const raw = localStorage.getItem('moon_registered_users_registry');
      const list: UserProfile[] = raw ? JSON.parse(raw) : [];
      const updated = list.map((u) =>
        u.uid === targetUserId || (u.email && u.email.toLowerCase() === targetUserId.toLowerCase())
          ? { ...u, role, accountStatus }
          : u
      );
      localStorage.setItem('moon_registered_users_registry', JSON.stringify(updated));
    } catch {}

    // 4. If updating currently authenticated user, update local state
    if (user && (user.uid === targetUserId || user.email?.toLowerCase() === targetUserId.toLowerCase())) {
      setUserProfile((prev) => (prev ? { ...prev, role, accountStatus } : null));
    }
  };

  const createOrAddUser = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const newUid = profileData.uid || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullProfile: UserProfile = {
      uid: newUid,
      email: profileData.email || '',
      displayName: profileData.displayName || 'Customer',
      phoneNumber: profileData.phoneNumber || '',
      role: profileData.role || 'customer',
      accountStatus: profileData.accountStatus || 'active',
      district: profileData.district || 'Colombo',
      createdAt: new Date().toISOString(),
      ...profileData,
    };

    saveUserToRegistry(fullProfile);

    try {
      await setDoc(doc(db, 'users', newUid), fullProfile, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc in createOrAddUser fallback:', e);
    }

    return fullProfile;
  };

  const adminLogin = (passcode: string): boolean => {
    const validCodes = ['moon2026', 'admin123', 'stylish2026', 'moonadmin', 'moonapparel'];
    if (validCodes.includes(passcode.trim().toLowerCase())) {
      setAdminSession(true);
      try {
        localStorage.setItem('moon_admin_session', 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setAdminSession(false);
    try {
      localStorage.removeItem('moon_admin_session');
    } catch {}
  };

  const getAllOrders = async (): Promise<OrderConfirmation[]> => {
    const ordersMap = new Map<string, OrderConfirmation>();

    // 1. Fetch from server API
    try {
      const res = await apiFetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.orders && Array.isArray(json.orders)) {
          json.orders.forEach((ord: OrderConfirmation) => {
            if (ord && ord.orderId) {
              ordersMap.set(ord.orderId, ord);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching orders from server API:', err);
    }

    // 2. Fetch from Firestore
    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      querySnapshot.forEach((d) => {
        const ord = d.data() as OrderConfirmation;
        if (ord && ord.orderId) {
          ordersMap.set(ord.orderId, ord);
        }
      });
    } catch (err) {
      console.warn('Error fetching all orders from Firestore:', err);
    }

    // 3. Merge local storage cached orders
    const cached = localStorage.getItem('moon_all_orders_cache');
    if (cached) {
      try {
        const parsed: OrderConfirmation[] = JSON.parse(cached);
        parsed.forEach((ord) => {
          if (ord?.orderId && !ordersMap.has(ord.orderId)) {
            ordersMap.set(ord.orderId, ord);
          }
        });
      } catch {}
    }

    const all = Array.from(ordersMap.values());
    all.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    try {
      localStorage.setItem('moon_all_orders_cache', JSON.stringify(all));
    } catch {}
    return all;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderConfirmation['status'],
    trackingNumber?: string
  ): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const payload: Record<string, any> = { status };
      if (trackingNumber) {
        payload.trackingNumber = trackingNumber;
      }
      await updateDoc(orderRef, payload);
    } catch (err) {
      console.warn('updateDoc failed, using merge setDoc:', err);
      try {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, { status, ...(trackingNumber ? { trackingNumber } : {}) }, { merge: true });
      } catch (e) {
        console.warn('Failed to update status in Firestore:', e);
      }
    }

    // Update via Moon server API
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber }),
      });
    } catch {}

    // Update localStorage cache
    try {
      const cached = localStorage.getItem('moon_all_orders_cache');
      if (cached) {
        const orders: OrderConfirmation[] = JSON.parse(cached);
        const updated = orders.map((o) =>
          o.orderId === orderId ? { ...o, status, ...(trackingNumber ? { trackingNumber } : {}) } : o
        );
        localStorage.setItem('moon_all_orders_cache', JSON.stringify(updated));
      }
    } catch {}
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersMap = new Map<string, UserProfile>();

    // 1. Fetch from Moon Server API (Cross-device and shared across all sessions)
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.users && Array.isArray(json.users)) {
          json.users.forEach((u: UserProfile) => {
            if (u && (u.uid || u.email)) {
              const key = (u.email || u.uid).toLowerCase();
              usersMap.set(key, u);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Server users API query fallback:', err);
    }

    // 2. Fetch from Firestore users collection (if rules permit)
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      snap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u && (u.uid || u.email)) {
          const key = (u.email || u.uid).toLowerCase();
          const cleanUser = { ...u, uid: u.uid || d.id };
          if (!usersMap.has(key)) {
            usersMap.set(key, cleanUser);
          } else {
            usersMap.set(key, { ...cleanUser, ...usersMap.get(key) });
          }
          saveUserToRegistry(cleanUser);
        }
      });
    } catch (err) {
      console.warn('Firestore users collection query fallback (Permission rules or offline):', err);
    }

    // 3. Merge from local persistent registry
    try {
      const raw = localStorage.getItem('moon_registered_users_registry');
      if (raw) {
        const cached: UserProfile[] = JSON.parse(raw);
        cached.forEach((u) => {
          if (u && (u.uid || u.email)) {
            const key = (u.email || u.uid).toLowerCase();
            if (!usersMap.has(key)) {
              usersMap.set(key, u);
            } else {
              usersMap.set(key, { ...usersMap.get(key)!, ...u });
            }
          }
        });
      }
    } catch {}

    // 4. Extract customer accounts from all stored orders
    try {
      const allOrders = await getAllOrders();
      allOrders.forEach((ord) => {
        if (ord?.customer?.email) {
          const key = ord.customer.email.toLowerCase();
          if (!usersMap.has(key)) {
            const extracted: UserProfile = {
              uid: ord.userId || `cust-${Math.abs(key.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0))}`,
              email: ord.customer.email,
              displayName: ord.customer.fullName || 'Customer',
              phoneNumber: ord.customer.phone || '',
              role: key === 'starknilex20050426@gmail.com' ? 'owner' : 'customer',
              accountStatus: 'active',
              district: ord.customer.district || 'Colombo',
              addressLine: ord.customer.addressLine || '',
              city: ord.customer.city || '',
              createdAt: ord.orderDate || new Date().toISOString(),
            };
            usersMap.set(key, extracted);
            saveUserToRegistry(extracted);
          }
        }
      });
    } catch {}

    // 5. Always ensure the currently authenticated user is included!
    if (user || userProfile) {
      const userEmail = (user?.email || userProfile?.email || '').toLowerCase();
      if (userEmail) {
        const isOwnerAcc = userEmail === 'starknilex20050426@gmail.com' || userProfile?.role === 'owner';
        const currentProfile: UserProfile = {
          uid: user?.uid || userProfile?.uid || 'current-user-session',
          email: userEmail,
          displayName: userProfile?.displayName || user?.displayName || (isOwnerAcc ? 'Store Owner' : 'Customer'),
          phoneNumber: userProfile?.phoneNumber || user?.phoneNumber || '',
          role: isOwnerAcc ? 'owner' : (userProfile?.role || 'customer'),
          accountStatus: userProfile?.accountStatus || 'active',
          district: userProfile?.district || userProfile?.defaultDistrict || 'Colombo',
          createdAt: userProfile?.createdAt || new Date().toISOString(),
        };
        usersMap.set(userEmail, { ...(usersMap.get(userEmail) || {}), ...currentProfile });
        saveUserToRegistry(currentProfile);
      }
    }

    // 6. Ensure the Store Owner (starknilex20050426@gmail.com) is permanently present
    const ownerEmail = 'starknilex20050426@gmail.com';
    if (!usersMap.has(ownerEmail)) {
      const ownerProfile: UserProfile = {
        uid: user?.uid || 'owner-primary-uid',
        email: ownerEmail,
        displayName: 'Store Owner',
        phoneNumber: '+94 77 123 4567',
        role: 'owner',
        accountStatus: 'active',
        district: 'Colombo',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      usersMap.set(ownerEmail, ownerProfile);
      saveUserToRegistry(ownerProfile);
    }

    const list = Array.from(usersMap.values());
    list.sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      if (a.role === 'management' && b.role === 'customer') return -1;
      if (a.role === 'customer' && b.role === 'management') return 1;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

    return list;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isOwner,
        isManagement,
        isCustomer,
        canSeeAdminPortal,
        isPortalLocked,
        isManagementLockedOut,
        togglePortalLock,
        updateUserRoleAndStatus,
        createOrAddUser,
        adminSession,
        adminLogin,
        adminLogout,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOutUser,
        updateShippingProfile,
        updateUserProfile,
        getUserOrders,
        getAllOrders,
        updateOrderStatus,
        getAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
