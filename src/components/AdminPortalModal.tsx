import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Tag,
  Settings,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Shield,
  UserCheck,
  ArrowUpRight,
  Download,
  Filter,
  DollarSign,
  CreditCard,
  Building,
  Check,
  ChevronRight,
  ExternalLink,
  Copy,
  Sparkles,
  FolderTree,
  FolderPlus,
  FolderMinus,
  Layers,
  Upload,
  Image as ImageIcon,
  Camera,
  ArrowLeft,
  Smartphone,
  Mail,
  Send,
  Inbox,
  Key,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Server,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmailPreviewModal } from './EmailPreviewModal';
import { apiFetch } from '../lib/api';
import {
  Product,
  OrderConfirmation,
  Currency,
  PromoCode,
  UserRole,
  UserAccountStatus,
  UserProfile,
  StoreBankSettings,
  BankAccountDetails,
  CategoryGroup,
  HeroSettings,
} from '../types';
import { formatPrice } from '../utils/currency';
import { CATEGORIES_CONFIG } from '../data/products';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  products: Product[];
  onUpdateProducts: (updated: Product[]) => void;
  promoCodes: PromoCode[];
  onUpdatePromoCodes: (updated: PromoCode[]) => void;
  announcementText: string;
  onUpdateAnnouncement: (text: string) => void;
  isBannerVisible?: boolean;
  onToggleBannerVisibility?: (visible: boolean) => void;
  bankSettings?: StoreBankSettings;
  onUpdateBankSettings?: (updated: StoreBankSettings) => void;
  categories?: CategoryGroup[];
  onAddCategory?: (label: string, initialSubcategories?: string[]) => void;
  onRemoveCategory?: (categoryId: string) => void;
  onAddSubcategory?: (categoryId: string, subcategoryName: string) => void;
  onRemoveSubcategory?: (categoryId: string, subcategoryName: string) => void;
  onUpdateCategories?: (categories: CategoryGroup[]) => void;
  heroSettings?: HeroSettings;
  onUpdateHeroSettings?: (settings: Partial<HeroSettings>) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  currency,
  products,
  onUpdateProducts,
  promoCodes,
  onUpdatePromoCodes,
  announcementText,
  onUpdateAnnouncement,
  isBannerVisible = true,
  onToggleBannerVisibility,
  bankSettings,
  onUpdateBankSettings,
  categories,
  onAddCategory,
  onRemoveCategory,
  onAddSubcategory,
  onRemoveSubcategory,
  onUpdateCategories,
  heroSettings,
  onUpdateHeroSettings,
}) => {
  const {
    user,
    userProfile,
    isAdmin,
    isOwner,
    isManagement,
    isCustomer,
    isPortalLocked,
    isManagementLockedOut,
    togglePortalLock,
    updateUserRoleAndStatus,
    adminLogin,
    adminLogout,
    getAllOrders,
    updateOrderStatus,
    getAllUsers,
    createOrAddUser,
  } = useAuth();

  // Navigation tab in Admin Portal
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'promos' | 'customers' | 'settings'>('dashboard');

  // Current active categories (using dynamic prop or fallback to default config)
  const currentCategories = categories && categories.length > 0 ? categories : CATEGORIES_CONFIG;

  // Category and Subcategory Management Form State
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategorySubtypes, setNewCategorySubtypes] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryGroup | null>(null);

  // Inline Subcategory Adding state
  const [addingSubcatForCatId, setAddingSubcatForCatId] = useState<string | null>(null);
  const [newSubcatInput, setNewSubcatInput] = useState('');

  // Security passkey state if not signed in as recognized admin
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderConfirmation | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [tempTrackingNumber, setTempTrackingNumber] = useState('');

  // Bank Slip Preview modal
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);

  // Registered customers state
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Products manager state
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // File input refs for uploading photos from devices
  const addProductFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to process photo selected from device into a crisp web-optimized image
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file (JPG, PNG, WEBP).'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSubtitle, setNewProdSubtitle] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<string>('tops');
  const [newProdClothingType, setNewProdClothingType] = useState('T-Shirts');
  const [newProdPriceLKR, setNewProdPriceLKR] = useState(38000);
  const [newProdPriceUSD, setNewProdPriceUSD] = useState(125);
  const [newProdImage, setNewProdImage] = useState('/src/assets/images/product_heavyweight_tee_1791696503923.jpg');
  const [newProdGsm, setNewProdGsm] = useState('320 GSM');
  const [newProdFit, setNewProdFit] = useState('Relaxed Drop-Shoulder Fit');

  // Edit product form state (Update Item Details)
  const [editProdName, setEditProdName] = useState('');
  const [editProdSubtitle, setEditProdSubtitle] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<string>('tops');
  const [editProdClothingType, setEditProdClothingType] = useState('T-Shirts');
  const [editProdPriceLKR, setEditProdPriceLKR] = useState<number>(38000);
  const [editProdPriceUSD, setEditProdPriceUSD] = useState<number>(125);
  const [editProdOriginalPriceLKR, setEditProdOriginalPriceLKR] = useState<string>('');
  const [editProdOriginalPriceUSD, setEditProdOriginalPriceUSD] = useState<string>('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdGsm, setEditProdGsm] = useState('');
  const [editProdFit, setEditProdFit] = useState('');
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdInStock, setEditProdInStock] = useState(true);
  const [editProdIsNew, setEditProdIsNew] = useState(false);
  const [editProdSizes, setEditProdSizes] = useState<('XS' | 'S' | 'M' | 'L' | 'XL')[]>(['S', 'M', 'L', 'XL']);

  // Promo code form state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodePercent, setNewCodePercent] = useState<number>(10);
  const [newCodeDescription, setNewCodeDescription] = useState('');

  // Store announcement state
  const [tempAnnouncement, setTempAnnouncement] = useState(announcementText);
  const [announcementSavedToast, setAnnouncementSavedToast] = useState(false);

  useEffect(() => {
    setTempAnnouncement(announcementText);
  }, [announcementText]);

  // Bank Accounts Settings State (Configurable by Owner & Management)
  const defaultBankDetails: StoreBankSettings = {
    commercial: {
      bankName: 'Commercial Bank of Ceylon',
      accountName: 'MOON APPAREL (PVT) LTD',
      accountNumber: '1000 4829 1042',
      branch: 'Cinnamon Gardens Branch (Colombo 07)',
      swift: 'CCEYLKLX',
      bankCode: '7056',
    },
    sampath: {
      bankName: 'Sampath Bank PLC',
      accountName: 'MOON APPAREL (PVT) LTD',
      accountNumber: '0192 1004 8831',
      branch: 'Colombo Super Branch',
      swift: 'SAMPKLX',
      bankCode: '7278',
    },
  };

  const [editingBankSettings, setEditingBankSettings] = useState<StoreBankSettings>(bankSettings || defaultBankDetails);
  const [activeBankEditTab, setActiveBankEditTab] = useState<'commercial' | 'sampath'>('commercial');

  useEffect(() => {
    if (bankSettings) {
      setEditingBankSettings(bankSettings);
    }
  }, [bankSettings]);

  const handleBankFieldChange = (
    bankKey: 'commercial' | 'sampath',
    field: keyof BankAccountDetails,
    val: string
  ) => {
    setEditingBankSettings((prev) => ({
      ...prev,
      [bankKey]: {
        ...prev[bankKey],
        [field]: val,
      },
    }));
  };

  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBankSettings) {
      onUpdateBankSettings(editingBankSettings);
    }
    showToast('Bank transfer details updated successfully! Live on checkout.');
  };

  // Toast feedback
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3000);
  };

  // Email Preview & Resend state
  const [previewEmailOrderId, setPreviewEmailOrderId] = useState<string | null>(null);
  const [previewEmailRecipient, setPreviewEmailRecipient] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);

  // Auto-Email Configuration state
  const [autoSendOrderEmail, setAutoSendOrderEmail] = useState(true);
  const [notifyOwnerOnNewOrder, setNotifyOwnerOnNewOrder] = useState(true);
  const [senderName, setSenderName] = useState('MOON APPAREL ATELIER');
  const [senderEmail, setSenderEmail] = useState('orders@moon-clothing.com');
  const [ownerEmail, setOwnerEmail] = useState('starknilex20050426@gmail.com');
  const [smtpConfig, setSmtpConfig] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
  });
  const [showSmtpAdvanced, setShowSmtpAdvanced] = useState(true);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isSavingEmailSettings, setIsSavingEmailSettings] = useState(false);
  const [sentEmailLogs, setSentEmailLogs] = useState<any[]>([]);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);

  // Cloud Backend URL & Hosting Architecture state
  const [backendUrlInput, setBackendUrlInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moon_backend_url') || '';
    }
    return '';
  });
  const [isTestingBackendPing, setIsTestingBackendPing] = useState(false);
  const [backendPingResult, setBackendPingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Main Hero & Lookbook Campaign Photo Customizer state
  const [heroImgInput, setHeroImgInput] = useState(heroSettings?.imageUrl || '');
  const [heroSubtitleInput, setHeroSubtitleInput] = useState(heroSettings?.subtitle || 'Lookbook 2026');
  const [heroTitleInput, setHeroTitleInput] = useState(heroSettings?.title || 'Concrete & Light · Silhouette Study');
  const [heroBadgeInput, setHeroBadgeInput] = useState(heroSettings?.badge || 'Drop 01');
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (heroSettings) {
      setHeroImgInput(heroSettings.imageUrl || '');
      setHeroSubtitleInput(heroSettings.subtitle || 'Lookbook 2026');
      setHeroTitleInput(heroSettings.title || 'Concrete & Light · Silhouette Study');
      setHeroBadgeInput(heroSettings.badge || 'Drop 01');
    }
  }, [heroSettings]);

  const handleSaveHeroSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateHeroSettings) {
      onUpdateHeroSettings({
        imageUrl: heroImgInput.trim(),
        subtitle: heroSubtitleInput.trim(),
        title: heroTitleInput.trim(),
        badge: heroBadgeInput.trim(),
      });
      showToast('Hero lookbook photo & campaign captions saved successfully!');
    }
  };

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file is too large. Please select an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setHeroImgInput(result);
        if (onUpdateHeroSettings) {
          onUpdateHeroSettings({ imageUrl: result });
        }
        showToast('New hero photo selected! Click "Save Hero Photo" to confirm.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetHeroToDefault = () => {
    setHeroImgInput('');
    setHeroSubtitleInput('Lookbook 2026');
    setHeroTitleInput('Concrete & Light · Silhouette Study');
    setHeroBadgeInput('Drop 01');
    if (onUpdateHeroSettings) {
      onUpdateHeroSettings({
        imageUrl: '',
        subtitle: 'Lookbook 2026',
        title: 'Concrete & Light · Silhouette Study',
        badge: 'Drop 01',
      });
    }
    showToast('Reset hero photo to default brand campaign!');
  };

  const handleTestAndSaveBackendUrl = async () => {
    const trimmed = backendUrlInput.trim().replace(/\/$/, '');
    setIsTestingBackendPing(true);
    setBackendPingResult(null);
    try {
      const pingUrl = trimmed ? `${trimmed}/api/settings` : '/api/settings';
      const res = await fetch(pingUrl);
      if (res.ok) {
        if (trimmed) {
          localStorage.setItem('moon_backend_url', trimmed);
        } else {
          localStorage.removeItem('moon_backend_url');
        }
        setBackendPingResult({
          success: true,
          message: '✓ Backend connection successful! Live API & auto-emails are verified.',
        });
        showToast('✓ Backend connected & saved successfully!');
      } else {
        setBackendPingResult({
          success: false,
          message: `Backend responded with HTTP ${res.status}. Verify the URL and that your Vercel deployment has finished.`,
        });
        showToast('Backend responded with an error');
      }
    } catch {
      setBackendPingResult({
        success: false,
        message: `Failed to connect to ${trimmed || 'current origin'}. Check that your Vercel backend deployment is live.`,
      });
      showToast('Connection failed');
    } finally {
      setIsTestingBackendPing(false);
    }
  };

  // Load server settings on mount/open
  useEffect(() => {
    if (!isOpen) return;
    apiFetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings?.emailSettings) {
          const em = data.settings.emailSettings;
          if (typeof em.autoSendOrderEmail === 'boolean') setAutoSendOrderEmail(em.autoSendOrderEmail);
          if (typeof em.notifyOwnerOnNewOrder === 'boolean') setNotifyOwnerOnNewOrder(em.notifyOwnerOnNewOrder);
          if (em.senderName) setSenderName(em.senderName);
          if (em.senderEmail) setSenderEmail(em.senderEmail);
          if (em.ownerNotificationEmail) setOwnerEmail(em.ownerNotificationEmail);
          if (em.smtpConfig) {
            setSmtpConfig({
              enabled: em.smtpConfig.enabled !== false,
              host: em.smtpConfig.host || 'smtp.gmail.com',
              port: Number(em.smtpConfig.port) || 465,
              secure: typeof em.smtpConfig.secure === 'boolean' ? em.smtpConfig.secure : true,
              user: em.smtpConfig.user || '',
              pass: em.smtpConfig.pass || '',
            });
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const [showSpamGuide, setShowSpamGuide] = useState(false);

  const alignSenderEmailWithGmail = () => {
    const target = (smtpConfig.user || ownerEmail || '').trim();
    if (!target) {
      showToast('Enter your Gmail address in the SMTP Username field first.');
      return;
    }
    setSenderEmail(target);
    showToast(`Sender Email aligned to ${target} (Guarantees SPF/DKIM authentication!)`);
  };

  const applyGmailPreset = () => {
    const userToUse = (senderEmail && senderEmail.toLowerCase().endsWith('@gmail.com') ? senderEmail : (ownerEmail || 'lerninganimation@gmail.com')).trim();
    setSmtpConfig((prev) => ({
      ...prev,
      enabled: true,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: prev.user || userToUse,
    }));
    setShowSmtpAdvanced(true);
    setSmtpTestResult(null);
    showToast('Applied Gmail preset (smtp.gmail.com:465 SSL). Paste your 16-character App Password below.');
  };

  const handleSaveEmailSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingEmailSettings(true);
    try {
      const cleanedConfig = {
        ...smtpConfig,
        user: (smtpConfig.user || '').trim(),
        pass: (smtpConfig.pass || '').trim().replace(/\s+/g, ''),
        host: (smtpConfig.host || 'smtp.gmail.com').trim(),
        port: Number(smtpConfig.port) || 465,
        enabled: Boolean(smtpConfig.user && smtpConfig.pass),
      };

      const res = await apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSettings: {
            autoSendOrderEmail,
            notifyOwnerOnNewOrder,
            senderName,
            senderEmail,
            ownerNotificationEmail: ownerEmail,
            smtpConfig: cleanedConfig,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Auto-email settings saved successfully!');
        if (data.settings?.emailSettings?.smtpConfig) {
          setSmtpConfig(data.settings.emailSettings.smtpConfig);
        }
      } else {
        showToast(data.message || 'Failed to update email settings');
      }
    } catch {
      showToast('Error saving email settings');
    } finally {
      setIsSavingEmailSettings(false);
    }
  };

  const handleVerifySmtpOnly = async () => {
    if (!smtpConfig.user || !smtpConfig.pass) {
      showToast('Please enter both Gmail username and App Password');
      setSmtpTestResult({
        success: false,
        message: 'Username/Email and 16-character Google App Password are required to test connection.',
      });
      return;
    }
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await apiFetch('/api/settings/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: {
            ...smtpConfig,
            user: (smtpConfig.user || '').trim(),
            pass: (smtpConfig.pass || '').trim().replace(/\s+/g, ''),
            host: (smtpConfig.host || 'smtp.gmail.com').trim(),
            port: Number(smtpConfig.port) || 465,
            enabled: true,
          },
          saveOnSuccess: true,
        }),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          // not JSON
        }
        setSmtpTestResult({
          success: false,
          message: `Backend API responded with ${errMessage}. Verify that the Live Backend API URL is saved and Vercel deployment has finished building.`,
        });
        showToast(`SMTP check failed (${res.status})`);
        return;
      }

      const data = await res.json();
      setSmtpTestResult({ success: data.success, message: data.message });
      if (data.success) {
        if (data.suggestedPort && data.suggestedPort !== smtpConfig.port) {
          setSmtpConfig((prev) => ({
            ...prev,
            port: data.suggestedPort,
            secure: Boolean(data.suggestedSecure),
            enabled: true,
          }));
        } else {
          setSmtpConfig((prev) => ({ ...prev, enabled: true }));
        }
        showToast('✓ Connected to SMTP successfully & credentials saved!');
      } else {
        showToast('SMTP check failed. See message details below.');
      }
    } catch {
      setSmtpTestResult({
        success: false,
        message: 'Network error checking SMTP connection with backend server. Check that your Live Backend API URL in Store Settings is configured.',
      });
      showToast('Connection check failed');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setSmtpTestResult(null);
    try {
      const res = await apiFetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: ownerEmail,
          smtpConfig: {
            ...smtpConfig,
            user: (smtpConfig.user || '').trim(),
            pass: (smtpConfig.pass || '').trim().replace(/\s+/g, ''),
            host: (smtpConfig.host || 'smtp.gmail.com').trim(),
            port: Number(smtpConfig.port) || 465,
            enabled: Boolean(smtpConfig.user && smtpConfig.pass),
          },
          senderName,
          senderEmail,
          saveConfig: true,
        }),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          // not JSON
        }
        setSmtpTestResult({
          success: false,
          message: `Backend API responded with ${errMessage}. Please verify your Backend API URL and Vercel deployment.`,
        });
        showToast(`Send failed (${res.status})`);
        return;
      }

      const data = await res.json();
      setSmtpTestResult({ success: data.success, message: data.message });
      if (data.success) {
        showToast(data.message || `Test email dispatched to ${ownerEmail}!`);
        fetchEmailLogs();
      } else {
        showToast(data.message || 'Failed to dispatch test email');
      }
    } catch {
      setSmtpTestResult({
        success: false,
        message: 'Network error trying to dispatch test email. Check your Live Backend API URL configuration.',
      });
      showToast('Error sending test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleResendOrderEmail = async (order: OrderConfirmation) => {
    setResendingOrderId(order.orderId);
    try {
      const res = await apiFetch(`/api/orders/${encodeURIComponent(order.orderId)}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRecipient: order.customer.email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Confirmation email dispatched to ${order.customer.email}`);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === order.orderId
              ? { ...o, emailStatus: 'sent', emailSentAt: new Date().toISOString() }
              : o
          )
        );
        if (selectedOrder && selectedOrder.orderId === order.orderId) {
          setSelectedOrder({ ...selectedOrder, emailStatus: 'sent', emailSentAt: new Date().toISOString() });
        }
      } else {
        showToast(data.message || 'Failed to resend email');
      }
    } catch {
      showToast('Error resending confirmation email');
    } finally {
      setResendingOrderId(null);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await apiFetch('/api/emails/recent');
      const data = await res.json();
      if (data.success) {
        setSentEmailLogs(data.emails || []);
      }
    } catch {}
    setShowEmailLogsModal(true);
  };

  // Sync orders from Firebase
  const refreshOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.warn('Error loading orders in Admin Portal:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Sync users from Firebase
  const refreshCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const data = await getAllUsers();
      setCustomers(data);
    } catch (e) {
      console.warn('Error loading users in Admin Portal:', e);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleUpdateUserRoleAndStatus = async (
    targetUserId: string,
    newRole: UserRole,
    newStatus: UserAccountStatus = 'active'
  ) => {
    // Only Store Owner can change Assign Role; managers can only change account states
    const existing = customers.find((c) => c.uid === targetUserId);
    const existingRole = existing?.role || 'customer';
    const isChangingRole = newRole !== existingRole;

    if (isChangingRole && !isOwner) {
      showToast('Permission denied: Manager accounts cannot change Assign Role. Only the Store Owner can change roles.');
      return;
    }

    const canManageStatus = isOwner || isManagement || isAdmin;
    if (!canManageStatus) {
      showToast('Permission denied: Store Owner or Management permission required.');
      return;
    }

    try {
      await updateUserRoleAndStatus(targetUserId, newRole, newStatus);
      setCustomers((prev) =>
        prev.map((c) => (c.uid === targetUserId ? { ...c, role: newRole, accountStatus: newStatus } : c))
      );
      if (isChangingRole) {
        showToast(`Role assigned as ${newRole.toUpperCase()} (Owner action)`);
      } else {
        showToast(`Account state updated to ${newStatus.toUpperCase()}`);
      }
    } catch (e: any) {
      console.error('Failed to update user role:', e);
      showToast(e?.message || 'Error updating user permissions in database.');
    }
  };

  // Add User Form State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('customer');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDistrict, setNewUserDistrict] = useState('Colombo');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      showToast('Please enter an email address.');
      return;
    }
    // Only Store Owner can assign staff roles; managers can create customer accounts
    const roleToAssign: UserRole = isOwner ? newUserRole : 'customer';
    try {
      const created = await createOrAddUser({
        displayName: newUserName.trim() || 'New User',
        email: newUserEmail.trim(),
        role: roleToAssign,
        phoneNumber: newUserPhone.trim(),
        district: newUserDistrict,
        accountStatus: 'active',
      });
      setCustomers((prev) => [created, ...prev.filter((u) => u.email.toLowerCase() !== created.email.toLowerCase())]);
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserRole('customer');
      showToast(`User ${created.displayName} created as ${(created.role || 'customer').toUpperCase()}`);
    } catch (err) {
      showToast('Error creating user profile.');
    }
  };

  const [showRulesTip, setShowRulesTip] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const recommendedRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(recommendedRules);
    setCopiedRules(true);
    showToast('Firestore rules copied to clipboard!');
    setTimeout(() => setCopiedRules(false), 2500);
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      refreshOrders();
      refreshCustomers();
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    setTempAnnouncement(announcementText);
  }, [announcementText]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(passcode);
    if (success) {
      setPasscodeError(false);
      setPasscode('');
      refreshOrders();
      refreshCustomers();
      showToast('Authenticated as Moon Store Administrator.');
    } else {
      setPasscodeError(true);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'pending_verification' && order.status !== 'pending_verification') return false;
      if (orderStatusFilter === 'confirmed' && order.status !== 'confirmed') return false;
      if (orderStatusFilter === 'dispatched' && order.status !== 'dispatched') return false;
      if (orderStatusFilter === 'delivered' && order.status !== 'delivered') return false;
      if (orderStatusFilter === 'cancelled' && order.status !== 'cancelled') return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchId = order.orderId.toLowerCase().includes(q);
      const matchName = order.customer.fullName.toLowerCase().includes(q);
      const matchEmail = order.customer.email.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.toLowerCase().includes(q);
      const matchDistrict = order.customer.district.toLowerCase().includes(q);
      return matchId || matchName || matchEmail || matchPhone || matchDistrict;
    }
    return true;
  });

  // Calculate metrics
  const totalRevenueLKR = orders.reduce((sum, o) => {
    if (o.status === 'cancelled') return sum;
    return sum + (o.currency === 'LKR' ? o.total : o.total * 300);
  }, 0);

  const pendingVerificationOrders = orders.filter((o) => o.status === 'pending_verification' || (o.paymentMethod === 'bank_transfer' && o.status !== 'confirmed' && o.status !== 'delivered' && o.status !== 'dispatched'));
  const bankOrdersCount = orders.filter((o) => o.paymentMethod === 'bank_transfer').length;
  const codOrdersCount = orders.filter((o) => o.paymentMethod === 'cod').length;

  // Handle Order Status Update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderConfirmation['status']) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, tempTrackingNumber || undefined);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus, ...(tempTrackingNumber ? { trackingNumber: tempTrackingNumber } : {}) } : o))
      );
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus, ...(tempTrackingNumber ? { trackingNumber: tempTrackingNumber } : {}) } : null);
      }
      showToast(`Order ${orderId} status updated to "${newStatus}".`);
      setTempTrackingNumber('');
    } catch (e) {
      console.error('Failed to update status:', e);
      showToast('Error updating status in Firebase.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Product actions
  const handleToggleProductStock = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const next = !p.inStock;
        showToast(`${p.name} is now ${next ? 'In Stock' : 'Marked Out of Stock'}`);
        return { ...p, inStock: next };
      }
      return p;
    });
    onUpdateProducts(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
    } catch {}
  };

  const handleUpdateProductPrice = (productId: string, priceLKR: number, priceUSD: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, priceLKR, priceUSD };
      }
      return p;
    });
    onUpdateProducts(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
    } catch {}
    showToast('Product prices updated successfully.');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newPiece: Product = {
      id: `mn-${Date.now().toString().slice(-4)}`,
      name: newProdName.trim(),
      subtitle: newProdSubtitle.trim() || 'Architectural Luxury Edition',
      category: newProdCategory,
      clothingType: newProdClothingType.trim() || 'Signature Piece',
      priceLKR: Number(newProdPriceLKR) || 38000,
      priceUSD: Number(newProdPriceUSD) || 125,
      image: newProdImage || '/src/assets/images/product_heavyweight_tee_1791696503923.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Onyx Black', hex: '#111111' },
        { name: 'Washed Grey', hex: '#4B4D50' },
      ],
      description: 'Engineered with signature architectural precision, dense natural textiles, and structured drape.',
      details: [
        '100% Organic Heavyweight Cotton',
        newProdGsm,
        newProdFit,
        'Engineered for Sri Lanka & Global climate',
      ],
      fabricGsm: newProdGsm,
      fit: newProdFit,
      careInstructions: 'Cold gentle machine wash inside out. Do not tumble dry.',
      inStock: true,
      isNew: true,
    };

    const updated = [newPiece, ...products];
    onUpdateProducts(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
    } catch {}

    // Also sync to server in background
    try {
      apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPiece),
      }).catch(() => {});
    } catch {}

    setIsAddProductModalOpen(false);
    setNewProdName('');
    setNewProdSubtitle('');
    setNewProdImage('/src/assets/images/product_heavyweight_tee_1791696503923.jpg');
    showToast(`Added "${newPiece.name}" to store catalog.`);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdSubtitle(product.subtitle || '');
    setEditProdCategory(product.category);
    setEditProdClothingType(product.clothingType);
    setEditProdPriceLKR(product.priceLKR);
    setEditProdPriceUSD(product.priceUSD);
    setEditProdOriginalPriceLKR(product.originalPriceLKR ? String(product.originalPriceLKR) : '');
    setEditProdOriginalPriceUSD(product.originalPriceUSD ? String(product.originalPriceUSD) : '');
    setEditProdImage(product.image);
    setEditProdGsm(product.fabricGsm || '');
    setEditProdFit(product.fit || '');
    setEditProdDescription(product.description || '');
    setEditProdInStock(product.inStock);
    setEditProdIsNew(Boolean(product.isNew));
    setEditProdSizes(product.sizes || ['S', 'M', 'L', 'XL']);
  };

  const handleUpdateProductDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdName.trim()) return;

    const parsedOrigLKR = editProdOriginalPriceLKR.trim() ? parseInt(editProdOriginalPriceLKR, 10) : undefined;
    const parsedOrigUSD = editProdOriginalPriceUSD.trim() ? parseInt(editProdOriginalPriceUSD, 10) : undefined;

    const updatedPiece: Product = {
      ...editingProduct,
      name: editProdName.trim(),
      subtitle: editProdSubtitle.trim(),
      category: editProdCategory,
      clothingType: editProdClothingType.trim() || editingProduct.clothingType,
      priceLKR: Number(editProdPriceLKR) || editingProduct.priceLKR,
      priceUSD: Number(editProdPriceUSD) || editingProduct.priceUSD,
      originalPriceLKR: parsedOrigLKR && !isNaN(parsedOrigLKR) ? parsedOrigLKR : undefined,
      originalPriceUSD: parsedOrigUSD && !isNaN(parsedOrigUSD) ? parsedOrigUSD : undefined,
      image: editProdImage || editingProduct.image,
      fabricGsm: editProdGsm.trim() || editingProduct.fabricGsm,
      fit: editProdFit.trim() || editingProduct.fit,
      description: editProdDescription.trim() || editingProduct.description,
      inStock: editProdInStock,
      isNew: editProdIsNew,
      sizes: editProdSizes.length > 0 ? editProdSizes : editingProduct.sizes,
    };

    const updated = products.map((p) => (p.id === editingProduct.id ? updatedPiece : p));
    onUpdateProducts(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
    } catch {}

    // Sync to server
    try {
      apiFetch(`/api/products/${encodeURIComponent(updatedPiece.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPiece),
      }).catch(() => {});
    } catch {}

    setEditingProduct(null);
    showToast(`Updated details for "${updatedPiece.name}".`);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to remove "${productName}" from the store catalog?`)) {
      return;
    }
    const updated = products.filter((p) => p.id !== productId);
    onUpdateProducts(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
    } catch {}

    try {
      apiFetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    if (editingProduct?.id === productId) {
      setEditingProduct(null);
    }
    showToast(`Removed "${productName}" from catalog.`);
  };

  const toggleEditSize = (sz: 'XS' | 'S' | 'M' | 'L' | 'XL') => {
    if (editProdSizes.includes(sz)) {
      if (editProdSizes.length === 1) {
        showToast('At least one size must be active.');
        return;
      }
      setEditProdSizes(editProdSizes.filter((s) => s !== sz));
    } else {
      setEditProdSizes([...editProdSizes, sz]);
    }
  };

  // Category & Subcategory Management Actions
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) {
      showToast('Please enter a category name.');
      return;
    }
    const initialSubs = newCategorySubtypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (onAddCategory) {
      onAddCategory(newCategoryLabel.trim(), initialSubs);
    }
    setNewCategoryLabel('');
    setNewCategoryId('');
    setNewCategorySubtypes('');
    setIsAddCategoryModalOpen(false);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    if (onRemoveCategory) {
      onRemoveCategory(categoryToDelete.id);
    }
    setCategoryToDelete(null);
  };

  const handleCreateSubcategory = (catId: string) => {
    if (!newSubcatInput.trim()) return;
    if (onAddSubcategory) {
      onAddSubcategory(catId, newSubcatInput.trim());
    }
    setNewSubcatInput('');
    setAddingSubcatForCatId(null);
  };

  const handleDeleteSubcategory = (catId: string, subName: string) => {
    if (onRemoveSubcategory) {
      onRemoveSubcategory(catId, subName);
    }
  };

  // Promo code actions
  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;

    const codeUpper = newCodeName.trim().toUpperCase();
    if (promoCodes.some((p) => p.code === codeUpper)) {
      showToast('This promo code already exists.');
      return;
    }

    const newPromo: PromoCode = {
      code: codeUpper,
      percent: newCodePercent,
      description: newCodeDescription.trim() || `${newCodePercent}% Storewide Privilege`,
      isActive: true,
    };

    const updated = [newPromo, ...promoCodes];
    onUpdatePromoCodes(updated);
    try {
      localStorage.setItem('moon_promo_codes', JSON.stringify(updated));
    } catch {}

    setNewCodeName('');
    setNewCodeDescription('');
    showToast(`Created promo code "${codeUpper}".`);
  };

  const handleTogglePromo = (code: string) => {
    const updated = promoCodes.map((p) => (p.code === code ? { ...p, isActive: !p.isActive } : p));
    onUpdatePromoCodes(updated);
    try {
      localStorage.setItem('moon_promo_codes', JSON.stringify(updated));
    } catch {}
    showToast(`Updated promo code ${code}.`);
  };

  const handleDeletePromo = (code: string) => {
    const updated = promoCodes.filter((p) => p.code !== code);
    onUpdatePromoCodes(updated);
    try {
      localStorage.setItem('moon_promo_codes', JSON.stringify(updated));
    } catch {}
    showToast(`Deleted promo code ${code}.`);
  };

  // Save announcement
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAnnouncement(tempAnnouncement);
    try {
      localStorage.setItem('moon_store_announcement', tempAnnouncement);
    } catch {}
    setAnnouncementSavedToast(true);
    setTimeout(() => setAnnouncementSavedToast(false), 3000);
    showToast('Store banner updated successfully!');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('No orders to export.');
      return;
    }
    const headers = ['OrderId,Date,CustomerName,Email,Phone,District,Address,PaymentMethod,Status,ItemsCount,TotalAmount,Currency'];
    const rows = orders.map((o) =>
      `"${o.orderId}","${o.orderDate}","${o.customer.fullName}","${o.customer.email}","${o.customer.phone}","${o.customer.district}","${o.customer.addressLine.replace(/"/g, '""')}","${o.paymentMethod}","${o.status || 'confirmed'}","${o.items.length}","${o.total}","${o.currency || 'LKR'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `moon_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded orders CSV.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="admin-portal-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="admin-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
        />

        {/* Modal Main Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-full sm:h-auto max-w-6xl bg-neutral-950 text-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-neutral-800 overflow-hidden z-10 sm:max-h-[94vh] flex flex-col my-auto"
        >
          {/* Toast Notification */}
          <AnimatePresence>
            {adminToast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white text-neutral-950 text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 border border-neutral-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{adminToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CASE 1: SIGNED IN AS NORMAL CUSTOMER */}
          {user && isCustomer && !isAdmin ? (
            <div className="p-8 sm:p-14 max-w-md mx-auto my-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                  Customer Account Detected
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Admin Portal Restricted
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  You are signed in with a Customer profile (<code className="text-neutral-300 font-mono">{user.email}</code>).
                  The Admin Portal is exclusively for store Management and the Owner.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
              >
                Return to Store
              </button>
            </div>
          ) : isManagementLockedOut ? (
            /* CASE 2: MANAGEMENT LOCKED OUT BY OWNER */
            <div className="p-8 sm:p-14 max-w-md mx-auto my-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 stroke-[1.5] text-red-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Portal Locked by Owner
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Management Access Restricted
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  The Store Owner has locked the Management Portal. Management accounts cannot access the admin page or modify store settings while the portal is locked.
                </p>
                <p className="text-[11px] text-neutral-500 mt-2 font-mono">
                  Only the Owner can unlock this portal.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
              >
                Close Portal
              </button>
            </div>
          ) : !isAdmin ? (
            /* CASE 3: UNVERIFIED GUEST - PASSKEY ENTRY */
            <div className="p-8 sm:p-14 max-w-md mx-auto my-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                  Staff & Owner Verification
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Moon Atelier Admin Portal
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Sign in with an authorized Management or Owner account, or enter master staff passkey.
                </p>
              </div>

              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setPasscodeError(false);
                    }}
                    placeholder="Enter Staff Passkey (e.g. moon2026)"
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-sm tracking-wider text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all font-mono"
                    autoFocus
                  />
                </div>

                {passcodeError && (
                  <p className="text-xs text-red-400 font-medium flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Incorrect passkey. Default master key is: <strong>moon2026</strong></span>
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
                  >
                    Authenticate & Enter
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-4 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white transition-colors cursor-pointer border border-neutral-800"
                  >
                    Exit
                  </button>
                </div>
              </form>

              <div className="pt-4 border-t border-neutral-900 text-[11px] text-neutral-500">
                <span>Default Passkey: </span>
                <button
                  type="button"
                  onClick={() => {
                    setPasscode('moon2026');
                    adminLogin('moon2026');
                    refreshOrders();
                  }}
                  className="text-amber-400 underline font-mono hover:text-amber-300 cursor-pointer"
                >
                  moon2026
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ADMIN PORTAL HEADER */}
              <div className="px-3.5 py-3 sm:px-8 sm:py-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-black text-xs shrink-0">
                    M
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h2 className="text-xs sm:text-base font-bold text-white tracking-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                        MOON · Store Management
                      </h2>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border shrink-0 ${
                        isOwner
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}>
                        {isOwner ? 'Owner' : isManagement ? 'Staff' : 'Admin'}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono truncate max-w-[180px] sm:max-w-none">
                      {user?.email || 'Store Administrator'} · Mobile Ready
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* CRITICAL: ONLY THE OWNER CAN SEE AND TOGGLE THE PORTAL LOCK OPTION */}
                  {isOwner && (
                    <button
                      onClick={async () => {
                        const nextLocked = !isPortalLocked;
                        await togglePortalLock(nextLocked);
                        showToast(
                          nextLocked
                            ? 'Portal locked! Management accounts are now blocked from accessing.'
                            : 'Portal unlocked! Management accounts can now access.'
                        );
                      }}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                        isPortalLocked
                          ? 'bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/30'
                          : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600'
                      }`}
                      title={
                        isPortalLocked
                          ? 'Portal is currently locked. Click to unlock for Management.'
                          : 'Click to lock portal. Management accounts will be restricted from accessing.'
                      }
                    >
                      {isPortalLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden xs:inline">Unlock</span>
                          <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-red-500/40 text-red-100 rounded font-mono uppercase">
                            LOCKED
                          </span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden xs:inline">Lock</span>
                          <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono uppercase">
                            OPEN
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* If Management user, show read-only status pill (no lock toggle) */}
                  {!isOwner && isManagement && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Management Active</span>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close Admin Portal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* NAVIGATION TABS BAR */}
              <div className="border-b border-neutral-800 bg-neutral-950 px-3 sm:px-8 pt-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none touch-pan-x">
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none touch-pan-x">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'dashboard'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Dashboard & KPIs</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      refreshOrders();
                    }}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'orders'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Customer Orders</span>
                    {pendingVerificationOrders.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-bold rounded-full text-[10px] animate-pulse">
                        {pendingVerificationOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'products'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Catalog & Stock</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({products.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'categories'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Categories & Subcategories</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({currentCategories.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('promos')}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'promos'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Discount Codes</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({promoCodes.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('customers');
                      refreshCustomers();
                    }}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'customers'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Users & Role Permissions</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({customers.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'settings'
                        ? 'border-white text-white bg-neutral-900/80 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Store Settings & Banner</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pb-1 text-xs">
                  <button
                    onClick={() => {
                      refreshOrders();
                      refreshCustomers();
                      showToast('Refreshed data from Firebase.');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-neutral-900 text-neutral-300 hover:text-white rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    title="Reload from Firebase Firestore"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* MAIN BODY CONTENT */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-neutral-950">
                {/* 1. DASHBOARD & KPIS */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Top Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Gross Revenue */}
                      <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-neutral-400 text-xs">
                          <span>Total Recorded Revenue</span>
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                          {formatPrice(totalRevenueLKR, 'LKR')}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          ≈ ${Math.round(totalRevenueLKR / 300).toLocaleString()} USD
                        </p>
                      </div>

                      {/* Total Orders */}
                      <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-neutral-400 text-xs">
                          <span>Total Purchases</span>
                          <Package className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                          {orders.length}
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {bankOrdersCount} Bank Transfer · {codOrdersCount} Cash on Delivery
                        </p>
                      </div>

                      {/* Pending Slip Verifications */}
                      <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-neutral-400 text-xs">
                          <span>Slips To Verify</span>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                          {pendingVerificationOrders.length}
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {pendingVerificationOrders.length > 0 ? 'Requires bank deposit approval' : 'All slips verified'}
                        </p>
                      </div>

                      {/* Products in catalog */}
                      <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-neutral-400 text-xs">
                          <span>Catalog Items</span>
                          <ShoppingBag className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                          {products.length}
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {products.filter((p) => p.inStock).length} in stock · {products.filter((p) => !p.inStock).length} sold out
                        </p>
                      </div>
                    </div>

                    {/* Quick Operations Strip */}
                    <div className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <Building className="w-4 h-4 text-neutral-400" />
                        <span>Moon Apparel Atelier · Island-Wide Sri Lanka Courier Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Orders CSV</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('orders');
                            setOrderStatusFilter('pending_verification');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-neutral-950 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review Bank Slips</span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Orders Overview Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                        >
                          View all ({orders.length})
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="p-10 text-center bg-neutral-900/40 border border-neutral-800/60 rounded-2xl space-y-2">
                          <Package className="w-8 h-8 text-neutral-600 mx-auto" />
                          <p className="text-xs text-neutral-400">No orders placed in store yet.</p>
                        </div>
                      ) : (
                        <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/50">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                                <tr>
                                  <th className="py-3 px-4">Order ID</th>
                                  <th className="py-3 px-4">Customer</th>
                                  <th className="py-3 px-4">District</th>
                                  <th className="py-3 px-4">Payment</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Total</th>
                                  <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                                {orders.slice(0, 6).map((o, oIdx) => (
                                  <tr key={o.orderId ? `${o.orderId}-${oIdx}` : `dash-order-${oIdx}`} className="hover:bg-neutral-800/40 transition-colors">
                                    <td className="py-3 px-4 font-bold text-white">{o.orderId}</td>
                                    <td className="py-3 px-4 font-sans text-neutral-200">
                                      <div className="font-semibold">{o.customer.fullName}</div>
                                      <div className="text-[10px] text-neutral-500 font-mono">{o.customer.phone}</div>
                                    </td>
                                    <td className="py-3 px-4 font-sans text-neutral-300">{o.customer.district}</td>
                                    <td className="py-3 px-4 font-sans">
                                      {o.paymentMethod === 'bank_transfer' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                          Bank Slip
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                          Cash on Delivery
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 font-sans">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                          o.status === 'confirmed'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : o.status === 'pending_verification'
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : o.status === 'dispatched'
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : o.status === 'delivered'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-neutral-800 text-neutral-400'
                                        }`}
                                      >
                                        {o.status || 'Confirmed'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-bold text-white">
                                      {formatPrice(o.total, o.currency || 'LKR')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={() => {
                                          setSelectedOrder(o);
                                          setActiveTab('orders');
                                        }}
                                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[11px] font-sans font-semibold cursor-pointer"
                                      >
                                        Manage
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CUSTOMER ORDERS & VERIFICATION */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    {/* Controls & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {['all', 'pending_verification', 'confirmed', 'dispatched', 'delivered', 'cancelled'].map((st, sIdx) => (
                          <button
                            key={`order-filter-${st}-${sIdx}`}
                            onClick={() => setOrderStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                              orderStatusFilter === st
                                ? 'bg-white text-neutral-950'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                            }`}
                          >
                            {st === 'pending_verification' ? 'To Verify' : st}
                          </button>
                        ))}
                      </div>

                      {/* Search Bar */}
                      <div className="relative min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          placeholder="Search orders, phone, district..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Orders List & Inspection Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Orders list */}
                      <div className={`${selectedOrder ? 'hidden lg:block lg:col-span-6' : 'col-span-1 lg:col-span-12'} space-y-3`}>
                        {isLoadingOrders ? (
                          <div className="py-20 text-center space-y-3">
                            <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-neutral-500 font-mono">Syncing orders with Firebase...</p>
                          </div>
                        ) : filteredOrders.length === 0 ? (
                          <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-2">
                            <Package className="w-8 h-8 text-neutral-600 mx-auto" />
                            <p className="text-xs text-neutral-400">No matching orders found.</p>
                          </div>
                        ) : (
                          filteredOrders.map((order, oIdx) => {
                            const isSelected = selectedOrder?.orderId === order.orderId;
                            return (
                              <div
                                key={order.orderId ? `${order.orderId}-${oIdx}` : `filter-order-${oIdx}`}
                                onClick={() => setSelectedOrder(order)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-neutral-900 border-white shadow-lg'
                                    : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-800/60">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-white">
                                      {order.orderId}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 font-mono">
                                      {new Date(order.orderDate).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {order.bankReceipt && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Bank Slip
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                        order.status === 'confirmed'
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : order.status === 'pending_verification'
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : order.status === 'dispatched'
                                          ? 'bg-blue-500/20 text-blue-300'
                                          : 'bg-neutral-800 text-neutral-400'
                                      }`}
                                    >
                                      {order.status || 'Confirmed'}
                                    </span>
                                  </div>
                                </div>

                                <div className="py-2.5 flex items-center justify-between text-xs">
                                  <div>
                                    <p className="font-bold text-white">{order.customer.fullName}</p>
                                    <p className="text-[11px] text-neutral-400">
                                      {order.customer.phone} · {order.customer.district}, LK
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <span className="font-mono text-sm font-bold text-white">
                                      {formatPrice(order.total, order.currency || 'LKR')}
                                    </span>
                                    <p className="text-[10px] text-neutral-500">
                                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Right: Selected Order Detail & Verification Panel */}
                      {selectedOrder && (
                        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 sticky top-4">
                          {/* Mobile Back Button to Orders List */}
                          <div className="lg:hidden pb-2 border-b border-neutral-800/80 flex items-center justify-between">
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to Orders List</span>
                            </button>
                            <span className="text-[11px] text-neutral-400 font-mono">{selectedOrder.orderId}</span>
                          </div>

                          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-white font-mono">
                                  {selectedOrder.orderId}
                                </h4>
                                <span className="text-xs text-neutral-500">· Details</span>
                              </div>
                              <p className="text-xs text-neutral-400">
                                Placed {new Date(selectedOrder.orderDate).toLocaleString()}
                              </p>
                            </div>

                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Order Status Controller */}
                          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                            <label className="block text-xs font-bold text-neutral-300">
                              Fulfillment & Verification Status
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(['pending_verification', 'confirmed', 'dispatched', 'delivered', 'cancelled'] as const).map(
                                (st, sIdx) => (
                                  <button
                                    key={`order-detail-status-${st}-${sIdx}`}
                                    onClick={() => handleUpdateStatus(selectedOrder.orderId, st)}
                                    disabled={updatingOrderId === selectedOrder.orderId}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                                      selectedOrder.status === st
                                        ? 'bg-white text-neutral-950 font-bold shadow-xs'
                                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                                    }`}
                                  >
                                    {st.replace('_', ' ')}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Bank Transfer Slip Review (if attached) */}
                          {selectedOrder.bankReceipt && (
                            <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
                                  <FileText className="w-4 h-4" />
                                  <span>Attached Bank Deposit Slip</span>
                                </div>
                                {selectedOrder.status === 'pending_verification' && (
                                  <button
                                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'confirmed')}
                                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve Slip</span>
                                  </button>
                                )}
                              </div>

                              <div className="text-xs text-neutral-300 space-y-1 font-mono">
                                <div>Bank: <strong>{selectedOrder.bankReceipt.bankName}</strong></div>
                                <div>Depositor: <strong>{selectedOrder.bankReceipt.depositorName || 'N/A'}</strong></div>
                                <div>Reference: <strong>{selectedOrder.bankReceipt.transactionRef || 'N/A'}</strong></div>
                                <div className="text-[11px] text-neutral-400">File: {selectedOrder.bankReceipt.fileName} ({selectedOrder.bankReceipt.fileSize})</div>
                              </div>

                              {selectedOrder.bankReceipt.previewUrl && (
                                <button
                                  onClick={() => setPreviewSlipUrl(selectedOrder.bankReceipt!.previewUrl!)}
                                  className="w-full py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 text-xs font-semibold rounded-lg border border-blue-800/60 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View High-Res Bank Slip</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Customer & Shipping info */}
                          <div className="space-y-2 text-xs">
                            <h5 className="font-bold text-neutral-300 uppercase text-[10px] tracking-wider">
                              Customer Delivery Address
                            </h5>
                            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-neutral-300">
                              <p className="font-bold text-white">{selectedOrder.customer.fullName}</p>
                              <p>{selectedOrder.customer.addressLine} {selectedOrder.customer.apartment}</p>
                              <p>{selectedOrder.customer.city}, {selectedOrder.customer.district} District, {selectedOrder.customer.postalCode}</p>
                              <p className="font-mono text-neutral-400 pt-1">
                                Phone: <a href={`tel:${selectedOrder.customer.phone}`} className="text-amber-400 underline">{selectedOrder.customer.phone}</a>
                              </p>
                              <p className="font-mono text-neutral-400">
                                Email: {selectedOrder.customer.email}
                              </p>
                            </div>
                          </div>

                          {/* Courier Tracking update */}
                          <div className="space-y-2 text-xs">
                            <h5 className="font-bold text-neutral-300 uppercase text-[10px] tracking-wider">
                              Courier Tracking Assignment
                            </h5>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={tempTrackingNumber}
                                onChange={(e) => setTempTrackingNumber(e.target.value)}
                                placeholder={selectedOrder.trackingNumber || 'e.g. DOMEX-9482910'}
                                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-white"
                              />
                              <button
                                onClick={() => handleUpdateStatus(selectedOrder.orderId, selectedOrder.status || 'dispatched')}
                                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Save Tracking
                              </button>
                            </div>
                          </div>

                          {/* Order items breakdown */}
                          <div className="space-y-2 text-xs">
                            <h5 className="font-bold text-neutral-300 uppercase text-[10px] tracking-wider">
                              Purchased Items ({selectedOrder.items.length})
                            </h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {selectedOrder.items.map((item, idx) => (
                                <div
                                  key={item.id ? `${item.id}-${idx}` : `sel-order-item-${selectedOrder.orderId}-${idx}`}
                                  className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-10 h-12 object-cover rounded-lg bg-neutral-900"
                                    />
                                    <div>
                                      <p className="font-semibold text-white line-clamp-1">{item.product.name}</p>
                                      <p className="text-[11px] text-neutral-400 font-mono">
                                        Size: {item.size} · Color: {item.color.name} · Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="font-mono font-bold text-white text-xs">
                                    {formatPrice(
                                      (selectedOrder.currency === 'USD' ? item.product.priceUSD : item.product.priceLKR) *
                                        item.quantity,
                                      selectedOrder.currency || 'LKR'
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total Breakdown */}
                          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
                            <span className="text-neutral-400">Grand Total</span>
                            <span className="font-mono font-bold text-base text-white">
                              {formatPrice(selectedOrder.total, selectedOrder.currency || 'LKR')}
                            </span>
                          </div>

                          {/* Auto-Email Dispatch Status & Actions */}
                          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-amber-400" />
                                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                                  Customer Confirmation Email
                                </h5>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 ${
                                selectedOrder.emailStatus === 'sent' || selectedOrder.emailSentAt
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                <Check className="w-2.5 h-2.5" />
                                {selectedOrder.emailStatus === 'sent' || selectedOrder.emailSentAt
                                  ? 'Delivered'
                                  : 'Auto-Dispatch Ready'}
                              </span>
                            </div>

                            <p className="text-[11px] text-neutral-400">
                              Recipient: <strong className="text-white font-mono">{selectedOrder.customer.email}</strong>
                              {selectedOrder.emailSentAt && (
                                <span className="text-neutral-500 ml-1">
                                  · Sent at {new Date(selectedOrder.emailSentAt).toLocaleTimeString()}
                                </span>
                              )}
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewEmailOrderId(selectedOrder.orderId);
                                  setPreviewEmailRecipient(selectedOrder.customer.email);
                                  setIsEmailModalOpen(true);
                                }}
                                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Preview Email</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResendOrderEmail(selectedOrder)}
                                disabled={resendingOrderId === selectedOrder.orderId}
                                className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                                title="Resend email to customer"
                              >
                                {resendingOrderId === selectedOrder.orderId ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Resend</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. PRODUCT CATALOG & INVENTORY MANAGER */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    {/* Catalog Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0 touch-pan-x">
                        {Array.from(new Set(['all', ...currentCategories.map((c) => c.id)])).map((cat, catIdx) => {
                          const catObj = currentCategories.find((c) => c.id === cat);
                          const label = cat === 'all' ? 'All' : catObj?.label || cat;
                          return (
                            <button
                              key={`admin-cat-filter-${cat}-${catIdx}`}
                              onClick={() => setProductCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                productCategoryFilter === cat
                                  ? 'bg-white text-neutral-950 font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <button
                          onClick={() => setActiveTab('categories')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl hover:border-neutral-700 transition-colors cursor-pointer shrink-0"
                          title="Manage Categories and Subcategories"
                        >
                          <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                          <span className="inline">Categories</span>
                          <span className="text-[10px] text-neutral-500 font-mono">({currentCategories.length})</span>
                        </button>

                        <div className="relative flex-1 sm:min-w-[180px]">
                          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search catalog..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all font-sans"
                          />
                        </div>

                        <button
                          onClick={() => setIsAddProductModalOpen(true)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Piece</span>
                        </button>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products
                        .filter((p) => {
                          if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
                          if (productSearch.trim()) {
                            const q = productSearch.toLowerCase();
                            return p.name.toLowerCase().includes(q) || p.clothingType.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map((product, pIdx) => (
                          <div
                            key={product.id ? `${product.id}-${pIdx}` : `admin-prod-${pIdx}`}
                            className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3 flex flex-col justify-between"
                          >
                            <div className="flex gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-20 object-cover rounded-xl bg-neutral-950 shrink-0 border border-neutral-800"
                              />
                              <div className="space-y-1 flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                  {product.clothingType} · {product.category}
                                </span>
                                <h4 className="text-xs font-bold text-white line-clamp-1">
                                  {product.name}
                                </h4>
                                <div className="text-[11px] font-mono text-neutral-300">
                                  LKR {product.priceLKR?.toLocaleString()} · ${product.priceUSD} USD
                                </div>
                                <div className="text-[10px] text-neutral-500">
                                  {product.fabricGsm} · {product.fit}
                                </div>
                              </div>
                            </div>

                            {/* Inventory Toggle & Update Details actions */}
                            <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleProductStock(product.id)}
                                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer min-h-[34px] flex items-center ${
                                    product.inStock
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  }`}
                                  title="Toggle stock status"
                                >
                                  {product.inStock ? '● In Stock' : '○ Sold Out'}
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditProductModal(product)}
                                  className="px-3 py-1.5 text-[11px] font-bold bg-white text-neutral-950 hover:bg-neutral-200 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm min-h-[34px]"
                                  title={`Update details for ${product.name}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-neutral-900" />
                                  <span>Update Details</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                  title={`Remove "${product.name}" from catalog`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* CATEGORIES & SUBCATEGORIES ARCHITECTURE */}
                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    {/* Header and Top Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <FolderTree className="w-4 h-4 text-amber-400" />
                            <span>Category & Subcategory Architecture</span>
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                            {currentCategories.length} Departments
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Add or remove top-level store categories, and manage subcategories (clothing types) under each.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsAddCategoryModalOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shrink-0 shadow-sm"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Add New Category</span>
                        </button>
                      </div>
                    </div>

                    {/* Informational Guidance Banner */}
                    <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Two-tier Navigation: Categories & Subcategories
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Categories appear in top navigation & department tabs. Subcategories (clothing types) let shoppers filter pieces quickly.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          Total Subcategories: {currentCategories.reduce((acc, c) => acc + c.clothingTypes.length, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {currentCategories.map((catGroup, cIdx) => {
                        const matchingProducts = products.filter((p) => p.category === catGroup.id);
                        const isAddingSubcat = addingSubcatForCatId === catGroup.id;

                        return (
                          <div
                            key={catGroup.id ? `${catGroup.id}-${cIdx}` : `cat-group-${cIdx}`}
                            className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-neutral-700/80 transition-all shadow-sm"
                          >
                            {/* Top: Category Title, Slug, Product Count, and Delete Category Button */}
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-white tracking-wide">
                                      {catGroup.label}
                                    </h4>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono border border-neutral-700/60">
                                      id: {catGroup.id}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-400 flex items-center gap-2">
                                    <span>{matchingProducts.length} pieces in this category</span>
                                    <span>·</span>
                                    <span>{catGroup.clothingTypes.length} subcategories</span>
                                  </p>
                                </div>

                                <button
                                  onClick={() => setCategoryToDelete(catGroup)}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title={`Remove category "${catGroup.label}"`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Subcategories (Clothing Types) Section */}
                              <div className="mt-4 pt-3.5 border-t border-neutral-800/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                    Subcategories / Clothing Types
                                  </span>
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    {catGroup.clothingTypes.length} total
                                  </span>
                                </div>

                                {/* List of Subcategory Pills with Remove (x) */}
                                {catGroup.clothingTypes.length === 0 ? (
                                  <p className="text-xs text-neutral-500 italic py-1">
                                    No subcategories created yet. Add one below.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {catGroup.clothingTypes.map((type, tIdx) => {
                                      const pieceCount = matchingProducts.filter((p) => p.clothingType === type).length;
                                      return (
                                        <div
                                          key={`subcat-${catGroup.id}-${type}-${tIdx}`}
                                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs text-neutral-200 transition-colors group"
                                        >
                                          <span className="font-medium">{type}</span>
                                          <span className="text-[10px] px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded font-mono">
                                            {pieceCount}
                                          </span>
                                          <button
                                            onClick={() => handleDeleteSubcategory(catGroup.id, type)}
                                            className="p-0.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                            title={`Remove subcategory "${type}"`}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom: Inline Add Subcategory form */}
                            <div className="pt-3 border-t border-neutral-800/60">
                              {isAddingSubcat ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreateSubcategory(catGroup.id);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    value={newSubcatInput}
                                    onChange={(e) => setNewSubcatInput(e.target.value)}
                                    placeholder="e.g. Graphic Tees, Tank Tops"
                                    autoFocus
                                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-sans"
                                  />
                                  <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingSubcatForCatId(null);
                                      setNewSubcatInput('');
                                    }}
                                    className="px-2.5 py-1.5 text-neutral-400 hover:text-white text-xs rounded-xl cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAddingSubcatForCatId(catGroup.id);
                                    setNewSubcatInput('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer py-1"
                                >
                                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Add Subcategory to {catGroup.label}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. PROMOTIONS & DISCOUNT CODES */}
                {activeTab === 'promos' && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">Active Store Discount Codes</h3>
                        <p className="text-xs text-neutral-400">
                          Coupons usable by customers in bag drawer and checkout
                        </p>
                      </div>
                    </div>

                    {/* New Promo Form */}
                    <form
                      onSubmit={handleAddPromoCode}
                      className="p-4 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3"
                    >
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Create New Promo Voucher
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Code Name</label>
                          <input
                            type="text"
                            value={newCodeName}
                            onChange={(e) => setNewCodeName(e.target.value)}
                            placeholder="e.g. VIP20"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono uppercase text-white focus:outline-none focus:border-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Percentage Off (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={newCodePercent}
                            onChange={(e) => setNewCodePercent(parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={newCodeDescription}
                            onChange={(e) => setNewCodeDescription(e.target.value)}
                            placeholder="e.g. Autumn Lookbook VIP"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Publish Promo Code</span>
                        </button>
                      </div>
                    </form>

                    {/* Promo Codes List */}
                    <div className="space-y-2.5">
                      {promoCodes.map((promo, prIdx) => (
                        <div
                          key={promo.code ? `${promo.code}-${prIdx}` : `promo-${prIdx}`}
                          className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 text-amber-400">
                              {promo.code}
                            </span>
                            <div>
                              <p className="font-semibold text-white">
                                {promo.percent ? `${promo.percent}% Discount` : `LKR ${promo.amountLKR?.toLocaleString()} Voucher`}
                              </p>
                              <p className="text-[11px] text-neutral-400">{promo.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePromo(promo.code)}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                                promo.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {promo.isActive ? 'Active' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => handleDeletePromo(promo.code)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg cursor-pointer"
                              title="Delete code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. USER MANAGEMENT & ROLE PERMISSIONS */}
                {activeTab === 'customers' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">Users & Role Permissions</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                            {customers.length} Accounts Registered
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {isOwner
                            ? 'Configure user status, promote to Management, or assign Owner permissions.'
                            : 'View registered users. (Note: Managers cannot change user roles or account states; Owner permission required).'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            refreshCustomers();
                            showToast('Refreshing users from Firebase & database...');
                          }}
                          className="p-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Refresh user directory from Firebase"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAddUserModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add User / Staff</span>
                        </button>
                      </div>
                    </div>

                    {/* ROLE ARCHITECTURE EXPLANATION CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Customer */}
                      <div className="p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            1. Customer
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded font-mono">
                            Default
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Standard shopper. Can browse, save default delivery addresses, and purchase pieces.
                          <strong className="text-neutral-300 block mt-1">Admin Portal option is NEVER shown to customers.</strong>
                        </p>
                      </div>

                      {/* Management */}
                      <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            2. Management
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                            Staff
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Store manager. Can access Admin Portal to update products, process orders, and inspect receipts.
                          <strong className="text-amber-300 block mt-1 font-semibold">● Manager CANNOT change user roles or account states.</strong>
                          <strong className="text-indigo-200 block mt-0.5">If Owner locks portal, Management cannot access.</strong>
                        </p>
                      </div>

                      {/* Owner */}
                      <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            3. Store Owner
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
                            Master
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Executive master account.
                          <strong className="text-amber-200 block mt-1 font-semibold">● Only the Owner can change user roles and account states.</strong>
                          <strong className="text-amber-300 block mt-0.5">Only the Owner sees and controls the Portal Lock toggle.</strong>
                        </p>
                      </div>
                    </div>

                    {/* Database & Multi-device Sync Status Banner */}
                    <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <div>
                          <p className="text-white font-bold text-xs flex items-center gap-2">
                            <span>Universal Cross-Device User Sync is Active</span>
                            <span className="text-[10px] px-2 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-normal">
                              Live
                            </span>
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Signed up customers and buyers across all browsers are registered in the Moon database and Firestore.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRulesTip(!showRulesTip)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-mono transition-colors cursor-pointer underline shrink-0"
                      >
                        {showRulesTip ? '▲ Hide Firebase Rules Guide' : '▼ Why might Firestore direct query block?'}
                      </button>
                    </div>

                    {showRulesTip && (
                      <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-3 text-xs text-amber-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-xs">Why Firebase might block user listing:</h4>
                            <p className="text-[11px] text-neutral-300 leading-relaxed">
                              When users sign up, Firebase Authentication registers them in Auth. However, by default, Cloud Firestore Security Rules on Firebase Console deny client-side queries (<code className="bg-neutral-900 px-1 py-0.5 rounded text-amber-300">PERMISSION_DENIED</code>) until rules are updated.
                            </p>
                            <p className="text-[11px] text-neutral-300 leading-relaxed">
                              Moon automatically persists all signed-up users across devices using the Moon server API. To also enable direct Firestore syncing, paste these rules into your Firebase Console: <strong className="text-white">Firestore Database → Rules</strong> tab:
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyRules}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                          </button>
                        </div>
                        <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                          {recommendedRules}
                        </pre>
                      </div>
                    )}

                    {isLoadingCustomers ? (
                      <div className="py-20 text-center space-y-3">
                        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-neutral-500 font-mono">Fetching users from Firebase...</p>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-2">
                        <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                        <p className="text-xs text-neutral-400">
                          {user ? `Connected user: ${user.email}.` : 'No users found in database yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/50">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                            <tr>
                              <th className="py-3 px-4">User</th>
                              <th className="py-3 px-4">Contact & Location</th>
                              <th className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span>Assign Role</span>
                                  {!isOwner && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-normal font-mono">
                                      Owner Only
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span>Account State</span>
                                  <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-normal font-mono">
                                    Owner & Manager
                                  </span>
                                </div>
                              </th>
                              <th className="py-3 px-4 text-right">Effective Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                            {customers
                              .filter((c) => {
                                if (!customerSearch.trim()) return true;
                                const q = customerSearch.toLowerCase();
                                return (
                                  (c.displayName || '').toLowerCase().includes(q) ||
                                  (c.email || '').toLowerCase().includes(q) ||
                                  (c.district || c.defaultDistrict || '').toLowerCase().includes(q) ||
                                  (c.role || '').toLowerCase().includes(q)
                                );
                              })
                              .map((cust, idx) => {
                                const currentRole: UserRole =
                                  cust.email?.toLowerCase() === 'starknilex20050426@gmail.com'
                                    ? 'owner'
                                    : (cust.role as UserRole) || 'customer';
                                const currentStatus: UserAccountStatus = cust.accountStatus || 'active';
                                const isPrimaryOwner = cust.email?.toLowerCase() === 'starknilex20050426@gmail.com';

                                return (
                                  <tr key={cust.uid ? `${cust.uid}-${idx}` : `cust-row-${idx}`} className="hover:bg-neutral-800/40 transition-colors">
                                    {/* User Info */}
                                    <td className="py-3 px-4 font-sans text-white">
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                          currentRole === 'owner'
                                            ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400/30'
                                            : currentRole === 'management'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-neutral-800 text-neutral-200'
                                        }`}>
                                          {(cust.displayName || cust.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-white text-xs truncate">
                                            {cust.displayName || 'Registered User'}
                                          </p>
                                          <p className="text-[11px] text-neutral-400 font-mono truncate">
                                            {cust.email}
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Contact & District */}
                                    <td className="py-3 px-4">
                                      <p className="text-[11px] text-neutral-300 font-sans">
                                        {cust.district || cust.defaultDistrict || 'Colombo, LK'}
                                      </p>
                                      <p className="text-[10px] text-neutral-500 font-mono">
                                        {cust.phoneNumber || 'No phone'}
                                      </p>
                                    </td>

                                    {/* Role Selector (Owner Only) */}
                                    <td className="py-3 px-4 font-sans">
                                      {isPrimaryOwner ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                                          <span>Primary Store Owner</span>
                                        </span>
                                      ) : !isOwner ? (
                                        <div
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300"
                                          title="Manager accounts cannot change user roles. Only the Store Owner can change roles."
                                        >
                                          <Lock className="w-3 h-3 text-neutral-500" />
                                          <span className="capitalize">
                                            {currentRole === 'owner'
                                              ? 'Owner'
                                              : currentRole === 'management'
                                              ? 'Management'
                                              : 'Customer'}
                                          </span>
                                        </div>
                                      ) : (
                                        <select
                                          value={currentRole}
                                          onChange={(e) =>
                                            handleUpdateUserRoleAndStatus(
                                              cust.uid,
                                              e.target.value as UserRole,
                                              currentStatus
                                            )
                                          }
                                          className="text-xs bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-amber-400 cursor-pointer font-sans"
                                        >
                                          <option value="customer">Customer (Shopper)</option>
                                          <option value="management">Management (Store Manager)</option>
                                          <option value="owner">Owner (Store Owner)</option>
                                        </select>
                                      )}
                                    </td>

                                    {/* Status Selector (Owner & Manager) */}
                                    <td className="py-3 px-4 font-sans">
                                      {isPrimaryOwner ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span>Active</span>
                                        </span>
                                      ) : !(isOwner || isManagement || isAdmin) ? (
                                        <div
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800"
                                          title="Sign in as Manager or Owner to change account states."
                                        >
                                          <Lock className="w-3 h-3 text-neutral-500" />
                                          <span className={currentStatus === 'active' ? 'text-emerald-300' : 'text-red-300'}>
                                            {currentStatus === 'active' ? 'Active' : 'Suspended'}
                                          </span>
                                        </div>
                                      ) : (
                                        <select
                                          value={currentStatus}
                                          onChange={(e) =>
                                            handleUpdateUserRoleAndStatus(
                                              cust.uid,
                                              currentRole,
                                              e.target.value as UserAccountStatus
                                            )
                                          }
                                          className={`text-xs border rounded-lg px-2.5 py-1 font-semibold cursor-pointer ${
                                            currentStatus === 'active'
                                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                              : 'bg-red-950/40 border-red-500/40 text-red-300'
                                          }`}
                                        >
                                          <option value="active">Active</option>
                                          <option value="suspended">Suspended</option>
                                        </select>
                                      )}
                                    </td>

                                    {/* Effective Status Badge */}
                                    <td className="py-3 px-4 text-right font-sans">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        currentRole === 'owner'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : currentRole === 'management'
                                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                          : 'bg-neutral-800 text-neutral-400'
                                      }`}>
                                        {currentRole === 'owner'
                                          ? '👑 Owner'
                                          : currentRole === 'management'
                                          ? '🛡️ Management'
                                          : '🛍️ Customer'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. STORE SETTINGS & ANNOUNCEMENT BANNER */}
                {activeTab === 'settings' && (
                  <div className="space-y-6 max-w-3xl">
                    <div className="pb-3 border-b border-neutral-800">
                      <h3 className="text-sm font-bold text-white">Store Configuration & Announcements</h3>
                      <p className="text-xs text-neutral-400">
                        Adjust top header banner, shipping fees, and store payment details
                      </p>
                    </div>

                    {/* OWNER EXECUTIVE SECURITY: PORTAL LOCK CONTROL */}
                    {isOwner && (
                      <div className="p-5 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isPortalLocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              <Lock className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Store Owner Access Control · Portal Lock
                              </h4>
                              <p className="text-[11px] text-neutral-400">
                                Restrict management staff from accessing the Admin Portal
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            isPortalLocked
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {isPortalLocked ? '● LOCKED (Management Blocked)' : '● UNLOCKED (Management Active)'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-300 leading-relaxed">
                          When you lock the portal, all Management accounts are instantly barred from viewing or editing orders, catalog, promos, and customers. Only the Owner can enter and unlock the portal.
                        </p>

                        <div className="pt-1 flex items-center justify-between border-t border-neutral-800/80">
                          <span className="text-[11px] text-neutral-400">
                            Current owner: <strong className="text-white font-mono">{user?.email || 'Owner'}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextLocked = !isPortalLocked;
                              await togglePortalLock(nextLocked);
                              showToast(
                                nextLocked
                                  ? 'Portal locked! Management accounts are now blocked from accessing.'
                                  : 'Portal unlocked! Management accounts can now access.'
                              );
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                              isPortalLocked
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            {isPortalLocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock Portal Now</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Lock Portal (Restrict Management)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SINGLE STORE ANNOUNCEMENT BANNER (ONE BANNER ONLY - REMOVE OR DISPLAY) */}
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Store Announcement Banner
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                              Single Banner
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            There is only one store banner. Owner and Management can remove or display it at any time.
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {isBannerVisible ? (
                            <>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Displayed on Store
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onToggleBannerVisibility) {
                                    onToggleBannerVisibility(false);
                                  } else {
                                    showToast('Banner removed from store.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Hide the top banner from all store visitors"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Remove Banner</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Removed / Hidden
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onToggleBannerVisibility) {
                                    onToggleBannerVisibility(true);
                                  } else {
                                    showToast('Banner is now displayed on the store.');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Show the top banner on the store header"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Display Banner</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Live Header Preview */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          <span>Live Store Header Preview</span>
                          <span>{isBannerVisible ? 'Status: VISIBLE TO CUSTOMERS' : 'Status: HIDDEN FROM CUSTOMERS'}</span>
                        </div>
                        {isBannerVisible ? (
                          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-[11px] font-medium flex items-center justify-center gap-2 text-center">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate max-w-xl">{tempAnnouncement || 'No banner text set'}</span>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-neutral-950/40 border border-dashed border-neutral-800 rounded-xl text-neutral-400 text-[11px] text-center font-mono flex items-center justify-center gap-2">
                            <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Banner is currently removed from the store header. Click &ldquo;Display Banner&rdquo; above to make it visible.</span>
                          </div>
                        )}
                      </div>

                      {/* Banner Text Form */}
                      <form onSubmit={handleSaveAnnouncement} className="space-y-3 pt-2 border-t border-neutral-800/80">
                        <label className="block text-xs font-bold text-neutral-300">
                          Announcement Banner Content
                        </label>
                        <textarea
                          value={tempAnnouncement}
                          onChange={(e) => setTempAnnouncement(e.target.value)}
                          rows={2}
                          placeholder="e.g. 🇱🇰 Island-Wide Express Courier across Sri Lanka · Free Island-Wide Delivery on orders over LKR 50,000"
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white transition-all font-sans"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {tempAnnouncement.length} characters
                          </span>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Banner Text</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* MAIN HERO / LOOKBOOK CAMPAIGN PHOTO & CUSTOMIZER */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Main Hero &amp; Lookbook Campaign Photo
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                              Homepage Showcase
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Change the main large showcase photo displayed at the top of your website. Upload your own photography or paste an image URL.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleResetHeroToDefault}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reset to default brand campaign photography"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reset to Default</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Preview Box of the Hero Photo */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                          Current Active Hero Showcase Preview
                        </span>
                        <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-lg">
                          <img
                            src={heroImgInput || '/images/hero_fashion_lookbook_1791696478904.jpg'}
                            alt="Hero Preview"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/hero_fashion_lookbook_1791696478904.jpg';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-300 font-mono">{heroSubtitleInput || 'Lookbook 2026'}</p>
                              <p className="text-xs font-bold truncate max-w-xs">{heroTitleInput || 'Concrete & Light · Silhouette Study'}</p>
                            </div>
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-white">
                              {heroBadgeInput || 'Drop 01'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Photo Upload & URL Controls */}
                      <form onSubmit={handleSaveHeroSettings} className="space-y-4 pt-2 border-t border-neutral-800/80">
                        {/* Option 1: File Upload */}
                        <div>
                          <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                            Option 1: Upload Photo from Your Device
                          </label>
                          <input
                            type="file"
                            ref={heroFileInputRef}
                            onChange={handleHeroFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => heroFileInputRef.current?.click()}
                            className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800/90 border border-dashed border-neutral-700 hover:border-amber-400/80 rounded-xl text-xs text-neutral-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-amber-400" />
                            <span>Click to Choose Photo from Phone / PC (Max 5MB)</span>
                          </button>
                        </div>

                        {/* Option 2: Image URL input */}
                        <div>
                          <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                            Option 2: Or Paste Direct Image URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={heroImgInput}
                              onChange={(e) => setHeroImgInput(e.target.value)}
                              placeholder="https://example.com/your-campaign-photo.jpg"
                              className="flex-1 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-all font-mono"
                            />
                            {heroImgInput && (
                              <button
                                type="button"
                                onClick={() => setHeroImgInput('')}
                                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Option 3: Select from Brand Catalog Images */}
                        {products && products.length > 0 && (
                          <div>
                            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                              Option 3: Quick-Select from Brand Garment Photography
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {products.slice(0, 6).map((prod) => (
                                <button
                                  key={prod.id}
                                  type="button"
                                  onClick={() => {
                                    setHeroImgInput(prod.image);
                                    setHeroTitleInput(`${prod.name} · Signature Study`);
                                  }}
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                    heroImgInput === prod.image
                                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                                      : 'border-neutral-800 hover:border-neutral-600 opacity-70 hover:opacity-100'
                                  }`}
                                  title={prod.name}
                                >
                                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Captions & Subtitles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/80 text-xs">
                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Subtitle / Year</label>
                            <input
                              type="text"
                              value={heroSubtitleInput}
                              onChange={(e) => setHeroSubtitleInput(e.target.value)}
                              placeholder="e.g. Lookbook 2026"
                              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Headline / Collection Theme</label>
                            <input
                              type="text"
                              value={heroTitleInput}
                              onChange={(e) => setHeroTitleInput(e.target.value)}
                              placeholder="e.g. Concrete &amp; Light · Silhouette Study"
                              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Badge / Drop Tag</label>
                            <input
                              type="text"
                              value={heroBadgeInput}
                              onChange={(e) => setHeroBadgeInput(e.target.value)}
                              placeholder="e.g. Drop 01"
                              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-sans"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Save Hero Photo &amp; Captions</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* BANK DETAILS UPDATE SECTION (EDITABLE BY OWNER & MANAGEMENT) */}
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Update Official Bank Details
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono">
                              Sri Lanka Accounts
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Configure bank accounts shown to shoppers for Bank Deposit and slip upload at checkout.
                          </p>
                        </div>

                        {/* Bank Tab Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setActiveBankEditTab('commercial')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              activeBankEditTab === 'commercial'
                                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Commercial Bank
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveBankEditTab('sampath')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              activeBankEditTab === 'sampath'
                                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Sampath Bank
                          </button>
                        </div>
                      </div>

                      {/* Bank Fields Editor */}
                      <form onSubmit={handleSaveBankSettings} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Bank Name</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].bankName}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'bankName', e.target.value)}
                              placeholder="e.g. Commercial Bank of Ceylon"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Account Name / Beneficiary</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].accountName}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'accountName', e.target.value)}
                              placeholder="e.g. MOON APPAREL (PVT) LTD"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Account Number</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].accountNumber}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'accountNumber', e.target.value)}
                              placeholder="e.g. 1000 4829 1042"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono font-bold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Branch Location</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].branch}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'branch', e.target.value)}
                              placeholder="e.g. Cinnamon Gardens Branch (Colombo 07)"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">SWIFT / BIC Code</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].swift || ''}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'swift', e.target.value)}
                              placeholder="e.g. CCEYLKLX"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Bank Code (Optional)</label>
                            <input
                              type="text"
                              value={editingBankSettings[activeBankEditTab].bankCode || ''}
                              onChange={(e) => handleBankFieldChange(activeBankEditTab, 'bankCode', e.target.value)}
                              placeholder="e.g. 7056"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                          <p className="text-[11px] text-neutral-400">
                            Editing: <strong className="text-white">{activeBankEditTab === 'commercial' ? 'Commercial Bank' : 'Sampath Bank'}</strong> account details
                          </p>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Bank Details</span>
                          </button>
                        </div>
                      </form>

                      {/* Current Bank Details Summary View */}
                      <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Current Active Bank Accounts Preview
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            activeBankEditTab === 'commercial'
                              ? 'bg-neutral-950 border-blue-500/40 ring-1 ring-blue-500/20'
                              : 'bg-neutral-950/60 border-neutral-800'
                          }`}>
                            <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-800/60">
                              <p className="font-bold text-white text-[11px]">{editingBankSettings.commercial.bankName}</p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                                Primary
                              </span>
                            </div>
                            <p className="font-mono text-neutral-300 text-[11px] font-bold">
                              {editingBankSettings.commercial.accountNumber}
                            </p>
                            <p className="text-[10px] text-neutral-400">{editingBankSettings.commercial.accountName}</p>
                            <p className="text-[10px] text-neutral-500">{editingBankSettings.commercial.branch}</p>
                          </div>

                          <div className={`p-3.5 rounded-xl border transition-all ${
                            activeBankEditTab === 'sampath'
                              ? 'bg-neutral-950 border-blue-500/40 ring-1 ring-blue-500/20'
                              : 'bg-neutral-950/60 border-neutral-800'
                          }`}>
                            <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-800/60">
                              <p className="font-bold text-white text-[11px]">{editingBankSettings.sampath.bankName}</p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                                Secondary
                              </span>
                            </div>
                            <p className="font-mono text-neutral-300 text-[11px] font-bold">
                              {editingBankSettings.sampath.accountNumber}
                            </p>
                            <p className="text-[10px] text-neutral-400">{editingBankSettings.sampath.accountName}</p>
                            <p className="text-[10px] text-neutral-500">{editingBankSettings.sampath.branch}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CLOUD BACKEND & HOSTING ARCHITECTURE */}
                    <div className="p-5 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <span>Hosting &amp; Live Backend API Gateway</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono font-normal">
                                {typeof window !== 'undefined' && window.location.hostname.includes('web.app')
                                  ? 'Firebase Frontend'
                                  : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
                                  ? 'Vercel Full-Stack'
                                  : 'Localhost / Dev'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-neutral-400">
                              Connect your frontend (Firebase Hosting or Vercel) with your live backend serverless API
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            backendPingResult?.success || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {backendPingResult?.success
                              ? '● BACKEND CONNECTED'
                              : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
                              ? '● VERCEL ALL-IN-ONE'
                              : '● CONFIGURE BACKEND URL'}
                          </span>
                        </div>
                      </div>

                        <div className="space-y-2 text-xs">
                        <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl space-y-2 text-[11px]">
                          <p className="text-neutral-300 leading-relaxed">
                            <strong>What to enter here:</strong> Copy the full website link from your browser's address bar (e.g. <span className="text-amber-400 font-mono">https://stylish-five.vercel.app</span>) and paste it into the box below, or click the <strong>Auto-Fill Current URL</strong> button. Then click <strong>Save &amp; Test Connection</strong>.
                          </p>
                          {typeof window !== 'undefined' && window.location.origin && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setBackendUrlInput(window.location.origin);
                                  showToast(`Auto-filled: ${window.location.origin}`);
                                }}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Globe className="w-3 h-3 text-amber-400" />
                                <span>Auto-Fill Current URL ({window.location.origin})</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <label className="block text-neutral-300 font-medium text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-amber-400" />
                              Live Backend API URL (Vercel URL)
                            </span>
                            {backendUrlInput && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBackendUrlInput('');
                                  localStorage.removeItem('moon_backend_url');
                                  showToast('Reset to default same-origin URL');
                                }}
                                className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                              >
                                Clear / Use Default
                              </button>
                            )}
                          </label>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="url"
                              value={backendUrlInput}
                              onChange={(e) => setBackendUrlInput(e.target.value)}
                              placeholder={typeof window !== 'undefined' ? `${window.location.origin}` : 'https://your-domain.vercel.app'}
                              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-white"
                            />
                            <button
                              type="button"
                              onClick={handleTestAndSaveBackendUrl}
                              disabled={isTestingBackendPing}
                              className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                            >
                              {isTestingBackendPing ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Testing...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save &amp; Test Connection</span>
                                </>
                              )}
                            </button>
                          </div>

                          {backendPingResult && (
                            <div className={`mt-2 p-2.5 rounded-lg border text-[11px] flex items-center gap-2 font-mono ${
                              backendPingResult.success
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                            }`}>
                              {backendPingResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <span>{backendPingResult.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 7. AUTO-SEND EMAIL & ORDER NOTIFICATIONS */}
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Automatic Order Confirmation Emails
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                              Transactional Engine
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Automatically sends a high-end luxury email with garment photos, sizing, price, and tracking to the customer immediately upon successful purchase.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAutoSendOrderEmail(!autoSendOrderEmail)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              autoSendOrderEmail
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${autoSendOrderEmail ? 'bg-neutral-950 animate-pulse' : 'bg-neutral-500'}`} />
                            <span>{autoSendOrderEmail ? 'Auto-Email: ACTIVE' : 'Auto-Email: PAUSED'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Toggles & Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div
                          onClick={() => setAutoSendOrderEmail(!autoSendOrderEmail)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            autoSendOrderEmail
                              ? 'bg-neutral-950 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-neutral-950/50 border-neutral-800 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-xs">Customer Auto-Email</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              autoSendOrderEmail ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {autoSendOrderEmail ? 'ON (Automatic)' : 'OFF'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Sends the luxury receipt and item details directly to customer's email upon completing checkout.
                          </p>
                        </div>

                        <div
                          onClick={() => setNotifyOwnerOnNewOrder(!notifyOwnerOnNewOrder)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            notifyOwnerOnNewOrder
                              ? 'bg-neutral-950 border-amber-500/40 ring-1 ring-amber-500/20'
                              : 'bg-neutral-950/50 border-neutral-800 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-xs">Store Owner Alert Copy</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              notifyOwnerOnNewOrder ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {notifyOwnerOnNewOrder ? 'ON (BCC Owner)' : 'OFF'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Dispatches a copy to the store owner at <strong className="text-white font-mono">{ownerEmail}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Sender & Notification Details Form */}
                      <form onSubmit={handleSaveEmailSettings} className="space-y-4 pt-2 border-t border-neutral-800/80 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Email Sender Display Name</label>
                            <input
                              type="text"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="e.g. MOON APPAREL ATELIER"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-neutral-400 font-medium">Sender Email Address</label>
                              {smtpConfig.user && senderEmail !== smtpConfig.user && (
                                <button
                                  type="button"
                                  onClick={alignSenderEmailWithGmail}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1 cursor-pointer"
                                  title="Sync Sender Email with your authenticated Gmail address to avoid spam folder placement"
                                >
                                  <span>Sync with Gmail</span>
                                </button>
                              )}
                            </div>
                            <input
                              type="email"
                              value={senderEmail}
                              onChange={(e) => setSenderEmail(e.target.value)}
                              placeholder="e.g. yourname@gmail.com"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                              required
                            />
                            {smtpConfig.user && senderEmail !== smtpConfig.user && !senderEmail.toLowerCase().endsWith('@' + (smtpConfig.user.split('@')[1] || '')) && (
                              <p className="text-[10px] text-amber-400 mt-1 leading-snug">
                                ⚠️ Mismatched domain! Sending via {smtpConfig.user} with From:{senderEmail} can trigger Spam filters.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1 font-medium">Owner Alert Email Address</label>
                            <input
                              type="email"
                              value={ownerEmail}
                              onChange={(e) => setOwnerEmail(e.target.value)}
                              placeholder="e.g. starknilex20050426@gmail.com"
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                              required
                            />
                          </div>
                        </div>

                        {/* Live Email Engine Status Card */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          smtpConfig.user && smtpConfig.pass && smtpConfig.enabled !== false
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start sm:items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                                smtpConfig.user && smtpConfig.pass && smtpConfig.enabled !== false
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-amber-400'
                              }`} />
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-white">
                                  {smtpConfig.user && smtpConfig.pass && smtpConfig.enabled !== false
                                    ? 'Live SMTP Dispatch Engine Active'
                                    : 'In-App Outbox & Preview Mode'}
                                </p>
                                <p className="text-[11px] text-neutral-300 mt-0.5">
                                  {smtpConfig.user && smtpConfig.pass && smtpConfig.enabled !== false
                                    ? `Transmitting real emails via ${smtpConfig.host || 'smtp.gmail.com'}:${smtpConfig.port || 465} (${smtpConfig.user}) directly to customer & owner inboxes.`
                                    : 'Auto-emails are generated and saved to the in-app Outbox. Connect your Gmail App Password below to deliver real emails to actual Gmail inboxes.'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={applyGmailPreset}
                              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700 shrink-0 self-start sm:self-auto shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>⚡ 1-Click Gmail Connect</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom SMTP Gateway Settings */}
                        <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-amber-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                SMTP Gateway &amp; Google Authentication
                              </h5>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Port 465 (SSL) / 587 (TLS)
                            </span>
                          </div>

                          {/* 3-Step Google App Password Assistant */}
                          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                How to connect personal Gmail in 60 seconds:
                              </span>
                              <a
                                href="https://myaccount.google.com/apppasswords"
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
                              >
                                <span>Open Google App Passwords</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px]">
                              <li>Ensure <strong>2-Step Verification</strong> is enabled on your Google Account.</li>
                              <li>Go to <strong className="text-neutral-200">myaccount.google.com/apppasswords</strong>.</li>
                              <li>Create an App Password labeled <em>&ldquo;Moon Apparel&rdquo;</em>, copy the 16-character code, and paste below.</li>
                            </ol>
                          </div>

                          {/* SMTP Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-neutral-400 mb-1 font-medium">SMTP Server Host</label>
                              <input
                                type="text"
                                value={smtpConfig.host}
                                onChange={(e) =>
                                  setSmtpConfig((prev) => ({ ...prev, host: e.target.value }))
                                }
                                placeholder="smtp.gmail.com"
                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-white"
                              />
                            </div>

                            <div>
                              <label className="block text-neutral-400 mb-1 font-medium">Port</label>
                              <input
                                type="number"
                                value={smtpConfig.port}
                                onChange={(e) =>
                                  setSmtpConfig((prev) => ({ ...prev, port: Number(e.target.value) }))
                                }
                                placeholder="465"
                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-white"
                              />
                            </div>

                            <div>
                              <label className="block text-neutral-400 mb-1 font-medium">Gmail / SMTP Username</label>
                              <input
                                type="text"
                                value={smtpConfig.user}
                                onChange={(e) =>
                                  setSmtpConfig((prev) => ({ ...prev, user: e.target.value.trim() }))
                                }
                                placeholder="e.g. lerninganimation@gmail.com"
                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-neutral-400 mb-1 font-medium">
                                16-Character Google App Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showSmtpPassword ? 'text' : 'password'}
                                  value={smtpConfig.pass}
                                  onChange={(e) =>
                                    setSmtpConfig((prev) => ({
                                      ...prev,
                                      pass: e.target.value.replace(/\s+/g, ''),
                                    }))
                                  }
                                  placeholder="e.g. abcd efgh ijkl mnop (spaces automatically removed)"
                                  className="w-full px-3 py-2 pr-16 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] text-neutral-400 hover:text-white font-mono"
                                >
                                  {showSmtpPassword ? 'Hide' : 'Show'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center pt-5">
                              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={smtpConfig.secure}
                                  onChange={(e) =>
                                    setSmtpConfig((prev) => ({ ...prev, secure: e.target.checked }))
                                  }
                                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900"
                                />
                                <span className="text-xs">SSL/TLS Secure (Port 465)</span>
                              </label>
                            </div>
                          </div>

                          {/* SMTP Test Result Notification */}
                          {smtpTestResult && (
                            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                              smtpTestResult.success
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                            }`}>
                              {smtpTestResult.success ? (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <p className="font-bold">
                                  {smtpTestResult.success ? 'SMTP Verification Successful' : 'SMTP Connection Warning'}
                                </p>
                                <p className="text-[11px] opacity-90 leading-relaxed font-mono">
                                  {smtpTestResult.message}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Email Deliverability & Anti-Spam Diagnostic Guide */}
                        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowSpamGuide(!showSpamGuide)}
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-800/40 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                              <div>
                                <span className="font-bold text-xs text-white uppercase tracking-wider block">
                                  Why is my email going to the Spam folder? (Deliverability &amp; Inbox Guide)
                                </span>
                                <span className="text-[11px] text-neutral-400 block mt-0.5">
                                  Learn how to pass SPF/DKIM checks and guarantee 100% Primary Inbox arrival
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                {showSpamGuide ? 'Hide Guide' : 'Read Guide'}
                              </span>
                              {showSpamGuide ? (
                                <ChevronUp className="w-4 h-4 text-neutral-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-neutral-400" />
                              )}
                            </div>
                          </button>

                          {showSpamGuide && (
                            <div className="p-4 pt-1 border-t border-neutral-800/80 space-y-3.5 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {/* Reason 1 */}
                                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>1. Sender / From Address Mismatch (SPF &amp; DKIM)</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                                    When sending via Gmail SMTP, Google cryptographically signs the email with your Gmail account. If your <strong>Sender Email</strong> is set to an arbitrary custom domain (e.g. <em>orders@moon-clothing.com</em>) rather than your authenticated Gmail address, receiving servers detect domain spoofing and push it to Spam.
                                  </p>
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={alignSenderEmailWithGmail}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                                    >
                                      ✓ Click here to align Sender Email with your Gmail address
                                    </button>
                                  </div>
                                </div>

                                {/* Reason 2 */}
                                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    <span>2. First-Time Sender Quarantine (New SMTP)</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                                    Major inbox providers (Gmail, Outlook, Yahoo) do not know your new SMTP sending app. When an automated script sends an order receipt for the first time, Google's Bayesian spam filters quarantine it as a precaution.
                                  </p>
                                </div>

                                {/* Reason 3 */}
                                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>3. The 5-Second Permanent Fix (&ldquo;Report Not Spam&rdquo;)</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                                    Open your Gmail / Outlook Spam folder, find the email from <em>MOON APPAREL ATELIER</em>, and click <strong>&ldquo;Report not spam&rdquo;</strong> (or add the sender email to Google Contacts). This trains Google's AI that you trust this sender, immediately routing all future order confirmations to the <strong>Primary Inbox</strong>.
                                  </p>
                                </div>

                                {/* Reason 4 */}
                                <div className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                                    <Building className="w-3.5 h-3.5 shrink-0" />
                                    <span>4. Using Custom Business Domains (@yourdomain.com)</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                                    If you want to send from a branded domain like <em>orders@moon-clothing.com</em>, you must add <strong>SPF</strong> (<code>v=spf1 include:_spf.google.com ~all</code>) and <strong>DKIM TXT</strong> records in your DNS hosting provider (Cloudflare, GoDaddy, Namecheap) through Google Workspace.
                                  </p>
                                </div>
                              </div>

                              <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-center gap-2 text-[11px] text-amber-200">
                                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>
                                  <strong>Quick Tip:</strong> Our email engine automatically attaches high-importance headers, matching reply-to paths, and clean plain-text alternatives to maximize inbox delivery rates.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-neutral-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleVerifySmtpOnly}
                              disabled={isTestingSmtp}
                              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-neutral-700"
                              title="Verify handshake and login credentials with SMTP server"
                            >
                              {isTestingSmtp ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>{isTestingSmtp ? 'Verifying...' : 'Verify SMTP Connection'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSendTestEmail}
                              disabled={isSendingTestEmail}
                              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-neutral-700"
                              title="Send a sample luxury order confirmation email to the owner inbox"
                            >
                              {isSendingTestEmail ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>{isSendingTestEmail ? 'Dispatching Test...' : 'Send Live Test Email'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={fetchEmailLogs}
                              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                              <span>View Sent Outbox Logs</span>
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={isSavingEmailSettings}
                            className="px-5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {isSavingEmailSettings ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isSavingEmailSettings ? 'Saving...' : 'Save Email Configuration'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* BANK RECEIPT POPUP PREVIEW */}
        {previewSlipUrl && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
            <div className="relative max-w-xl w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h4 className="text-xs font-bold text-white">
                  Bank Deposit Slip Verification
                </h4>
                <button
                  onClick={() => setPreviewSlipUrl(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={previewSlipUrl}
                alt="Uploaded bank receipt"
                className="w-full max-h-[70vh] object-contain rounded-lg bg-neutral-900 border border-neutral-800"
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewSlipUrl(null)}
                  className="px-4 py-1.5 bg-white text-neutral-950 text-xs font-bold rounded-lg"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-lg w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h4 className="text-sm font-bold text-white">
                  Add New Signature Piece to Catalog
                </h4>
                <button
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Piece Title</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Vintage Wash Drop-Shoulder Tee"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Subtitle / Material Note</label>
                  <input
                    type="text"
                    value={newProdSubtitle}
                    onChange={(e) => setNewProdSubtitle(e.target.value)}
                    placeholder="e.g. 320 GSM combed organic cotton"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        setNewProdCategory(nextCat);
                        const matchGroup = currentCategories.find((c) => c.id === nextCat);
                        if (matchGroup && matchGroup.clothingTypes.length > 0) {
                          setNewProdClothingType(matchGroup.clothingTypes[0]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans cursor-pointer"
                    >
                      {currentCategories.map((cat, cIdx) => (
                        <option key={`new-cat-opt-${cat.id}-${cIdx}`} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Clothing Type / Subcategory</label>
                    <input
                      type="text"
                      value={newProdClothingType}
                      onChange={(e) => setNewProdClothingType(e.target.value)}
                      placeholder="e.g. T-Shirts, Hoodies"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    />
                    {currentCategories.find((c) => c.id === newProdCategory)?.clothingTypes.length ? (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Array.from(new Set(currentCategories.find((c) => c.id === newProdCategory)?.clothingTypes || [])).map((type, tIdx) => (
                          <button
                            type="button"
                            key={`new-type-btn-${type}-${tIdx}`}
                            onClick={() => setNewProdClothingType(type)}
                            className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              newProdClothingType === type
                                ? 'bg-white text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Price (LKR)</label>
                    <input
                      type="number"
                      value={newProdPriceLKR}
                      onChange={(e) => {
                        const lkr = parseInt(e.target.value, 10);
                        setNewProdPriceLKR(lkr);
                        setNewProdPriceUSD(Math.round(lkr / 300));
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Price (USD)</label>
                    <input
                      type="number"
                      value={newProdPriceUSD}
                      onChange={(e) => setNewProdPriceUSD(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Fabric GSM</label>
                    <input
                      type="text"
                      value={newProdGsm}
                      onChange={(e) => setNewProdGsm(e.target.value)}
                      placeholder="e.g. 480 GSM"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Cut & Fit</label>
                    <input
                      type="text"
                      value={newProdFit}
                      onChange={(e) => setNewProdFit(e.target.value)}
                      placeholder="e.g. Boxy Architectural Fit"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                {/* Photo selection from device */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Piece Photo / Lookbook Image</label>
                  <input
                    type="file"
                    ref={addProductFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processImageFile(file);
                          setNewProdImage(dataUrl);
                          showToast('Photo selected from your device.');
                        } catch (err: any) {
                          showToast(err?.message || 'Failed to process selected photo.');
                        }
                      }
                    }}
                  />
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-3">
                      {newProdImage ? (
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0 shadow-inner">
                          <img src={newProdImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewProdImage('')}
                            className="absolute top-1 right-1 p-0.5 bg-black/80 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-lg border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 shrink-0 bg-neutral-950">
                          <Camera className="w-5 h-5 text-neutral-600 mb-1" />
                          <span className="text-[9px]">No photo</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => addProductFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-950 hover:bg-neutral-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Photo from Device</span>
                        </button>
                        <p className="text-[10px] text-neutral-400">
                          Select high-res photo from your phone gallery or computer.
                        </p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={newProdImage.startsWith('data:') ? '' : newProdImage}
                        placeholder={newProdImage.startsWith('data:') ? '✓ Photo selected from device' : 'Or paste image URL (e.g. https://...)'}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-white font-mono placeholder-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-4 py-2 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                  >
                    Save & Publish Piece
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* UPDATE ITEM DETAILS / EDIT PRODUCT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-lg w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Update Item Details</h4>
                    <p className="text-[11px] text-neutral-400 truncate max-w-[280px]">
                      {editingProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProductDetails} className="space-y-3.5 text-xs">
                {/* Photo from Device selector */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Piece Photo / Lookbook Image</label>
                  <input
                    type="file"
                    ref={editProductFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processImageFile(file);
                          setEditProdImage(dataUrl);
                          showToast('Photo selected from your device.');
                        } catch (err: any) {
                          showToast(err?.message || 'Failed to load photo.');
                        }
                      }
                    }}
                  />
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-3">
                      {editProdImage ? (
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0 shadow-inner">
                          <img src={editProdImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-lg border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 shrink-0 bg-neutral-950">
                          <Camera className="w-5 h-5 text-neutral-600 mb-1" />
                          <span className="text-[9px]">No photo</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => editProductFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-950 hover:bg-neutral-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Photo from Device</span>
                        </button>
                        <p className="text-[10px] text-neutral-400">
                          Pick replacement photo from camera roll or files.
                        </p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={editProdImage.startsWith('data:') ? '' : editProdImage}
                        placeholder={editProdImage.startsWith('data:') ? '✓ Photo selected from device' : 'Or paste image URL (e.g. https://...)'}
                        onChange={(e) => setEditProdImage(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-white font-mono placeholder-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Piece Title</label>
                  <input
                    type="text"
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    placeholder="e.g. Vintage Wash Drop-Shoulder Tee"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Subtitle / Material Headline</label>
                  <input
                    type="text"
                    value={editProdSubtitle}
                    onChange={(e) => setEditProdSubtitle(e.target.value)}
                    placeholder="e.g. 480 GSM French Terry with relaxed drop-shoulder"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Category</label>
                    <select
                      value={editProdCategory}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        setEditProdCategory(nextCat);
                        const matchGroup = currentCategories.find((c) => c.id === nextCat);
                        if (matchGroup && matchGroup.clothingTypes.length > 0) {
                          setEditProdClothingType(matchGroup.clothingTypes[0]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans cursor-pointer"
                    >
                      {currentCategories.map((cat, cIdx) => (
                        <option key={`edit-cat-opt-${cat.id}-${cIdx}`} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Clothing Type / Subcategory</label>
                    <input
                      type="text"
                      value={editProdClothingType}
                      onChange={(e) => setEditProdClothingType(e.target.value)}
                      placeholder="e.g. T-Shirts, Hoodies"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    />
                    {currentCategories.find((c) => c.id === editProdCategory)?.clothingTypes.length ? (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Array.from(
                          new Set(currentCategories.find((c) => c.id === editProdCategory)?.clothingTypes || [])
                        ).map((type, tIdx) => (
                          <button
                            type="button"
                            key={`edit-subcat-btn-${type}-${tIdx}`}
                            onClick={() => setEditProdClothingType(type)}
                            className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              editProdClothingType === type
                                ? 'bg-white text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Pricing LKR & USD */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Price (LKR)</label>
                    <input
                      type="number"
                      value={editProdPriceLKR}
                      onChange={(e) => {
                        const lkr = parseInt(e.target.value, 10) || 0;
                        setEditProdPriceLKR(lkr);
                        setEditProdPriceUSD(Math.round(lkr / 300));
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Price (USD)</label>
                    <input
                      type="number"
                      value={editProdPriceUSD}
                      onChange={(e) => setEditProdPriceUSD(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                      required
                    />
                  </div>
                </div>

                {/* Original/Discount Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">
                      Original Price (LKR) <span className="text-neutral-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={editProdOriginalPriceLKR}
                      onChange={(e) => setEditProdOriginalPriceLKR(e.target.value)}
                      placeholder="e.g. 48000"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">
                      Original Price (USD) <span className="text-neutral-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={editProdOriginalPriceUSD}
                      onChange={(e) => setEditProdOriginalPriceUSD(e.target.value)}
                      placeholder="e.g. 160"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                {/* Fabric GSM & Fit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Fabric GSM</label>
                    <input
                      type="text"
                      value={editProdGsm}
                      onChange={(e) => setEditProdGsm(e.target.value)}
                      placeholder="e.g. 480 GSM"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Cut & Fit</label>
                    <input
                      type="text"
                      value={editProdFit}
                      onChange={(e) => setEditProdFit(e.target.value)}
                      placeholder="e.g. Boxy Architectural Fit"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Description</label>
                  <textarea
                    rows={2}
                    value={editProdDescription}
                    onChange={(e) => setEditProdDescription(e.target.value)}
                    placeholder="Craftsmanship description and details..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                  />
                </div>

                {/* Available Sizes */}
                <div>
                  <label className="block text-neutral-400 mb-1.5 font-medium">Available Sizes</label>
                  <div className="flex gap-2">
                    {(['XS', 'S', 'M', 'L', 'XL'] as const).map((sz, szIdx) => {
                      const isSelected = editProdSizes.includes(sz);
                      return (
                        <button
                          type="button"
                          key={`edit-size-${sz}-${szIdx}`}
                          onClick={() => toggleEditSize(sz)}
                          className={`w-10 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-neutral-950 shadow-sm'
                              : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock & New Status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-xs">Inventory Status</p>
                      <p className="text-[10px] text-neutral-400">
                        {editProdInStock ? 'In Stock for purchase' : 'Marked Sold Out'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditProdInStock(!editProdInStock)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        editProdInStock
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {editProdInStock ? '● In Stock' : '○ Sold Out'}
                    </button>
                  </div>

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-xs">New Arrival</p>
                      <p className="text-[10px] text-neutral-400">Highlight in collection</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditProdIsNew(!editProdIsNew)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        editProdIsNew
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {editProdIsNew ? '★ Featured' : 'Standard'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Piece</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Update Details</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD USER / STAFF MODAL */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-md w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Add User or Staff Member</h4>
                    <p className="text-[11px] text-neutral-400">Register in database & configure role permissions</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Ruwan Perera"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. ruwan@moonapparel.lk"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Assign Role</label>
                    {isOwner ? (
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans cursor-pointer"
                      >
                        <option value="customer">Customer (Shopper)</option>
                        <option value="management">Management (Store Manager)</option>
                        <option value="owner">Owner (Store Owner)</option>
                      </select>
                    ) : (
                      <div
                        className="w-full px-3 py-2 bg-neutral-900/70 border border-neutral-800 rounded-xl text-neutral-400 font-sans flex items-center justify-between"
                        title="Manager accounts cannot assign roles. Only the Store Owner can assign staff roles."
                      >
                        <span className="flex items-center gap-1.5 text-xs text-neutral-300">
                          <Lock className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Customer (Shopper)</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">Owner only</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">District</label>
                    <input
                      type="text"
                      value={newUserDistrict}
                      onChange={(e) => setNewUserDistrict(e.target.value)}
                      placeholder="e.g. Colombo, Kandy"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                  >
                    Save & Register User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD CATEGORY MODAL */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-md w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Create New Category</h4>
                    <p className="text-[11px] text-neutral-400">Add department & initial subcategories</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Category Name / Label</label>
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCategoryLabel(val);
                      if (!newCategoryId) {
                        setNewCategoryId(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g. Footwear & Shoes, Accessories"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-400 font-medium">Category Slug / ID</label>
                    <span className="text-[10px] text-neutral-500 font-mono">Auto-generated</span>
                  </div>
                  <input
                    type="text"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="e.g. footwear, accessories"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">
                    Initial Subcategories (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newCategorySubtypes}
                    onChange={(e) => setNewCategorySubtypes(e.target.value)}
                    placeholder="e.g. Boots, Sneakers, Loafers"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-white font-sans"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    You can also add or remove more subcategories later at any time.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(false)}
                    className="px-4 py-2 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM REMOVE CATEGORY MODAL */}
        {categoryToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-md w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Remove Category</h4>
                    <p className="text-[11px] text-neutral-400">Confirm deletion of department</p>
                  </div>
                </div>
                <button
                  onClick={() => setCategoryToDelete(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <p>
                  Are you sure you want to remove the category{' '}
                  <strong className="text-white">"{categoryToDelete.label}"</strong> (id:{' '}
                  <code className="text-amber-400">{categoryToDelete.id}</code>)?
                </p>

                {products.filter((p) => p.category === categoryToDelete.id).length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Notice</p>
                      <p className="text-[11px] text-amber-200/90">
                        There are currently{' '}
                        {products.filter((p) => p.category === categoryToDelete.id).length} catalog pieces
                        assigned to this category. They will remain in catalog under "All Pieces".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 text-xs font-semibold rounded-xl hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Yes, Remove Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL PREVIEW MODAL */}
        <EmailPreviewModal
          key="admin-email-preview-modal"
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          orderId={previewEmailOrderId || undefined}
          recipient={previewEmailRecipient || undefined}
          onResendSuccess={(msg) => showToast(msg)}
        />

        {/* OUTBOX / DISPATCHED EMAILS LOG MODAL */}
        {showEmailLogsModal && (
          <div key="admin-email-logs-modal" className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85">
            <div className="relative max-w-2xl w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Dispatched Auto-Emails Outbox</h4>
                    <p className="text-[11px] text-neutral-400">
                      Recent transactional receipts dispatched to shoppers & owner
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailLogsModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sentEmailLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-neutral-600" />
                  <p>No auto-emails logged yet in this session.</p>
                  <p className="text-[11px] text-neutral-600">
                    Click &ldquo;Send Test Order Email&rdquo; in settings to dispatch your first test receipt.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {sentEmailLogs.map((log: any, lIdx: number) => (
                    <div
                      key={log?.id ? `${log.id}-${lIdx}` : `email-log-${lIdx}`}
                      className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                            log.isOwnerCopy
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {log.isOwnerCopy ? 'Owner Alert' : 'Customer Receipt'}
                          </span>
                          <span className="font-mono text-white font-bold truncate">
                            {log.recipient}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 truncate">{log.subject}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          Order: {log.orderId} · {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewEmailOrderId(log.orderId);
                          setPreviewEmailRecipient(log.recipient);
                          setIsEmailModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1 border border-neutral-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>View</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEmailLogsModal(false)}
                  className="px-4 py-2 bg-white text-neutral-950 font-bold text-xs rounded-xl hover:bg-neutral-200 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </AnimatePresence>
  );
};
