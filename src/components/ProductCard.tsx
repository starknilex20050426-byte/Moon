import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Eye, Plus, Check } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice, getProductPrice, getProductOriginalPrice } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, size: 'XS' | 'S' | 'M' | 'L' | 'XL', color: { name: string; hex: string }) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onQuickView,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [selectedSize, setSelectedSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize, selectedColor);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-neutral-200/90 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onQuickView(product)}
    >
      {/* Visual Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Minimal Unboxed Editorial Tag */}
        {product.isNew && (
          <div className="absolute top-3 left-3 bg-neutral-950/85 backdrop-blur-xs text-white text-[10px] uppercase font-semibold tracking-widest px-2.5 py-1 rounded-sm">
            Drop 01
          </div>
        )}
        {product.isBestSeller && !product.isNew && (
          <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] uppercase font-semibold tracking-widest px-2.5 py-1 rounded-sm">
            Core Signature
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleHeartClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-neutral-800 hover:text-red-500 transition-colors shadow-xs"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-700'
            }`}
          />
        </button>

        {/* Hover Quick View Pill Button */}
        <div className="absolute inset-x-3 sm:inset-x-4 bottom-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-semibold rounded-lg shadow-md hover:bg-neutral-950 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View & Measurements</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
        {/* Category & Weight Metadata */}
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-wider mb-1">
            <span className="text-[11px] sm:text-xs">{product.clothingType || product.category}</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-neutral-400">{product.fabricGsm}</span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-1 mt-0.5">
            {product.subtitle}
          </p>
        </div>

        {/* Color Swatches and Size Quick Pills */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between gap-1 text-xs">
            {/* Color Swatch Dots with comfortable touch target */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {product.colors.map((color, cIdx) => (
                <button
                  key={`${product.id}-color-${color.name}-${cIdx}`}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color.name}`}
                  className={`w-5 h-5 sm:w-4 sm:h-4 rounded-full border transition-all cursor-pointer ${
                    selectedColor.name === color.name
                      ? 'ring-2 ring-neutral-900 ring-offset-1 border-transparent scale-110'
                      : 'border-neutral-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            {/* Size selector buttons */}
            <div className="flex items-center gap-1 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
              {product.sizes.map((size, sIdx) => (
                <button
                  key={`${product.id}-size-${size}-${sIdx}`}
                  onClick={() => setSelectedSize(size)}
                  className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-mono rounded min-w-[22px] sm:min-w-[24px] text-center transition-colors cursor-pointer ${
                    selectedSize === size
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Quick Add CTA */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-xs sm:text-base font-bold text-neutral-950">
                {formatPrice(getProductPrice(product, currency), currency)}
              </span>
              {getProductOriginalPrice(product, currency) && (
                <span className="font-mono tabular-nums text-[10px] sm:text-xs text-neutral-400 line-through">
                  {formatPrice(getProductOriginalPrice(product, currency)!, currency)}
                </span>
              )}
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={justAdded}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 active:scale-95 shrink-0 ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-950 text-neutral-900 hover:text-white cursor-pointer'
              }`}
              aria-label={`Add ${product.name} to bag`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
