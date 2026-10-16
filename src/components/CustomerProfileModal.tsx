import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrderConfirmation, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  initialTab?: 'profile' | 'orders';
  onExploreCatalog?: () => void;
}

const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  currency,
  initialTab = 'profile',
  onExploreCatalog,
}) => {
  const { user, userProfile, updateUserProfile, getUserOrders, signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>(initialTab);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Sri Lanka');

  // Orders State
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderConfirmation | null>(null);

  // Status Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Synchronize initial form data from Auth/Firestore user profile
  useEffect(() => {
    if (userProfile || user) {
      setDisplayName(userProfile?.displayName || user?.displayName || '');
      setPhoneNumber(userProfile?.phoneNumber || '');
      setAddressLine(userProfile?.addressLine || userProfile?.defaultAddress || '');
      setApartment(userProfile?.apartment || '');
      setCity(userProfile?.city || userProfile?.defaultCity || '');
      setDistrict(userProfile?.district || userProfile?.defaultDistrict || 'Colombo');
      setPostalCode(userProfile?.postalCode || userProfile?.defaultPostalCode || '');
      setCountry(userProfile?.country || 'Sri Lanka');
    }
  }, [userProfile, user, isOpen]);

  // Keep activeTab aligned with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSaveSuccess(false);
      setSaveError('');
    }
  }, [isOpen, initialTab]);

  // Fetch orders when orders tab is active
  const fetchOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Error fetching orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [isOpen, user, activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      setSaveError('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        addressLine: addressLine.trim(),
        apartment: apartment.trim(),
        city: city.trim(),
        district,
        postalCode: postalCode.trim(),
        country,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      setSaveError('Failed to save changes to Firebase. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate order metrics
  const totalOrdersCount = orders.length;
  const totalSpentLKR = orders.reduce((acc, curr) => {
    if (curr.currency === 'LKR') return acc + curr.total;
    return acc + curr.total * 300; // approximate conversion
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="customer-profile-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="customer-profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden z-10 max-h-[92vh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                    {displayName || 'Customer Profile'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Firebase Connected
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono truncate max-w-[240px] sm:max-w-md">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  onClose();
                  await signOutUser();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-full border border-neutral-200 transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-200/60 transition-colors cursor-pointer"
                aria-label="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & Tab Bar */}
          <div className="border-b border-neutral-200 bg-white px-5 sm:px-8 pt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-neutral-950 text-neutral-950 bg-neutral-50/70 font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile & Delivery Details</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  fetchOrders();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-neutral-950 text-neutral-950 bg-neutral-50/70 font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders & Purchases</span>
                {totalOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-neutral-900 text-white rounded-full text-[10px] font-mono">
                    {totalOrdersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick summary pill */}
            <div className="hidden md:flex items-center gap-3 text-xs text-neutral-600 pb-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>{district || 'Colombo'}, LK</span>
              </span>
              <span className="text-neutral-300">|</span>
              <span className="font-mono text-neutral-900 font-medium">
                {totalOrdersCount} {totalOrdersCount === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {/* TAB 1: PROFILE & DELIVERY ADDRESS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl mx-auto">
                {/* Save Feedback Alerts */}
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your profile details have been successfully updated and synced with Firebase!</span>
                  </motion.div>
                )}

                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{saveError}</span>
                  </motion.div>
                )}

                {/* Section: Personal Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-neutral-700" />
                      Personal Information
                    </h3>
                    <span className="text-[11px] text-neutral-400">Used for orders & communications</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Kasun Perera"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900"
                        required
                      />
                    </div>

                    {/* Email (Read-only Firebase Auth) */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-[10px] text-neutral-400 font-normal">Firebase Auth ID</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3.5 py-2.5 text-xs bg-neutral-100/80 border border-neutral-200 rounded-xl text-neutral-500 font-mono cursor-not-allowed pr-8"
                        />
                        <Mail className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                        <span>Contact Number (Sri Lanka delivery updates)</span>
                        <span className="text-[10px] text-neutral-400">e.g. +94 77 123 4567</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1 text-xs text-neutral-500 font-medium">
                          <span>🇱🇰</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+94 7X XXX XXXX"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900 font-mono"
                        />
                        <Phone className="w-3.5 h-3.5 text-neutral-400 absolute right-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Default Shipping Address */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-700" />
                      Default Delivery Address
                    </h3>
                    <span className="text-[11px] text-neutral-400">Auto-filled during checkout</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Street Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Street Address / House No.
                      </label>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="e.g. No. 42, Galle Road, Colpetty"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900"
                      />
                    </div>

                    {/* Apartment / Suite (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Apartment, Suite, Unit <span className="text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="e.g. Tower 2, Apt 8B"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Colombo 03"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900"
                      />
                    </div>

                    {/* District Selector (25 Sri Lanka Districts) */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        District (Sri Lanka)
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900 cursor-pointer"
                      >
                        {SRI_LANKA_DISTRICTS.map((d, dIdx) => (
                          <option key={`profile-dist-${d}-${dIdx}`} value={d}>
                            {d} District
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Postal / ZIP Code
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 00300"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-900 font-mono"
                      />
                    </div>

                    {/* Country */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Country / Region
                      </label>
                      <div className="flex items-center px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-700 font-medium">
                        <span className="mr-2">🇱🇰</span>
                        <span>Sri Lanka (Domestic Island-Wide Express & Standard Delivery)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit & Save Button */}
                <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Your updated details automatically sync with future checkouts.</span>
                  </p>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-neutral-950 rounded-full hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving to Firebase...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: MY ORDERS & PURCHASES */}
            {activeTab === 'orders' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Your Purchase History</h3>
                    <p className="text-xs text-neutral-500">
                      All orders linked to {user?.email} stored in Firebase
                    </p>
                  </div>

                  <button
                    onClick={fetchOrders}
                    disabled={isLoadingOrders}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
                    title="Refresh orders from Firebase"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-neutral-500 font-mono">Fetching your orders from Firebase...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center space-y-4 bg-neutral-50/60 rounded-3xl border border-neutral-200/80 p-8">
                    <div className="w-16 h-16 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-400 mx-auto">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-neutral-900">No purchases found yet</h4>
                      <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                        You have not placed any orders with this customer account yet. When you complete checkout, all your invoices and courier slips will be archived here.
                      </p>
                    </div>
                    {onExploreCatalog && (
                      <button
                        onClick={() => {
                          onClose();
                          onExploreCatalog();
                        }}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-neutral-950 rounded-full hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
                      >
                        Explore Moon Catalog
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, oIdx) => (
                      <div
                        key={order.orderId ? `${order.orderId}-${oIdx}` : `cust-order-${oIdx}`}
                        className="border border-neutral-200 rounded-2xl p-4 sm:p-5 hover:border-neutral-400 transition-all bg-white shadow-xs"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded-md">
                              {order.orderId}
                            </span>
                            <span className="text-neutral-400">·</span>
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {new Date(order.orderDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {order.paymentMethod === 'bank_transfer' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Bank Deposit
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Cash on Delivery
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-white">
                              {order.status === 'confirmed' ? 'Confirmed' : 'Processing'}
                            </span>
                          </div>
                        </div>

                        {/* Order items gallery */}
                        <div className="py-3.5 space-y-2.5">
                          {order.items.map((item, idx) => (
                            <div
                              key={item.id ? `${item.id}-${idx}` : `profile-order-item-${order.orderId || oIdx}-${idx}`}
                              className="flex items-center justify-between gap-3 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/60"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                                />
                                <div className="text-left text-xs">
                                  <p className="font-bold text-neutral-900 line-clamp-1">
                                    {item.product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 font-mono">
                                    <span className="px-1.5 py-0.2 bg-white rounded border border-neutral-200">
                                      Size {item.size}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                                        style={{ backgroundColor: item.color.hex }}
                                      />
                                      <span>{item.color.name}</span>
                                    </span>
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono text-xs font-semibold text-neutral-900">
                                  {formatPrice(
                                    (order.currency === 'USD' ? item.product.priceUSD : item.product.priceLKR) *
                                      item.quantity,
                                    order.currency || currency
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bank Slip Attachment Info (if uploaded) */}
                        {order.bankReceipt && (
                          <div className="mb-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-900">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <span className="font-medium">Uploaded Bank Slip: </span>
                                <span className="font-mono text-[11px]">{order.bankReceipt.fileName}</span>
                                {order.bankReceipt.depositorName && (
                                  <span className="text-[11px] text-blue-700 block">
                                    Depositor: {order.bankReceipt.depositorName} · Ref: {order.bankReceipt.transactionRef || 'N/A'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {order.bankReceipt.previewUrl && (
                              <button
                                onClick={() => setSelectedReceiptOrder(order)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                View Slip
                              </button>
                            )}
                          </div>
                        )}

                        {/* Order Summary & Destination */}
                        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            <span>
                              Delivery Destination:{' '}
                              <strong className="text-neutral-900">
                                {order.customer.district || 'Colombo'}, Sri Lanka
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-neutral-500">Order Total:</span>
                            <span className="font-mono font-bold text-sm text-neutral-950">
                              {formatPrice(order.total, order.currency || currency)}
                            </span>
                          </div>
                        </div>

                        {/* Tracking details */}
                        <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 flex flex-wrap items-center justify-between text-[11px] text-neutral-500">
                          <span>Tracking: <strong className="font-mono text-neutral-800">{order.trackingNumber}</strong></span>
                          <span>Est. Delivery: <strong className="text-neutral-800">{order.estimatedDelivery}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Bank Receipt Preview Modal */}
        {selectedReceiptOrder && selectedReceiptOrder.bankReceipt?.previewUrl && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="relative max-w-lg w-full bg-white rounded-2xl p-4 overflow-hidden space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-900">
                  Bank Transfer Slip: {selectedReceiptOrder.orderId}
                </h4>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={selectedReceiptOrder.bankReceipt.previewUrl}
                alt="Bank Transfer Receipt"
                className="w-full max-h-[60vh] object-contain rounded-lg bg-neutral-100"
              />
              <div className="text-[11px] text-neutral-600 font-mono text-center">
                {selectedReceiptOrder.bankReceipt.fileName} ({selectedReceiptOrder.bankReceipt.fileSize})
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </AnimatePresence>
  );
};
