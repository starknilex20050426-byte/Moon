import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem, Currency } from '../types';
import { CURRENCY_CONFIG, formatPrice, getProductPrice } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  onToggleCurrency: (newCurr: Currency) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCheckout: () => void;
  appliedDiscount: { code: string; percent: number; amount: number } | null;
  onApplyPromoCode: (code: string) => boolean;
  onRemovePromoCode: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onToggleCurrency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  appliedDiscount,
  onApplyPromoCode,
  onRemovePromoCode,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = items.reduce(
    (acc, item) => acc + getProductPrice(item.product, currency) * item.quantity,
    0
  );
  
  const config = CURRENCY_CONFIG[currency];
  const FREE_SHIPPING_THRESHOLD = config.freeShippingThreshold;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : config.standardShippingFee;

  const discountAmount = appliedDiscount
    ? appliedDiscount.percent > 0
      ? (subtotal * appliedDiscount.percent) / 100
      : currency === 'LKR'
      ? appliedDiscount.amount * 300
      : appliedDiscount.amount
    : 0;

  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;

    const success = onApplyPromoCode(promoInput.trim());
    if (success) {
      setPromoInput('');
    } else {
      setPromoError('Invalid coupon. Try "MOON15" or "STYLIST"');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="cart-drawer-overlay" className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            key="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-md bg-[#FAF9F6] h-full shadow-2xl flex flex-col z-10 border-l border-neutral-200"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-neutral-900" />
                <h2 className="text-base font-bold text-neutral-950 tracking-tight">
                  Shopping Bag
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-700">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              {/* Currency Selector inside Drawer */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200 text-[11px]">
                  <button
                    onClick={() => onToggleCurrency('LKR')}
                    className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                      currency === 'LKR' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    LKR
                  </button>
                  <button
                    onClick={() => onToggleCurrency('USD')}
                    className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                      currency === 'USD' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    USD
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors cursor-pointer"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Free Shipping Progress Indicator (only when items are in bag) */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-neutral-100/70 border-b border-neutral-200 text-xs">
                {amountToFreeShipping > 0 ? (
                  <p className="text-neutral-600 mb-1.5">
                    Add{' '}
                    <span className="font-bold text-neutral-900 font-mono">
                      {formatPrice(amountToFreeShipping, currency)}
                    </span>{' '}
                    more for Complimentary {currency === 'LKR' ? 'Island-wide Courier' : 'Delivery'}
                  </p>
                ) : (
                  <p className="text-emerald-700 font-medium mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Complimentary {currency === 'LKR' ? 'Island-wide Delivery' : 'Express Delivery'} Unlocked!</span>
                  </p>
                )}
                <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-neutral-200/60">
              {items.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Your shopping bag is empty</h3>
                    <p className="text-xs text-neutral-500 mt-1.5 max-w-xs leading-relaxed">
                      No items have been added yet. Browse our curated collection to start building your wardrobe.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2.5 text-xs tracking-wider uppercase font-semibold text-white bg-neutral-950 rounded-full hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer active:scale-98"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item, idx) => {
                  const itemPrice = getProductPrice(item.product, currency);
                  return (
                    <div key={item.id ? `${item.id}-${idx}` : `cart-item-${idx}`} className="pt-4 first:pt-0 flex gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-24 object-cover rounded-md bg-neutral-100 shrink-0 border border-neutral-200"
                      />

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-neutral-900 leading-snug">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-neutral-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                            <span>
                              Size: <strong className="text-neutral-700 font-mono">{item.size}</strong>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-neutral-300 inline-block"
                                style={{ backgroundColor: item.color.hex }}
                              />
                              {item.color.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Quantity Stepper with thumb-friendly touch targets */}
                          <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2.5 sm:px-3 py-1 text-sm text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 cursor-pointer transition-colors"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-2 sm:px-2.5 py-1 text-xs font-mono font-medium text-neutral-900 min-w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 sm:px-3 py-1 text-sm text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 cursor-pointer transition-colors"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-mono tabular-nums text-sm font-bold text-neutral-900">
                            {formatPrice(itemPrice * item.quantity, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer (Summary & Checkout) */}
            {items.length > 0 && (
              <div className="p-5 bg-white border-t border-neutral-200 space-y-4">
                {/* Promo code form */}
                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Code <strong>{appliedDiscount.code}</strong> applied (-{appliedDiscount.percent}% off)</span>
                    </div>
                    <button
                      onClick={onRemovePromoCode}
                      className="text-emerald-700 hover:text-emerald-950 text-[11px] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. MOON15)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <p className="text-[11px] text-red-600">{promoError}</p>}

                {/* Subtotal & Breakdown */}
                <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-neutral-900">
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span className="font-mono tabular-nums">
                        -{formatPrice(discountAmount, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-mono tabular-nums text-neutral-900">
                      {shippingFee === 0 ? 'Complimentary' : formatPrice(shippingFee, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-neutral-950 pt-2 border-t border-neutral-100">
                    <span>Estimated Total</span>
                    <span className="font-mono tabular-nums text-base">
                      {formatPrice(total, currency)}
                    </span>
                  </div>
                </div>

                {/* Proceed to Checkout Button */}
                <button
                  onClick={onCheckout}
                  className="w-full py-3.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer group"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Bank Transfer Slip Upload & Cash on Delivery</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
