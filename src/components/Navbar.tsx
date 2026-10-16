import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, ChevronDown, Sparkles, User as UserIcon, LogOut, Package, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Currency, CategoryGroup } from '../types';
import { CATEGORIES_CONFIG } from '../data/products';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  onOpenProfile: (tab?: 'profile' | 'orders') => void;
  onOpenAdmin: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  activeClothingType: string;
  onSelectClothingType: (clothingType: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currency: Currency;
  onToggleCurrency: (newCurr: Currency) => void;
  categories?: CategoryGroup[];
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenOrders,
  onOpenProfile,
  onOpenAdmin,
  activeCategory,
  onSelectCategory,
  activeClothingType,
  onSelectClothingType,
  searchQuery,
  onSearchChange,
  currency,
  onToggleCurrency,
  categories,
}) => {
  const categoryList = categories && categories.length > 0 ? categories : CATEGORIES_CONFIG;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, userProfile, signOutUser, canSeeAdminPortal, isOwner, isManagement } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (id: string) => {
    if (id === 'story') {
      const element = document.getElementById('story-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onSelectCategory(id);
      onSelectClothingType('all');
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
    setIsCategoriesDropdownOpen(false);
  };

  const handleClothingTypeClick = (catId: string, clothingType: string) => {
    onSelectCategory(catId);
    onSelectClothingType(clothingType);
    setIsCategoriesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-neutral-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 h-16 sm:h-20">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => handleNavClick('all')}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded p-1 cursor-pointer"
              aria-label="Moon - Keep it stylish Home"
            >
              <BrandLogo size="sm" showTagline={true} />
            </button>
          </div>

          {/* Zone 2: Clean Nav Links for Tablets and Desktops */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
            <button
              onClick={() => handleNavClick('all')}
              className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeCategory === 'all' && activeClothingType === 'all'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              All Pieces
              {activeCategory === 'all' && activeClothingType === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-900 animate-in fade-in duration-200" />
              )}
            </button>

            {/* CATEGORIES HOVER/CLICK MENU SHOWING CLOTHING TYPES */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
                className={`py-1.5 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeClothingType !== 'all' || (activeCategory !== 'all' && isCategoriesDropdownOpen)
                    ? 'text-neutral-950 font-bold'
                    : 'text-neutral-700 hover:text-neutral-950'
                }`}
              >
                <span>Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Flyout Dropdown showing Clothing Types by Category */}
              {isCategoriesDropdownOpen && (
                <div
                  onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 grid grid-cols-2 gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {categoryList.map((group, gIdx) => (
                    <div key={`nav-group-${group.id}-${gIdx}`} className="space-y-1.5">
                      <button
                        onClick={() => handleNavClick(group.id)}
                        className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-700 text-left block w-full pb-1 border-b border-neutral-100 cursor-pointer"
                      >
                        {group.label}
                      </button>
                      <ul className="space-y-1 text-xs">
                        {Array.from(new Set(group.clothingTypes || [])).map((type, tIdx) => (
                          <li key={`nav-type-${group.id}-${type}-${tIdx}`}>
                            <button
                              onClick={() => handleClothingTypeClick(group.id, type)}
                              className={`w-full text-left py-1 px-1.5 rounded transition-colors text-[11px] cursor-pointer ${
                                activeClothingType === type
                                  ? 'bg-neutral-950 text-white font-medium'
                                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                              }`}
                            >
                              {type}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="col-span-2 pt-2 border-t border-neutral-100 text-center">
                    <button
                      onClick={() => handleNavClick('all')}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 font-medium underline cursor-pointer"
                    >
                      Browse Complete Catalog
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavClick('story')}
              className="py-1.5 whitespace-nowrap shrink-0 text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
            >
              Story
            </button>
          </nav>

          {/* Zone 3: Currency Switcher & Shopping Bag & Mobile Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Currency Selector (LKR / USD) */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200/90 text-[11px] sm:text-xs">
              <button
                onClick={() => onToggleCurrency('LKR')}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                  currency === 'LKR'
                    ? 'bg-white text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Sri Lankan Rupee (Default)"
              >
                <span className="mr-0.5 sm:mr-1">🇱🇰</span><span className="text-[10px] sm:text-xs">LKR</span>
              </button>
              <button
                onClick={() => onToggleCurrency('USD')}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                  currency === 'USD'
                    ? 'bg-white text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="US Dollar"
              >
                <span className="mr-0.5 sm:mr-1">🇺🇸</span><span className="text-[10px] sm:text-xs">USD</span>
              </button>
            </div>

            {/* Desktop Inline search */}
            <div className="hidden sm:flex relative items-center">
              {isSearchOpen ? (
                <div className="flex items-center border border-neutral-300 rounded-full px-3 py-1 bg-white shadow-xs animate-in fade-in duration-150">
                  <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search silhouettes..."
                    autoFocus
                    className="w-32 sm:w-44 text-xs bg-transparent focus:outline-none text-neutral-800 placeholder-neutral-400"
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSearchChange('');
                    }}
                    className="text-neutral-400 hover:text-neutral-700 ml-1 p-0.5 cursor-pointer"
                    aria-label="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors rounded-full hover:bg-neutral-100/80 cursor-pointer"
                  aria-label="Open search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile search icon trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-1.5 text-neutral-700 hover:text-neutral-950 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Search clothing"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Account / Sign In Trigger */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-300/80 rounded-full hover:border-neutral-900 transition-all shadow-xs cursor-pointer"
                  aria-label="User account menu"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate text-left font-semibold">
                    {userProfile?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-2 border-b border-neutral-100 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {userProfile?.displayName || user.displayName || 'Customer'}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate font-mono">
                          {user.email}
                        </p>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isOwner
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : isManagement
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {isOwner ? 'Owner' : isManagement ? 'Management' : 'Customer'}
                      </span>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenProfile('profile');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer font-medium"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Customer Profile & Address</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenProfile('orders');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer font-medium"
                      >
                        <Package className="w-3.5 h-3.5 text-neutral-600" />
                        <span>My Orders & Purchases</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-neutral-100 space-y-0.5">
                      {/* ONLY show Admin Portal if user is Management or Owner */}
                      {canSeeAdminPortal && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100/80 rounded-xl transition-colors cursor-pointer font-bold"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>Store Admin Portal</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-200/80 text-amber-950 rounded uppercase font-mono">
                            {isOwner ? 'Owner' : 'Manage'}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await signOutUser();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300/80 rounded-full hover:bg-neutral-950 hover:text-white transition-all shadow-xs cursor-pointer"
                aria-label="Sign In or Register"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Direct Mobile Admin Portal Button for Owner & Staff */}
            {canSeeAdminPortal && (
              <button
                onClick={onOpenAdmin}
                className="md:hidden flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full transition-colors cursor-pointer shadow-xs shrink-0"
                aria-label="Open Store Admin Portal"
                title="Open Store Admin Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px] tracking-wider uppercase font-mono font-bold">Admin</span>
              </button>
            )}

            {/* Shopping Bag Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-300/80 rounded-full hover:bg-neutral-950 hover:text-white transition-all shadow-xs group cursor-pointer"
              aria-label={`Shopping Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform group-hover:scale-105" />
              <span className="hidden sm:inline tracking-wider font-semibold">BAG</span>
              {cartCount > 0 ? (
                <span className="font-mono tabular-nums text-[11px] sm:text-xs font-semibold px-1.5 py-0.2 bg-neutral-950 group-hover:bg-white text-white group-hover:text-neutral-950 rounded-full min-w-[18px] text-center">
                  {cartCount}
                </span>
              ) : (
                <span className="font-mono tabular-nums text-[11px] sm:text-xs font-normal px-1 py-0.2 text-neutral-400 group-hover:text-neutral-300">
                  0
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Full-Width Search Overlay Bar when search is opened on mobile */}
        {isSearchOpen && (
          <div className="sm:hidden absolute inset-x-0 top-0 h-16 bg-[#FAF9F6] border-b border-neutral-300 z-50 flex items-center px-4 gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search garments, fabrics, styles..."
              autoFocus
              className="flex-1 text-sm bg-transparent focus:outline-none text-neutral-900 placeholder-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-xs text-neutral-400 hover:text-neutral-700 px-1 font-mono"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              className="p-1.5 text-neutral-600 hover:text-neutral-950 rounded-md hover:bg-neutral-200/60 cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-[#FAF9F6] px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="pb-3 border-b border-neutral-200 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Store Currency:</span>
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200 text-xs">
              <button
                onClick={() => onToggleCurrency('LKR')}
                className={`px-3 py-1 rounded-full font-medium ${
                  currency === 'LKR' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-600'
                }`}
              >
                🇱🇰 LKR
              </button>
              <button
                onClick={() => onToggleCurrency('USD')}
                className={`px-3 py-1 rounded-full font-medium ${
                  currency === 'USD' ? 'bg-white text-neutral-950 font-bold shadow-xs' : 'text-neutral-600'
                }`}
              >
                🇺🇸 USD
              </button>
            </div>
          </div>

          <button
            onClick={() => handleNavClick('all')}
            className="block w-full text-left py-1 text-sm font-bold text-neutral-900 cursor-pointer"
          >
            All Pieces
          </button>

          {/* Mobile Category & Clothing Types Accordion */}
          <div className="space-y-3 pt-1 border-t border-neutral-200">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Categories & Clothing Types
            </p>
            {categoryList.map((group, gIdx) => (
              <div key={`mob-group-${group.id}-${gIdx}`} className="pl-2 space-y-1">
                <button
                  onClick={() => handleNavClick(group.id)}
                  className="text-xs font-bold text-neutral-900 block w-full text-left py-0.5 cursor-pointer"
                >
                  {group.label}
                </button>
                <div className="flex flex-wrap gap-1.5 pl-2">
                  {Array.from(new Set(group.clothingTypes || [])).map((type, tIdx) => (
                    <button
                      key={`mob-type-${group.id}-${type}-${tIdx}`}
                      onClick={() => handleClothingTypeClick(group.id, type)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border ${
                        activeClothingType === type
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-200 space-y-2.5">
            {/* User Account / Sign In section for mobile drawer */}
            {user ? (
              <div className="p-3 bg-neutral-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left leading-tight truncate">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {userProfile?.displayName || user.displayName || 'Customer'}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenProfile('profile');
                    }}
                    className="py-1.5 px-2 bg-white text-neutral-900 rounded-lg text-[11px] font-semibold border border-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenProfile('orders');
                    }}
                    className="py-1.5 px-2 bg-white text-neutral-900 rounded-lg text-[11px] font-semibold border border-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>My Orders</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-neutral-200/60 space-y-1.5">
                  {canSeeAdminPortal && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full py-1.5 px-2 bg-amber-50 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Store Admin Portal</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded uppercase font-mono">
                        {isOwner ? 'Owner' : 'Manage'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await signOutUser();
                    }}
                    className="w-full py-1.5 px-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 bg-white border border-neutral-300 text-neutral-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full py-2.5 px-4 bg-neutral-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer shadow-2xs hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Store Admin Panel</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-400/20 text-amber-200 rounded font-mono font-normal">
                    Owner & Staff
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => handleNavClick('story')}
              className="block w-full text-left py-1 text-sm font-medium text-neutral-800 cursor-pointer"
            >
              The Moon Story
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCart();
              }}
              className="w-full py-2.5 px-4 bg-neutral-950 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{cartCount > 0 ? `Review Bag (${cartCount} ${cartCount === 1 ? 'item' : 'items'})` : 'Shopping Bag (0)'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
