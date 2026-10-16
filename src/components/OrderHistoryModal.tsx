import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Clock, CheckCircle2, ChevronRight, ShoppingBag, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrderConfirmation, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  currency,
}) => {
  const { user, userProfile, getUserOrders } = useAuth();
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      getUserOrders()
        .then((data) => {
          setOrders(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen, user]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="order-history-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="order-history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    My Purchases & Orders
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {user?.email} · Saved in Firebase
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-200/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {isLoading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-neutral-500 font-mono">Fetching your orders from Firebase...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
                    <Package className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-neutral-900">No purchases found</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      You haven't placed any orders with this account yet. When you complete checkout, all your purchases and delivery receipts will appear here.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-neutral-950 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, oIdx) => (
                    <div
                      key={order.orderId ? `${order.orderId}-${oIdx}` : `history-order-${oIdx}`}
                      className="border border-neutral-200 rounded-xl p-4 sm:p-5 hover:border-neutral-400 transition-all bg-white shadow-2xs"
                    >
                      {/* Order top bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-900">
                            {order.orderId}
                          </span>
                          <span className="text-neutral-400">·</span>
                          <span className="text-xs text-neutral-500">
                            {new Date(order.orderDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.paymentMethod === 'bank_transfer' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Bank Slip Uploaded
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Cash on Delivery
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-800">
                            {order.status === 'confirmed' ? 'Confirmed' : 'Processing'}
                          </span>
                        </div>
                      </div>

                      {/* Items previews */}
                      <div className="py-3 flex flex-wrap gap-3 items-center">
                        {order.items.map((item, idx) => (
                          <div key={item.id ? `${item.id}-${idx}` : `hist-item-${order.orderId || oIdx}-${idx}`} className="flex items-center gap-2 bg-neutral-50 p-1.5 pr-3 rounded-lg border border-neutral-200/70">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-10 h-12 object-cover rounded bg-neutral-100"
                            />
                            <div className="text-left text-xs">
                              <p className="font-medium text-neutral-900 line-clamp-1">{item.product.name}</p>
                              <p className="text-[10px] text-neutral-500 font-mono">
                                {item.size} · {item.color.name} · {item.quantity}x
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order footer info */}
                      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2">
                        <div>
                          <span>Delivery to: </span>
                          <strong className="text-neutral-900">{order.customer.district}, Sri Lanka</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Total Paid:</span>
                          <span className="font-mono font-bold text-sm text-neutral-950">
                            {formatPrice(order.total, order.currency || currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
