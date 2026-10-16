import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Ruler, Truck, RotateCcw, ShieldCheck, Heart } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice, getProductPrice, getProductOriginalPrice } from '../utils/currency';

interface ProductQuickViewProps {
  product: Product | null;
  currency: Currency;
  onClose: () => void;
  onAddToCart: (product: Product, size: 'XS' | 'S' | 'M' | 'L' | 'XL', color: { name: string; hex: string }, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      <div key="product-quick-view-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          key="product-quick-view-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 border border-neutral-200"
        >
          {/* Close button with large touch target */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 sm:p-2.5 rounded-full bg-white/95 text-neutral-700 hover:text-neutral-950 hover:bg-white shadow-md transition-all cursor-pointer active:scale-95"
            aria-label="Close product preview"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Left: Product Image */}
            <div className="relative bg-neutral-100 aspect-4/3 sm:aspect-square md:aspect-auto md:min-h-[500px]">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-mono font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/90 backdrop-blur-xs rounded text-neutral-900 shadow-xs">
                  {product.fabricGsm}
                </span>
                {product.isNew && (
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-neutral-900 text-white rounded">
                    NEW ARRIVAL
                  </span>
                )}
              </div>
            </div>

            {/* Right: Purchase Module */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-5 sm:space-y-6">
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    <span>{product.category}</span>
                    <button
                      onClick={() => onToggleWishlist(product.id)}
                      className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-500'
                        }`}
                      />
                      <span>{isWishlisted ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {product.name}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">{product.subtitle}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="font-mono tabular-nums text-2xl font-bold text-neutral-950">
                    {formatPrice(getProductPrice(product, currency), currency)}
                  </span>
                  {getProductOriginalPrice(product, currency) && (
                    <span className="font-mono tabular-nums text-sm text-neutral-400 line-through">
                      {formatPrice(getProductOriginalPrice(product, currency)!, currency)}
                    </span>
                  )}
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    In Stock · Ships within 24h
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Color Selection */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-neutral-900">Color:</span>
                    <span className="text-neutral-500">{selectedColor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.colors.map((color, cIdx) => (
                      <button
                        key={`${product.id}-quick-color-${color.name}-${cIdx}`}
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                          selectedColor.name === color.name
                            ? 'border-neutral-950 scale-105'
                            : 'border-transparent hover:scale-105'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-neutral-300"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-neutral-900">Size:</span>
                    <button
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-950 underline underline-offset-2"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{showSizeGuide ? 'Hide Measurements' : 'Size Guide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size, sIdx) => (
                      <button
                        key={`${product.id}-quick-size-${size}-${sIdx}`}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                          selectedSize === size
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {/* Sizing Details Table if toggled */}
                  {showSizeGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-2"
                    >
                      <p className="font-semibold text-neutral-900">Garment Measurements (cm):</p>
                      <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-center border-t border-neutral-200 pt-1.5">
                        <span className="font-sans font-medium text-left">Size</span>
                        <span>Chest</span>
                        <span>Length</span>
                        <span>Shoulder</span>
                        <span className="font-semibold text-left">S</span>
                        <span>118</span>
                        <span>68</span>
                        <span>54</span>
                        <span className="font-semibold text-left">M</span>
                        <span>124</span>
                        <span>71</span>
                        <span>56</span>
                        <span className="font-semibold text-left">L</span>
                        <span>130</span>
                        <span>74</span>
                        <span>58</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 italic">
                        {product.fit}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Quantity & Action Button */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-lg bg-neutral-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 font-mono"
                    >
                      -
                    </button>
                    <span className="px-2 py-2 text-xs font-mono tabular-nums text-neutral-900 font-semibold min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 font-mono"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAdd}
                    disabled={addedSuccess}
                    className={`flex-1 py-3 px-6 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                      addedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-950 text-white hover:bg-neutral-800'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <span>Add to Bag · {formatPrice(getProductPrice(product, currency) * quantity, currency)}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Garment Highlights */}
              <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
                  <span>Ethical atelier fabrication & non-toxic dyes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
                  <span>Complimentary carbon-neutral standard delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-neutral-900 shrink-0" />
                  <span>30 days return window in original condition</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
