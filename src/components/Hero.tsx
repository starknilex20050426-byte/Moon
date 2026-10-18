import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { HERO_IMAGE } from '../data/products';

import { Currency, HeroSettings } from '../types';
import { CURRENCY_CONFIG, formatPrice } from '../utils/currency';

interface HeroProps {
  onExploreClick: () => void;
  currency: Currency;
  heroSettings?: HeroSettings;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, currency, heroSettings }) => {
  const currentHeroImg = heroSettings?.imageUrl || HERO_IMAGE;
  const currentSubtitle = heroSettings?.subtitle || 'Lookbook 2026';
  const currentTitle = heroSettings?.title || 'Concrete & Light · Silhouette Study';
  const currentBadge = heroSettings?.badge || 'Drop 01';

  return (
    <section className="relative overflow-hidden bg-[#FAF9F6] border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Copy & Manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              <span>Collection 01</span>
              <span aria-hidden="true">/</span>
              <span>Autumn Winter Edition</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-neutral-900 leading-[1.12] sm:leading-[1.08] [text-wrap:balance]">
                Architectural drape. <span className="font-serif italic font-normal">Pure posture.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-neutral-600 font-normal leading-relaxed max-w-lg">
                Moon crafts heavyweight streetwear and structured tailoring rooted in Japanese selvedge denim and dense organic terry. Kept strictly stylish.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-neutral-950 text-white text-xs sm:text-sm font-medium tracking-wide hover:bg-neutral-800 transition-all rounded-full shadow-sm hover:shadow group cursor-pointer"
              >
                <span>Shop Catalog</span>
                <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              </button>
              
              <a
                href="#story-section"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:py-3.5 bg-white border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-medium tracking-wide hover:bg-neutral-50 hover:border-neutral-400 transition-all rounded-full text-center"
              >
                The Moon Story
              </a>
            </div>

            {/* Quiet Trust Signals */}
            <div className="pt-5 sm:pt-6 border-t border-neutral-200/80 grid grid-cols-3 gap-2 sm:gap-4 text-neutral-600 text-[11px] sm:text-xs text-center sm:text-left">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="font-bold sm:font-semibold text-neutral-900">480 GSM</p>
                <p className="text-neutral-500 text-[10px] sm:text-xs">Combed Cotton</p>
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="font-bold sm:font-semibold text-neutral-900">14oz Selvedge</p>
                <p className="text-neutral-500 text-[10px] sm:text-xs">Kojima Mills</p>
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="font-bold sm:font-semibold text-neutral-900">Zero Plastic</p>
                <p className="text-neutral-500 text-[10px] sm:text-xs">Compostable</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Hero Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative group"
          >
            <div className="relative aspect-4/3 sm:aspect-16/10 lg:aspect-16/9 overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
              <img
                src={currentHeroImg}
                alt={currentTitle}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== HERO_IMAGE) {
                    target.src = HERO_IMAGE;
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              
              {/* Floating campaign caption */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between text-white pointer-events-none">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-200">{currentSubtitle}</p>
                  <p className="text-xs sm:text-base font-medium">{currentTitle}</p>
                </div>
                <span className="text-[10px] sm:text-xs font-mono px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-full text-white">
                  {currentBadge}
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Value Proposition Bar */}
      <div className="border-t border-neutral-200 bg-white/60 backdrop-blur-xs py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-neutral-600">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>
                Free shipping over{' '}
                {formatPrice(CURRENCY_CONFIG[currency].freeShippingThreshold, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>SSL Encrypted Checkout</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <RefreshCw className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>30-Day Easy Returns</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Sparkles className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>Hand-Numbered Limited Runs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
