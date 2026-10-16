export type Currency = 'LKR' | 'USD';

export interface CategoryGroup {
  id: string;
  label: string;
  clothingTypes: string[];
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  clothingType: string;
  priceLKR: number;
  priceUSD: number;
  originalPriceLKR?: number;
  originalPriceUSD?: number;
  image: string;
  secondaryImage?: string;
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL')[];
  colors: { name: string; hex: string }[];
  description: string;
  details: string[];
  fabricGsm: string;
  fit: string;
  careInstructions: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL';
  color: { name: string; hex: string };
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  apartment?: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
}

export type PaymentMethodType = 'bank_transfer' | 'cod';

export interface BankReceiptData {
  fileName: string;
  fileSize: string;
  previewUrl?: string;
  transactionRef?: string;
  depositorName?: string;
  bankName: string;
}

export interface OrderConfirmation {
  orderId: string;
  orderDate: string;
  customer: ShippingAddress;
  items: CartItem[];
  currency: Currency;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethodType;
  bankReceipt?: BankReceiptData;
  trackingNumber: string;
  estimatedDelivery: string;
  userId?: string;
  status?: 'pending_verification' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  emailStatus?: 'sent' | 'pending' | 'failed';
  emailSentAt?: string;
  emailRecipient?: string;
}

export interface StoreEmailSettings {
  autoSendOrderEmail: boolean;
  senderName: string;
  senderEmail: string;
  ownerNotificationEmail: string;
  notifyOwnerOnNewOrder: boolean;
  emailSubjectTemplate?: string;
  smtpConfig?: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

export type UserRole = 'customer' | 'management' | 'owner';
export type UserAccountStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role?: UserRole;
  accountStatus?: UserAccountStatus;
  phoneNumber?: string;
  createdAt?: string;
  addressLine?: string;
  apartment?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  // Legacy compatibility aliases
  defaultDistrict?: string;
  defaultAddress?: string;
  defaultCity?: string;
  defaultPostalCode?: string;
}

export interface PromoCode {
  code: string;
  percent?: number;
  amountLKR?: number;
  amountUSD?: number;
  description: string;
  isActive: boolean;
  minSpend?: number;
}

export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swift?: string;
  bankCode?: string;
}

export interface StoreBankSettings {
  commercial: BankAccountDetails;
  sampath: BankAccountDetails;
}

export interface StoreSettings {
  announcementText: string;
  isAnnouncementActive: boolean;
  freeShippingThresholdLKR: number;
  freeShippingThresholdUSD: number;
  standardShippingFeeLKR: number;
  standardShippingFeeUSD: number;
  expressShippingFeeLKR: number;
  expressShippingFeeUSD: number;
  isPortalLocked?: boolean;
  portalLockedAt?: string;
  portalLockedBy?: string;
  bankSettings?: StoreBankSettings;
  emailSettings?: StoreEmailSettings;
}
