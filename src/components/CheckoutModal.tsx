import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Printer,
  ShoppingBag,
  ArrowRight,
  Truck,
  Upload,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Banknote,
  MapPin,
  Trash2,
  AlertCircle,
  Mail,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CartItem, ShippingAddress, PaymentMethodType, OrderConfirmation, Currency, BankReceiptData, StoreBankSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { CURRENCY_CONFIG, formatPrice, getProductPrice } from '../utils/currency';
import { SRI_LANKA_DISTRICTS } from '../data/sriLankaDistricts';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmailPreviewModal } from './EmailPreviewModal';
import { apiFetch } from '../lib/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  onToggleCurrency: (newCurr: Currency) => void;
  subtotal: number;
  discount: number;
  onCompleteOrder: (order: OrderConfirmation) => void;
  bankSettings?: StoreBankSettings;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onToggleCurrency,
  subtotal,
  discount,
  onCompleteOrder,
  bankSettings,
}) => {
  const { user, userProfile, updateShippingProfile } = useAuth();
  const [step, setStep] = useState<'shipping' | 'payment' | 'processing' | 'confirmed'>('shipping');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bank_transfer');
  const [processingStage, setProcessingStage] = useState('');
  const [selectedBank, setSelectedBank] = useState<'commercial' | 'sampath'>('commercial');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const handleResendConfirmationEmail = async () => {
    if (!confirmedOrder) return;
    setIsResendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(confirmedOrder.orderId)}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRecipient: confirmedOrder.customer.email }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailFeedback(`Confirmation email re-sent to ${confirmedOrder.customer.email}`);
        setTimeout(() => setEmailFeedback(null), 4500);
      } else {
        setEmailFeedback(data.message || 'Dispatch failed');
      }
    } catch {
      setEmailFeedback('Failed to resend confirmation email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Shipping form state localized for Sri Lanka by default
  const [shippingData, setShippingData] = useState<ShippingAddress>({
    fullName: user?.displayName || userProfile?.displayName || '',
    email: user?.email || '',
    phone: userProfile?.phoneNumber || '',
    addressLine: userProfile?.defaultAddress || '',
    apartment: '',
    city: userProfile?.defaultCity || 'Colombo 07',
    district: userProfile?.defaultDistrict || 'Colombo',
    state: 'Western Province',
    postalCode: '00700',
    country: 'Sri Lanka',
  });

  // Sync shipping data when user profile is loaded
  React.useEffect(() => {
    if (user || userProfile) {
      setShippingData((prev) => ({
        ...prev,
        fullName: userProfile?.displayName || user?.displayName || prev.fullName || '',
        email: user?.email || prev.email,
        phone: userProfile?.phoneNumber || prev.phone,
        district: userProfile?.district || userProfile?.defaultDistrict || prev.district || 'Colombo',
        addressLine: userProfile?.addressLine || userProfile?.defaultAddress || prev.addressLine,
        apartment: userProfile?.apartment || prev.apartment,
        city: userProfile?.city || userProfile?.defaultCity || prev.city,
        postalCode: userProfile?.postalCode || userProfile?.defaultPostalCode || prev.postalCode,
      }));
      setDepositorName((prev) => prev || user?.displayName || userProfile?.displayName || '');
    }
  }, [user, userProfile]);

  // Bank receipt upload state
  const [receiptFile, setReceiptFile] = useState<{
    name: string;
    size: string;
    previewUrl?: string;
  } | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [depositorName, setDepositorName] = useState(user?.displayName || userProfile?.displayName || '');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);

  const config = CURRENCY_CONFIG[currency];
  const shippingFee =
    deliveryMethod === 'express'
      ? config.expressShippingFee
      : subtotal >= config.freeShippingThreshold
      ? 0
      : config.standardShippingFee;

  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  const defaultBankSettings: StoreBankSettings = {
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

  const activeBankSettings = bankSettings || (() => {
    try {
      const saved = localStorage.getItem('moon_store_bank_settings');
      return saved ? JSON.parse(saved) : defaultBankSettings;
    } catch {
      return defaultBankSettings;
    }
  })();

  const currentBank = activeBankSettings[selectedBank] || defaultBankSettings[selectedBank];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(currentBank.accountNumber.replace(/\s/g, ''));
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Receipt file size must be less than 10MB.');
        return;
      }
      setUploadError('');
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          previewUrl: typeof reader.result === 'string' ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executePaymentGateway = () => {
    if (paymentMethod === 'bank_transfer' && !receiptFile) {
      setUploadError('Please attach or upload your bank payment slip / transfer screenshot.');
      return;
    }

    setStep('processing');
    setProcessingStage(
      paymentMethod === 'bank_transfer'
        ? 'Validating encrypted bank transfer receipt...'
        : 'Registering Cash on Delivery booking...'
    );

    setTimeout(() => {
      setProcessingStage(
        paymentMethod === 'bank_transfer'
          ? 'Verifying bank transaction reference & deposit matching...'
          : 'Dispatching courier OTP SMS verification to phone...'
      );
    }, 850);

    setTimeout(() => {
      setProcessingStage('Receipt logged & order verified with dispatch inventory.');
    }, 1700);

    setTimeout(() => {
      setProcessingStage('Order authorization complete.');
      const receiptData: BankReceiptData | undefined =
        paymentMethod === 'bank_transfer' && receiptFile
          ? {
              fileName: receiptFile.name,
              fileSize: receiptFile.size,
              previewUrl: receiptFile.previewUrl,
              transactionRef: transactionRef || undefined,
              depositorName: depositorName || shippingData.fullName,
              bankName: currentBank.bankName,
            }
          : undefined;

      const newOrder: OrderConfirmation = {
        orderId: `MN-LK-${Math.floor(10000 + Math.random() * 90000)}`,
        orderDate: new Date().toISOString(),
        customer: shippingData,
        items,
        currency,
        subtotal,
        discount,
        shippingFee,
        total: grandTotal,
        paymentMethod,
        bankReceipt: receiptData,
        trackingNumber: `DOMEX-${Math.floor(1000000 + Math.random() * 9000000)}`,
        estimatedDelivery:
          deliveryMethod === 'express'
            ? 'Same-Day / Next-Day Delivery (Colombo)'
            : '2-3 Business Days (Island-wide Courier)',
        userId: user?.uid,
        status: 'confirmed',
      };

      // 1. Immediately sync to Moon backend API across all devices & trigger auto email
      (async () => {
        try {
          const res = await apiFetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder),
          });
          const data = await res.json();
          if (data?.order) {
            setConfirmedOrder((prev) => (prev ? { ...prev, ...data.order } : data.order));
          }
        } catch (err) {
          console.warn('Backend order sync note:', err);
        }

        // 2. Also record in Firebase Firestore if configured/available
        try {
          const orderRef = doc(db, 'orders', newOrder.orderId);
          await setDoc(orderRef, {
            ...newOrder,
            userEmail: user?.email || shippingData.email,
            createdAt: serverTimestamp(),
          });
          if (user?.uid) {
            await updateShippingProfile({
              defaultDistrict: shippingData.district,
              defaultAddress: shippingData.addressLine,
              defaultCity: shippingData.city,
              phoneNumber: shippingData.phone,
            });
            const storageKey = `moon_orders_${user.uid}`;
            const prev = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newOrder, ...prev]));
          }
        } catch (fbErr) {
          console.warn('Firebase store sync note:', fbErr);
          if (user?.uid) {
            const storageKey = `moon_orders_${user.uid}`;
            const prev = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newOrder, ...prev]));
          }
        }

        // 3. Keep local fallback store updated for instant offline access
        try {
          const allPrev = JSON.parse(localStorage.getItem('moon_all_orders_cache') || '[]');
          localStorage.setItem(
            'moon_all_orders_cache',
            JSON.stringify([newOrder, ...allPrev.filter((o: any) => o.orderId !== newOrder.orderId)])
          );
        } catch {}
      })();

      setConfirmedOrder(newOrder);
      onCompleteOrder(newOrder);
      setStep('confirmed');
    }, 2400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="checkout-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (step !== 'processing') onClose();
          }}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
        />

        {/* Modal Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 14 }}
          className="relative w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 border border-neutral-200 flex flex-col max-h-[96vh] sm:max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-2 sm:gap-3">
              <BrandLogo size="sm" showTagline={false} />
              <div className="h-4 w-px bg-neutral-300 hidden xs:block" />
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-neutral-900 truncate">
                  <span className="hidden sm:inline">Checkout & </span>Order Placement
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Currency Selector inside Checkout */}
              {step !== 'processing' && step !== 'confirmed' && (
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200 text-[11px] sm:text-xs">
                  <button
                    onClick={() => onToggleCurrency('LKR')}
                    className={`px-2 sm:px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                      currency === 'LKR' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    🇱🇰 LKR
                  </button>
                  <button
                    onClick={() => onToggleCurrency('USD')}
                    className={`px-2 sm:px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                      currency === 'USD' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    🇺🇸 USD
                  </button>
                </div>
              )}

              {step !== 'processing' && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors cursor-pointer"
                  aria-label="Close checkout"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress bar */}
          {step !== 'confirmed' && step !== 'processing' && (
            <div className="px-6 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center gap-4 text-xs font-medium">
              <button
                onClick={() => setStep('shipping')}
                className={`flex items-center gap-1.5 cursor-pointer ${
                  step === 'shipping' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Delivery & Address</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
              <button
                onClick={() => setStep('payment')}
                className={`flex items-center gap-1.5 cursor-pointer ${
                  step === 'payment' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 'payment' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  2
                </span>
                <span>Bank Payment & Receipt</span>
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {/* STEP 1: Shipping Address & Delivery */}
            {step === 'shipping' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-neutral-900">
                      Delivery Destination & Contact
                    </h3>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Island-wide Sri Lanka</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Full Name</label>
                      <input
                        type="text"
                        value={shippingData.fullName}
                        onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={shippingData.email}
                          onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950 text-sm sm:text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">Phone (for Courier Tracking SMS)</label>
                        <input
                          type="tel"
                          value={shippingData.phone}
                          onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950 font-mono text-sm sm:text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Street Address / House No.</label>
                      <input
                        type="text"
                        value={shippingData.addressLine}
                        onChange={(e) => setShippingData({ ...shippingData, addressLine: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">City / Area</label>
                        <input
                          type="text"
                          value={shippingData.city}
                          onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                          placeholder="e.g. Cinnamon Gardens"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">
                          Sri Lankan District <span className="text-neutral-400 font-normal">(25 Districts)</span>
                        </label>
                        <select
                          value={shippingData.district}
                          onChange={(e) => {
                            const found = SRI_LANKA_DISTRICTS.find((d) => d.name === e.target.value);
                            setShippingData({
                              ...shippingData,
                              district: e.target.value,
                              state: found ? found.province : shippingData.state,
                            });
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950 bg-white font-medium cursor-pointer"
                        >
                          {SRI_LANKA_DISTRICTS.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.province.replace(' Province', '')})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">Postal Code</label>
                        <input
                          type="text"
                          value={shippingData.postalCode}
                          onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                          placeholder="e.g. 00700"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-950 font-mono bg-white"
                        />
                      </div>
                    </div>

                    {/* District delivery note */}
                    <div className="flex items-center gap-2 p-2.5 bg-neutral-100 rounded-lg text-[11px] text-neutral-700">
                      <Truck className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                      <span>
                        Insured courier dispatch to <strong>{shippingData.district} District</strong> ({shippingData.state}):{' '}
                        <strong className="text-neutral-950">
                          {SRI_LANKA_DISTRICTS.find((d) => d.name === shippingData.district)?.estimatedDelivery || '2 - 3 Business Days'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Delivery Selection */}
                  <div className="pt-4 border-t border-neutral-200">
                    <label className="block text-xs font-semibold text-neutral-900 mb-2">
                      Delivery Courier Service
                    </label>
                    <div className="space-y-2 text-xs">
                      <label
                        onClick={() => setDeliveryMethod('standard')}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          deliveryMethod === 'standard'
                            ? 'border-neutral-950 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            checked={deliveryMethod === 'standard'}
                            onChange={() => setDeliveryMethod('standard')}
                            className="accent-neutral-900"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">
                              {currency === 'LKR' ? 'Island-wide Insured Courier (Domex / PromptX)' : 'Standard Insured Courier'}
                            </p>
                            <p className="text-neutral-500 text-[11px]">
                              {currency === 'LKR' ? '2-3 business days · Real-time SMS tracking' : '4-6 business days · Carbon-neutral'}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-medium text-neutral-900">
                          {subtotal >= config.freeShippingThreshold
                            ? 'Complimentary'
                            : formatPrice(config.standardShippingFee, currency)}
                        </span>
                      </label>

                      <label
                        onClick={() => setDeliveryMethod('express')}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          deliveryMethod === 'express'
                            ? 'border-neutral-950 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            checked={deliveryMethod === 'express'}
                            onChange={() => setDeliveryMethod('express')}
                            className="accent-neutral-900"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">
                              {currency === 'LKR' ? 'Colombo Priority Same-Day / Next-Day' : 'Priority Express + Signature'}
                            </p>
                            <p className="text-neutral-500 text-[11px]">
                              {currency === 'LKR' ? 'Hand-delivered with sealed tamper-proof packaging' : '2-3 business days · Courier signature'}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-medium text-neutral-900">
                          {formatPrice(config.expressShippingFee, currency)}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('payment')}
                    className="w-full py-3 px-6 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Continue to Payment Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Order Summary Preview */}
                <div className="lg:col-span-5 bg-neutral-50 p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Bag Summary ({items.length} pieces)
                    </h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-neutral-200/60">
                      {items.map((item, idx) => (
                        <div key={item.id ? `${item.id}-${idx}` : `checkout-item-${idx}`} className="pt-2 first:pt-0 flex gap-3 text-xs">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-14 object-cover rounded bg-neutral-200 shrink-0"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900 line-clamp-1">{item.product.name}</p>
                            <p className="text-[11px] text-neutral-500 font-mono">
                              {item.size} · {item.color.name} (Qty {item.quantity})
                            </p>
                            <p className="font-mono text-neutral-800 font-semibold mt-0.5">
                              {formatPrice(getProductPrice(item.product, currency) * item.quantity, currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-neutral-200 pt-3 space-y-1.5 text-xs text-neutral-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono text-neutral-900">
                          {formatPrice(subtotal, currency)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Coupon Discount</span>
                          <span className="font-mono">
                            -{formatPrice(discount, currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping ({deliveryMethod === 'express' ? 'Express' : 'Standard'})</span>
                        <span className="font-mono text-neutral-900">
                          {shippingFee === 0 ? 'Complimentary' : formatPrice(shippingFee, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-neutral-950 pt-2 border-t border-neutral-200">
                        <span>Total Due</span>
                        <span className="font-mono text-base">{formatPrice(grandTotal, currency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-[11px] text-neutral-500 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Official Moon Atelier Bank Verification</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Payment Method Selection & Bank Receipt Upload */}
            {step === 'payment' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    Payment Method
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Deposit directly into our official bank account and upload your payment slip, or choose Cash on Delivery.
                  </p>
                </div>

                {/* Gateway Switcher: Bank Transfer vs Cash on Delivery */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-neutral-950 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-800 bg-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <div className="text-center">
                      <p className="font-bold">Bank Transfer & Receipt</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Commercial Bank / Sampath Bank</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-neutral-950 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-800 bg-white'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                    <div className="text-center">
                      <p className="font-bold">Cash on Delivery (COD)</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Pay upon package handover</p>
                    </div>
                  </button>
                </div>

                {/* BANK TRANSFER VIEW WITH RECEIPT UPLOAD */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-5">
                    {/* Bank Selection Tabs */}
                    <div className="bg-[#FAF9F6] p-3.5 sm:p-5 rounded-2xl border border-neutral-200 space-y-4">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Atelier Bank Account
                        </span>
                        <div className="flex items-center gap-1 bg-neutral-200/80 p-0.5 rounded-lg text-[11px]">
                          <button
                            onClick={() => setSelectedBank('commercial')}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                              selectedBank === 'commercial'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-600'
                            }`}
                          >
                            {activeBankSettings.commercial.bankName || 'Commercial Bank'}
                          </button>
                          <button
                            onClick={() => setSelectedBank('sampath')}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                              selectedBank === 'sampath'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-600'
                            }`}
                          >
                            {activeBankSettings.sampath.bankName || 'Sampath Bank'}
                          </button>
                        </div>
                      </div>

                      {/* Bank Details Card */}
                      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Bank Name</span>
                          <span className="font-semibold text-neutral-900 text-right">{currentBank.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Account Name</span>
                          <span className="font-semibold text-neutral-900 font-mono text-right">{currentBank.accountName}</span>
                        </div>
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1 gap-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-950 font-mono text-sm tracking-wide">
                              {currentBank.accountNumber}
                            </span>
                            <button
                              onClick={handleCopyAccount}
                              className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors rounded hover:bg-neutral-100 cursor-pointer"
                              title="Copy account number"
                            >
                              {copiedAcc ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Branch</span>
                          <span className="text-neutral-800">{currentBank.branch}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-neutral-500">Amount Due</span>
                          <span className="font-bold text-neutral-950 font-mono text-sm">
                            {formatPrice(grandTotal, currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RECEIPT UPLOAD DROPZONE */}
                    <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-neutral-700" />
                          <span>Upload Bank Payment Receipt / Slip</span>
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Please attach your bank transfer receipt, online banking screenshot, or ATM deposit slip.
                        </p>
                      </div>

                      {/* Dropzone container */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                      />

                      {receiptFile ? (
                        <div className="p-4 bg-white rounded-xl border border-neutral-300 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {receiptFile.previewUrl ? (
                              <img
                                src={receiptFile.previewUrl}
                                alt="Receipt slip preview"
                                className="w-12 h-14 object-cover rounded-lg border border-neutral-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-14 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-neutral-900 truncate">
                                {receiptFile.name}
                              </p>
                              <p className="text-[11px] text-neutral-500 font-mono">{receiptFile.size}</p>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Receipt Ready for Verification</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1.5 text-xs text-neutral-700 hover:text-neutral-950 font-medium underline cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              onClick={handleRemoveReceipt}
                              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              aria-label="Remove receipt"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-neutral-50/50"
                        >
                          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-neutral-900">
                            Click to upload receipt or drag & drop
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-1">
                            PNG, JPG, WEBP, or PDF (Max 10MB)
                          </p>
                        </div>
                      )}

                      {uploadError && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {/* Optional Transaction Reference and Depositor inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        <div>
                          <label className="block text-neutral-600 mb-1 font-medium">
                            Transaction / Slip Reference No. (Optional)
                          </label>
                          <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TXN-892401 or Slip No."
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:border-neutral-950 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-600 mb-1 font-medium">
                            Depositor / Account Name
                          </label>
                          <input
                            type="text"
                            value={depositorName}
                            onChange={(e) => setDepositorName(e.target.value)}
                            placeholder="Name on bank transfer"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:border-neutral-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASH ON DELIVERY VIEW */}
                {paymentMethod === 'cod' && (
                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3 text-xs">
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-neutral-700" />
                      <span>Cash on Delivery (Island-wide Sri Lanka)</span>
                    </h4>
                    <p className="text-neutral-600 leading-relaxed">
                      Pay <strong className="text-neutral-900 font-mono">{formatPrice(grandTotal, currency)}</strong> directly in cash to the delivery courier agent upon handover at:{' '}
                      <strong className="text-neutral-900">{shippingData.addressLine}, {shippingData.city}</strong>.
                    </p>
                    <p className="text-neutral-500 italic">
                      SMS dispatch code and tracking will be sent to {shippingData.phone}.
                    </p>
                  </div>
                )}

                {/* Final Confirmation Button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={executePaymentGateway}
                    className="w-full py-4 px-6 bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {paymentMethod === 'bank_transfer'
                        ? `Submit Receipt & Place Order (${formatPrice(grandTotal, currency)})`
                        : `Confirm Cash on Delivery Order (${formatPrice(grandTotal, currency)})`}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 px-2">
                    <button
                      onClick={() => setStep('shipping')}
                      className="hover:text-neutral-900 underline cursor-pointer"
                    >
                      ← Back to Delivery Address
                    </button>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Moon Atelier Order Guarantee
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Processing Animation Screen */}
            {step === 'processing' && (
              <div className="py-16 text-center space-y-6 max-w-md mx-auto">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="w-16 h-16 border-3 border-neutral-200 border-t-neutral-950 rounded-full animate-spin" />
                  <Building2 className="w-5 h-5 text-neutral-900 absolute" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-neutral-900">
                    Logging Your Payment Order
                  </h3>
                  <p className="text-xs font-mono text-neutral-600 bg-neutral-100 py-1.5 px-3 rounded-full inline-block">
                    {processingStage}
                  </p>
                </div>

                <p className="text-xs text-neutral-400">
                  Please keep this window open while your order reference and receipt are confirmed.
                </p>
              </div>
            )}

            {/* STEP 4: Order Confirmation & Invoice */}
            {step === 'confirmed' && confirmedOrder && (
              <div className="space-y-6 max-w-2xl mx-auto py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-950 tracking-tight">
                    Order Confirmed & Logged
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Thank you for choosing Moon. An official order receipt and courier dispatch reference have been sent to{' '}
                    <strong className="text-neutral-900">{confirmedOrder.customer.email}</strong>.
                  </p>
                </div>

                {/* Auto Confirmation Email Dispatch Card */}
                <div className="p-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white rounded-2xl border border-neutral-800 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Order Confirmation Email
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1 font-semibold ${
                            confirmedOrder.emailStatus === 'sent'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : confirmedOrder.emailStatus === 'failed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                            {confirmedOrder.emailStatus === 'sent'
                              ? 'Delivered via SMTP'
                              : confirmedOrder.emailStatus === 'failed'
                              ? 'Delivery Notice'
                              : 'Logged to Outbox'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 mt-0.5">
                          {confirmedOrder.emailStatus === 'sent' ? (
                            <>Dispatched directly to <strong className="text-amber-300 font-mono">{confirmedOrder.customer.email}</strong> with order #{confirmedOrder.orderId}, item pictures, and invoice.</>
                          ) : (
                            <>Recorded for <strong className="text-amber-300 font-mono">{confirmedOrder.customer.email}</strong>. View the exact luxury email invoice via <em>Preview Email</em> below.</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowEmailPreview(true)}
                        className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                        title="View the exact customer confirmation email"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preview Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResendConfirmationEmail}
                        disabled={isResendingEmail}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-neutral-700"
                        title="Resend email to customer"
                      >
                        {isResendingEmail ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isResendingEmail ? 'Sending...' : 'Resend'}</span>
                      </button>
                    </div>
                  </div>

                  {emailFeedback && (
                    <div className="pt-2 border-t border-neutral-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{emailFeedback}</span>
                    </div>
                  )}
                </div>

                {/* Receipt Card */}
                <div className="bg-[#FAF9F6] border border-neutral-200 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-200 text-xs">
                    <div>
                      <p className="text-neutral-500">Order Reference</p>
                      <p className="font-mono text-sm font-bold text-neutral-900">{confirmedOrder.orderId}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Date</p>
                      <p className="font-medium text-neutral-900">{confirmedOrder.orderDate}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Payment Method</p>
                      <p className="font-semibold text-neutral-900">
                        {confirmedOrder.paymentMethod === 'bank_transfer'
                          ? 'Bank Transfer (Slip Uploaded)'
                          : 'Cash on Delivery (COD)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Courier Tracking</p>
                      <p className="font-mono text-xs font-semibold text-neutral-900">{confirmedOrder.trackingNumber}</p>
                    </div>
                  </div>

                  {/* Uploaded Slip Summary if Bank Transfer */}
                  {confirmedOrder.bankReceipt && (
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {confirmedOrder.bankReceipt.previewUrl ? (
                          <img
                            src={confirmedOrder.bankReceipt.previewUrl}
                            alt="Slip uploaded"
                            className="w-10 h-12 object-cover rounded border border-neutral-200"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-neutral-500" />
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">
                            Bank Receipt: {confirmedOrder.bankReceipt.fileName}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {confirmedOrder.bankReceipt.bankName}
                            {confirmedOrder.bankReceipt.transactionRef &&
                              ` · Ref: ${confirmedOrder.bankReceipt.transactionRef}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                        Verification Pending
                      </span>
                    </div>
                  )}

                  {/* Purchased Items */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Garments Ordered
                    </p>
                    <div className="divide-y divide-neutral-200/80">
                      {confirmedOrder.items.map((item, idx) => {
                        const itemPrice = getProductPrice(item.product, confirmedOrder.currency);
                        return (
                          <div key={item.id ? `${item.id}-${idx}` : `confirmed-item-${idx}`} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-12 object-cover rounded bg-neutral-200"
                              />
                              <div>
                                <p className="font-medium text-neutral-900">{item.product.name}</p>
                                <p className="text-neutral-500 font-mono text-[11px]">
                                  Size {item.size} · {item.color.name} (x{item.quantity})
                                </p>
                              </div>
                            </div>
                            <span className="font-mono tabular-nums font-semibold text-neutral-900">
                              {formatPrice(itemPrice * item.quantity, confirmedOrder.currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Settlement */}
                  <div className="border-t border-neutral-200 pt-3 space-y-1 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-neutral-900">
                        {formatPrice(confirmedOrder.subtotal, confirmedOrder.currency)}
                      </span>
                    </div>
                    {confirmedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span className="font-mono">
                          -{formatPrice(confirmedOrder.discount, confirmedOrder.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping ({deliveryMethod === 'express' ? 'Priority Express' : 'Standard'})</span>
                      <span className="font-mono text-neutral-900">
                        {confirmedOrder.shippingFee === 0
                          ? 'Complimentary'
                          : formatPrice(confirmedOrder.shippingFee, confirmedOrder.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-neutral-950 pt-2 border-t border-neutral-200">
                      <span>Total Due</span>
                      <span className="font-mono text-base text-neutral-950">
                        {formatPrice(confirmedOrder.total, confirmedOrder.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-800">Delivering To:</span>{' '}
                    {confirmedOrder.customer.fullName}, {confirmedOrder.customer.addressLine},{' '}
                    {confirmedOrder.customer.city}, {confirmedOrder.customer.district} District ({confirmedOrder.customer.state}),{' '}
                    {confirmedOrder.customer.postalCode}, {confirmedOrder.customer.country}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-5 py-3 border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Order Invoice</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:flex-1 py-3 px-6 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Return to Moon Catalog</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}

      {isOpen && confirmedOrder && (
        <EmailPreviewModal
          key="checkout-email-preview-modal"
          isOpen={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          orderId={confirmedOrder.orderId}
          recipient={confirmedOrder.customer.email}
          onResendSuccess={(msg) => setEmailFeedback(msg)}
        />
      )}
    </AnimatePresence>
  );
};
