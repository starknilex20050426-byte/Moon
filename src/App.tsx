/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Heart,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Product, CartItem, OrderConfirmation, Currency, PromoCode, StoreBankSettings, CategoryGroup, HeroSettings } from './types';
import { PRODUCTS, CATEGORIES_CONFIG } from './data/products';
import { CURRENCY_CONFIG, formatPrice, getProductPrice } from './utils/currency';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { CraftsmanshipSection } from './components/CraftsmanshipSection';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import { apiFetch } from './lib/api';

export default function App() {
  const { user, canSeeAdminPortal, isOwner, isManagement } = useAuth();

  // Currency state: First showing in LKR for Sri Lanka by default
  const [currency, setCurrency] = useState<Currency>('LKR');

  // Initial empty shopping cart on first visit
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalCheckoutNotice, setAuthModalCheckoutNotice] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'orders'>('profile');
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Products catalog managed by Admin Portal
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      const custom = localStorage.getItem('moon_custom_products');
      return custom ? JSON.parse(custom) : PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });

  // Promo codes managed by Admin Portal
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    const defaultCodes: PromoCode[] = [
      { code: 'STYLIST', percent: 10, description: 'VIP Stylist Member Discount', isActive: true },
      { code: 'MOON15', percent: 15, description: 'Seasonal Lookbook Campaign', isActive: true },
      { code: 'COLOMBO', amountLKR: 5000, amountUSD: 20, description: 'Colombo Launch Privilege', isActive: true },
      { code: 'WELCOME', amountLKR: 3000, amountUSD: 10, description: 'First Order Welcome Voucher', isActive: true },
    ];
    try {
      const custom = localStorage.getItem('moon_promo_codes');
      return custom ? JSON.parse(custom) : defaultCodes;
    } catch {
      return defaultCodes;
    }
  });

  // Top Store Announcement Banner (Single banner removable/displayable by Owner or Manager)
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('moon_banner_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [announcementText, setAnnouncementText] = useState(() => {
    try {
      const saved = localStorage.getItem('moon_store_announcement');
      return saved || '🇱🇰 Island-Wide Express Courier across Sri Lanka · Free Island-Wide Delivery on orders over LKR 50,000 / $160';
    } catch {
      return '🇱🇰 Island-Wide Express Courier across Sri Lanka · Free Island-Wide Delivery on orders over LKR 50,000 / $160';
    }
  });

  // Store Bank Accounts for Bank Transfer Checkout (Configurable in Admin Portal by Owner or Manager)
  const [bankSettings, setBankSettings] = useState<StoreBankSettings>(() => {
    const defaultSettings: StoreBankSettings = {
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
    try {
      const saved = localStorage.getItem('moon_store_bank_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Store Categories and Clothing Type Subcategories (Managed in Admin Portal)
  const [categories, setCategories] = useState<CategoryGroup[]>(() => {
    try {
      const saved = localStorage.getItem('moon_categories_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return CATEGORIES_CONFIG;
  });

  // Main Hero Lookbook Campaign Settings (Configurable in Admin Portal)
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(() => {
    const defaultHeroSettings: HeroSettings = {
      imageUrl: '',
      subtitle: 'Lookbook 2026',
      title: 'Concrete & Light · Silhouette Study',
      badge: 'Drop 01',
    };
    try {
      const saved = localStorage.getItem('moon_hero_settings');
      return saved ? { ...defaultHeroSettings, ...JSON.parse(saved) } : defaultHeroSettings;
    } catch {
      return defaultHeroSettings;
    }
  });

  const handleUpdateHeroSettings = (newSettings: Partial<HeroSettings>) => {
    setHeroSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('moon_hero_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save hero settings:', e);
      }
      return updated;
    });
  };

  // Load persistent store settings and categories from server API
  useEffect(() => {
    apiFetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (typeof data.settings.isBannerVisible === 'boolean') {
            setIsBannerVisible(data.settings.isBannerVisible);
            localStorage.setItem('moon_banner_visible', String(data.settings.isBannerVisible));
          }
          if (data.settings.bannerText) {
            setAnnouncementText(data.settings.bannerText);
            localStorage.setItem('moon_store_announcement', data.settings.bannerText);
          }
          if (data.settings.bankSettings) {
            setBankSettings(data.settings.bankSettings);
            localStorage.setItem('moon_store_bank_settings', JSON.stringify(data.settings.bankSettings));
          }
          if (data.settings.heroSettings) {
            setHeroSettings((prev) => ({ ...prev, ...data.settings.heroSettings }));
            localStorage.setItem('moon_hero_settings', JSON.stringify(data.settings.heroSettings));
          }
        }
      })
      .catch(() => {});

    // Fetch categories from server
    apiFetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          localStorage.setItem('moon_categories_config', JSON.stringify(data.categories));
        }
      })
      .catch(() => {});

    // Fetch custom products from server
    apiFetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
          localStorage.setItem('moon_custom_products', JSON.stringify(data.products));
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateProducts = (updated: Product[]) => {
    setProductsList(updated);
    try {
      localStorage.setItem('moon_custom_products', JSON.stringify(updated));
      apiFetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated }),
      }).catch(() => {});
    } catch {}
  };

  const handleToggleBannerVisibility = (visible: boolean) => {
    setIsBannerVisible(visible);
    try {
      localStorage.setItem('moon_banner_visible', String(visible));
      apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBannerVisible: visible }),
      }).catch(() => {});
    } catch {}
    showToast(visible ? 'Banner is now displayed on the store.' : 'Banner has been removed from the store.');
  };

  const handleUpdateAnnouncement = (text: string) => {
    setAnnouncementText(text);
    try {
      localStorage.setItem('moon_store_announcement', text);
      apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerText: text }),
      }).catch(() => {});
    } catch {}
    showToast('Store announcement banner updated');
  };

  const handleUpdateBankSettings = (newSettings: StoreBankSettings) => {
    setBankSettings(newSettings);
    try {
      localStorage.setItem('moon_store_bank_settings', JSON.stringify(newSettings));
      apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankSettings: newSettings }),
      }).catch(() => {});
    } catch {}
    showToast('Bank details updated successfully!');
  };

  // Category and Subcategory Management handlers
  const handleAddCategory = async (label: string, initialSubcategories: string[] = []) => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;
    const categoryId = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (categories.some((c) => c.id === categoryId)) {
      showToast(`Category "${cleanLabel}" already exists!`);
      return;
    }
    const newCat: CategoryGroup = {
      id: categoryId,
      label: cleanLabel,
      clothingTypes: initialSubcategories.filter(Boolean),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    try {
      localStorage.setItem('moon_categories_config', JSON.stringify(updated));
    } catch {}
    showToast(`Created category "${cleanLabel}"`);

    try {
      await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId, label: cleanLabel, clothingTypes: newCat.clothingTypes }),
      });
    } catch (err) {
      console.warn('Failed to sync new category to server:', err);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    const catToRemove = categories.find((c) => c.id === categoryId);
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    try {
      localStorage.setItem('moon_categories_config', JSON.stringify(updated));
    } catch {}
    if (activeCategory === categoryId) {
      setActiveCategory('all');
      setActiveClothingType('all');
    }
    showToast(`Removed category "${catToRemove?.label || categoryId}"`);

    try {
      await apiFetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to sync category removal to server:', err);
    }
  };

  const handleAddSubcategory = async (categoryId: string, subcategoryName: string) => {
    const trimmed = subcategoryName.trim();
    if (!trimmed) return;
    const updated = categories.map((cat) => {
      if (cat.id === categoryId) {
        if (cat.clothingTypes.includes(trimmed)) return cat;
        return {
          ...cat,
          clothingTypes: [...cat.clothingTypes, trimmed],
        };
      }
      return cat;
    });
    setCategories(updated);
    try {
      localStorage.setItem('moon_categories_config', JSON.stringify(updated));
    } catch {}
    showToast(`Added subcategory "${trimmed}"`);

    try {
      await apiFetch(`/api/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch (err) {
      console.warn('Failed to sync subcategory to server:', err);
    }
  };

  const handleRemoveSubcategory = async (categoryId: string, subcategoryName: string) => {
    const updated = categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          clothingTypes: cat.clothingTypes.filter((t) => t !== subcategoryName),
        };
      }
      return cat;
    });
    setCategories(updated);
    try {
      localStorage.setItem('moon_categories_config', JSON.stringify(updated));
    } catch {}
    if (activeClothingType === subcategoryName) {
      setActiveClothingType('all');
    }
    showToast(`Removed subcategory "${subcategoryName}"`);

    try {
      await apiFetch(`/api/categories/${categoryId}/subcategories/${encodeURIComponent(subcategoryName)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to sync subcategory removal to server:', err);
    }
  };

  const handleUpdateCategories = async (newCategories: CategoryGroup[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem('moon_categories_config', JSON.stringify(newCategories));
      await apiFetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newCategories }),
      });
    } catch {}
  };

  // Category & Specific Clothing Type Filter
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeClothingType, setActiveClothingType] = useState<string>('all');
  const [isCatalogCategoryDropdownOpen, setIsCatalogCategoryDropdownOpen] = useState(false);
  const catalogCategoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catalogCategoryRef.current && !catalogCategoryRef.current.contains(event.target as Node)) {
        setIsCatalogCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [filterStockOnly, setFilterStockOnly] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // Promo discounts (applied by user if entered)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
    amount: number;
  } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);

  const showToast = (text: string) => {
    const id = Math.random().toString();
    setToast({ id, text });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2800);
  };

  const handleToggleCurrency = (newCurr: Currency) => {
    setCurrency(newCurr);
    showToast(
      newCurr === 'LKR'
        ? '🇱🇰 Switched prices to LKR (Sri Lankan Rupee)'
        : '🇺🇸 Switched prices to USD (US Dollar)'
    );
  };

  // Add to Bag
  const handleAddToCart = (
    product: Product,
    size: 'XS' | 'S' | 'M' | 'L' | 'XL',
    color: { name: string; hex: string },
    quantity: number = 1
  ) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.size === size && item.color.name === color.name
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${size}-${color.name}-${Date.now()}`,
          productId: product.id,
          product,
          size,
          color,
          quantity,
        };
        return [...prev, newItem];
      }
    });

    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}${product.name} (${size}) to Bag`);
  };

  // Cart operations
  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  // Wishlist operations
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isFavorited = prev.includes(productId);
      if (isFavorited) {
        showToast('Removed piece from wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved piece to wishlist');
        return [...prev, productId];
      }
    });
  };

  // Promo code validation
  const handleApplyPromoCode = (code: string): boolean => {
    const upper = code.trim().toUpperCase();
    const match = promoCodes.find((p) => p.code === upper && p.isActive);
    if (match) {
      if (match.percent) {
        setAppliedDiscount({ code: match.code, percent: match.percent, amount: 0 });
        showToast(`Code ${match.code} applied: ${match.percent}% discount!`);
      } else {
        const amount = currency === 'LKR' ? (match.amountLKR || 3000) / 300 : (match.amountUSD || 10);
        setAppliedDiscount({ code: match.code, percent: 0, amount });
        showToast(`Code ${match.code} applied!`);
      }
      return true;
    }
    showToast(`Coupon code "${code}" is invalid or expired.`);
    return false;
  };

  const handleRemovePromoCode = () => {
    setAppliedDiscount(null);
    showToast('Promo code removed');
  };

  // Order completed
  const handleCompleteOrder = (order: OrderConfirmation) => {
    setCartItems([]);
    showToast(`Order ${order.orderId} successfully confirmed!`);
  };

  // Available clothing types for currently active category
  const availableClothingTypes = useMemo(() => {
    if (activeCategory === 'all') {
      const types = new Set<string>();
      productsList.forEach((p) => {
        if (p.clothingType) types.add(p.clothingType);
      });
      return Array.from(types);
    }
    const group = categories.find((c) => c.id === activeCategory);
    return group && Array.isArray(group.clothingTypes)
      ? Array.from(new Set(group.clothingTypes.filter(Boolean)))
      : [];
  }, [activeCategory, productsList, categories]);

  // Filtered & sorted product list
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // Category filter
      if (activeCategory !== 'all' && product.category !== activeCategory) {
        return false;
      }
      // Specific Clothing Type filter
      if (activeClothingType !== 'all' && product.clothingType !== activeClothingType) {
        return false;
      }
      // Wishlist filter
      if (showWishlistOnly && !wishlist.includes(product.id)) {
        return false;
      }
      // Stock filter
      if (filterStockOnly && !product.inStock) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSub = product.subtitle.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        const matchesType = product.clothingType.toLowerCase().includes(query);
        if (!matchesName && !matchesSub && !matchesDesc && !matchesCat && !matchesType) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const priceA = getProductPrice(a, currency);
      const priceB = getProductPrice(b, currency);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return 0; // featured default
    });
  }, [activeCategory, activeClothingType, showWishlistOnly, filterStockOnly, searchQuery, sortBy, wishlist, currency, productsList]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + getProductPrice(item.product, currency) * item.quantity,
    0
  );
  const cartDiscountAmount = appliedDiscount
    ? appliedDiscount.percent > 0
      ? (cartSubtotal * appliedDiscount.percent) / 100
      : currency === 'LKR'
      ? appliedDiscount.amount * 300
      : appliedDiscount.amount
    : 0;

  const handleOpenProfile = (tab: 'profile' | 'orders' = 'profile') => {
    setProfileInitialTab(tab);
    if (!user) {
      setAuthModalCheckoutNotice(false);
      setIsAuthModalOpen(true);
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Store Announcement Bar (Single Banner - Configurable in Admin Portal) */}
      {isBannerVisible && (
        <div className="bg-neutral-950 text-white text-[11px] py-1.5 px-3 sm:px-4 text-center tracking-wider font-medium flex items-center justify-between border-b border-neutral-900 transition-all w-full max-w-full overflow-hidden">
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate max-w-2xl sm:max-w-4xl">{announcementText}</span>
          </div>
          {canSeeAdminPortal && (
            <button
              onClick={() => setIsAdminPortalOpen(true)}
              className="text-[10px] text-amber-300 hover:text-amber-200 font-mono tracking-normal underline shrink-0 pl-2 cursor-pointer inline-flex items-center gap-1 font-bold"
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Admin ({isOwner ? 'Owner' : 'Staff'})</span>
            </button>
          )}
        </div>
      )}

      {/* Strict Top Bar Contract Header */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          setAuthModalCheckoutNotice(false);
          setIsAuthModalOpen(true);
        }}
        onOpenOrders={() => handleOpenProfile('orders')}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={() => {
          if (canSeeAdminPortal) {
            setIsAdminPortalOpen(true);
          }
        }}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveClothingType('all');
        }}
        activeClothingType={activeClothingType}
        onSelectClothingType={setActiveClothingType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        categories={categories}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Campaign Hero Section */}
        <Hero
          currency={currency}
          heroSettings={heroSettings}
          onExploreClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Catalog Section */}
        <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Catalog Controls Header */}
          <div className="flex flex-col gap-6 pb-6 border-b border-neutral-200">
            {/* Top row: Section Title & Result Count */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                  Signature Catalog
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  Autumn Winter 2026 Architectural Essentials · {filteredProducts.length} curated{' '}
                  {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                  {activeClothingType !== 'all' && (
                    <span>
                      {' '}· Category:{' '}
                      <strong className="text-neutral-900">{activeClothingType}</strong>
                    </span>
                  )}
                  {' '}· Showing in <strong className="text-neutral-800">{currency}</strong>
                </p>
              </div>

              {/* Wishlist quick filter toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWishlistOnly(!showWishlistOnly)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showWishlistOnly
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-white' : ''}`} />
                  <span>Wishlist ({wishlist.length})</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Interactive Segmented Category Tabs & Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Clean Category Navigation: All Pieces + Category Option */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveClothingType('all');
                    setIsCatalogCategoryDropdownOpen(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all' && activeClothingType === 'all'
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  All Pieces
                </button>

                {/* CATEGORY OPTION BUTTON */}
                <div className="relative" ref={catalogCategoryRef}>
                  <button
                    onClick={() => setIsCatalogCategoryDropdownOpen(!isCatalogCategoryDropdownOpen)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory !== 'all' || activeClothingType !== 'all'
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {activeClothingType !== 'all'
                        ? `Type: ${activeClothingType}`
                        : activeCategory !== 'all'
                        ? `Category: ${categories.find((c) => c.id === activeCategory)?.label || activeCategory}`
                        : 'Category Options'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isCatalogCategoryDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu when customer goes on Category option: reveals clothing types grouped by category */}
                  {isCatalogCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-3 sm:p-4 z-40 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Select Category & Clothing Type
                        </span>
                        <button
                          onClick={() => {
                            setActiveCategory('all');
                            setActiveClothingType('all');
                            setIsCatalogCategoryDropdownOpen(false);
                          }}
                          className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-medium cursor-pointer"
                        >
                          View All Pieces
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                        {categories.map((group, gIdx) => {
                          const isCatSelected = activeCategory === group.id;
                          return (
                            <div
                              key={`cat-${group.id}-${gIdx}`}
                              className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5"
                            >
                              {/* Category Header Button */}
                              <button
                                onClick={() => {
                                  setActiveCategory(group.id);
                                  setActiveClothingType('all');
                                  setIsCatalogCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer pb-1 border-b border-neutral-200/70 transition-colors ${
                                  isCatSelected && activeClothingType === 'all'
                                    ? 'text-neutral-950 font-extrabold'
                                    : 'text-neutral-800 hover:text-neutral-950'
                                }`}
                              >
                                <span>{group.label}</span>
                                <ChevronRight className="w-3 h-3 text-neutral-400" />
                              </button>

                              {/* Clothing Types list inside Category */}
                              <div className="space-y-1 pt-0.5">
                                {Array.from(new Set(group.clothingTypes || [])).map((type, tIdx) => {
                                  const isTypeActive = activeClothingType === type;
                                  const count = productsList.filter((p) => p.clothingType === type).length;
                                  return (
                                    <button
                                      key={`cat-type-${group.id}-${type}-${tIdx}`}
                                      onClick={() => {
                                        setActiveCategory(group.id);
                                        setActiveClothingType(type);
                                        setIsCatalogCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                                        isTypeActive
                                          ? 'bg-neutral-950 text-white font-medium shadow-xs'
                                          : 'text-neutral-600 hover:bg-white hover:text-neutral-950'
                                      }`}
                                    >
                                      <span>{type}</span>
                                      <span
                                        className={`text-[10px] font-mono ${
                                          isTypeActive ? 'text-neutral-300' : 'text-neutral-400'
                                        }`}
                                      >
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter & Sort Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Stock filter toggle */}
                <button
                  onClick={() => setFilterStockOnly(!filterStockOnly)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    filterStockOnly
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  In Stock Only
                </button>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort catalog"
                    className="bg-transparent text-neutral-800 font-medium focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="featured">Featured Curations</option>
                    <option value="newest">Newest Drops</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                {/* Reset Filters if active */}
                {(activeCategory !== 'all' || activeClothingType !== 'all' || showWishlistOnly || filterStockOnly || searchQuery) && (
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveClothingType('all');
                      setShowWishlistOnly(false);
                      setFilterStockOnly(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 underline px-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* CLOTHING TYPES ROW: Triggered by Category option */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x pt-1 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3 text-neutral-700" />
                <span>Clothing Types:</span>
              </span>

              {/* "All Types" in current category */}
              <button
                onClick={() => setActiveClothingType('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeClothingType === 'all'
                    ? 'bg-neutral-950 text-white shadow-xs font-semibold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                All {activeCategory === 'all' ? 'Types' : 'in Category'}
              </button>

              {/* Specific Clothing Types for current category */}
              {availableClothingTypes.map((type, tIdx) => {
                const count = productsList.filter((p) => p.clothingType === type).length;
                const isSelected = activeClothingType === type;
                return (
                  <button
                    key={`type-pill-${type}-${tIdx}`}
                    onClick={() => setActiveClothingType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-neutral-950 text-white shadow-xs font-semibold'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    <span>{type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Search/Filter Pill Indicator */}
          {searchQuery && (
            <div className="mt-4 text-xs text-neutral-500 flex items-center gap-2">
              <span>
                Filtering by search: &ldquo;<strong className="text-neutral-800">{searchQuery}</strong>&rdquo;
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="pt-6 sm:pt-8">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-white rounded-2xl border border-neutral-200 p-8">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">No matching garments found</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Try selecting a different clothing type or clearing filters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveClothingType('all');
                    setShowWishlistOnly(false);
                    setFilterStockOnly(false);
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  View All Silhouettes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {filteredProducts.map((product, pIdx) => (
                  <ProductCard
                    key={product.id ? `${product.id}-${pIdx}` : `prod-card-${pIdx}`}
                    product={product}
                    currency={currency}
                    onQuickView={setQuickViewProduct}
                    onAddToCart={handleAddToCart}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Craftsmanship & Story Section */}
        <CraftsmanshipSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenProfile={() => handleOpenProfile('profile')}
        onOpenOrders={() => handleOpenProfile('orders')}
        onOpenAdmin={() => {
          if (canSeeAdminPortal) {
            setIsAdminPortalOpen(true);
          }
        }}
      />

      {/* Modals & Overlays */}
      <ProductQuickView
        product={quickViewProduct}
        currency={currency}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          if (!user) {
            setAuthModalCheckoutNotice(true);
            setIsAuthModalOpen(true);
          } else {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }
        }}
        appliedDiscount={appliedDiscount}
        onApplyPromoCode={handleApplyPromoCode}
        onRemovePromoCode={handleRemovePromoCode}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        subtotal={cartSubtotal}
        discount={cartDiscountAmount}
        onCompleteOrder={handleCompleteOrder}
        bankSettings={bankSettings}
      />

      {/* Customer Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalCheckoutNotice(false);
        }}
        onSuccess={() => {
          if (authModalCheckoutNotice) {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
            setAuthModalCheckoutNotice(false);
          } else {
            showToast('Signed in successfully with Firebase.');
            setIsProfileModalOpen(true);
          }
        }}
        checkoutNotice={authModalCheckoutNotice}
      />

      {/* Customer Orders & Purchases Standalone Modal */}
      <OrderHistoryModal
        isOpen={isOrderHistoryModalOpen}
        onClose={() => setIsOrderHistoryModalOpen(false)}
        currency={currency}
      />

      {/* Dedicated Customer Profile & Order History Hub */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currency={currency}
        initialTab={profileInitialTab}
        onExploreCatalog={() => {
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Moon Store Admin Management Portal */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        currency={currency}
        products={productsList}
        onUpdateProducts={handleUpdateProducts}
        promoCodes={promoCodes}
        onUpdatePromoCodes={setPromoCodes}
        announcementText={announcementText}
        onUpdateAnnouncement={handleUpdateAnnouncement}
        isBannerVisible={isBannerVisible}
        onToggleBannerVisibility={handleToggleBannerVisibility}
        bankSettings={bankSettings}
        onUpdateBankSettings={handleUpdateBankSettings}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        onAddSubcategory={handleAddSubcategory}
        onRemoveSubcategory={handleRemoveSubcategory}
        onUpdateCategories={handleUpdateCategories}
        heroSettings={heroSettings}
        onUpdateHeroSettings={handleUpdateHeroSettings}
      />

      {/* Mobile Floating Admin Shortcut for Store Owner & Staff */}
      {canSeeAdminPortal && (
        <button
          onClick={() => setIsAdminPortalOpen(true)}
          className="md:hidden fixed bottom-5 right-5 z-40 bg-neutral-950 text-amber-300 border border-amber-500/40 rounded-full px-3.5 py-2.5 shadow-2xl flex items-center gap-2 text-xs font-bold active:scale-95 transition-transform backdrop-blur-md cursor-pointer ring-2 ring-black/10"
          aria-label="Open Admin Portal"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {isOwner ? 'Owner Admin' : 'Admin Panel'}
          </span>
        </button>
      )}

      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-neutral-950 text-white text-xs font-medium rounded-full shadow-xl border border-neutral-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
