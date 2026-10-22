import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenOrders, onOpenProfile, onOpenAdmin }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { canSeeAdminPortal, isOwner } = useAuth();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-neutral-800">
          
          {/* Brand lockup */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <BrandLogo size="md" variant="light" showTagline={true} />
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Moon delivers architectural silhouettes, heavyweight unwashed organic textiles, and timeless modern cuts. Kept strictly stylish.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-500 font-mono">
              <span>Atelier Colombo, Lisbon & Tokyo</span>
              <span>·</span>
              <span>Island-wide Sri Lanka & Global Courier</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-4 sm:gap-6 text-xs">
            <div>
              <p className="font-semibold text-white tracking-wider uppercase mb-3 text-[11px]">
                Collection
              </p>
              <ul className="space-y-2.5 text-neutral-400">
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Outerwear</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Heavyweight Tops</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Tailored Trousers</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Knitwear</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Japanese Denim</a></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white tracking-wider uppercase mb-3 text-[11px]">
                Client Service
              </p>
              <ul className="space-y-2.5 text-neutral-400">
                <li>
                  <button
                    onClick={onOpenProfile}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Customer Profile & Address
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenOrders}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Order Tracking & Buyings
                  </button>
                </li>
                {canSeeAdminPortal && (
                  <li>
                    <button
                      onClick={onOpenAdmin}
                      className="text-amber-400 hover:text-amber-300 font-medium transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Store Admin Portal</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-mono">
                        {isOwner ? 'Owner' : 'Staff'}
                      </span>
                    </button>
                  </li>
                )}
                <li><span className="hover:text-white transition-colors cursor-pointer">Sizing Guide</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Complimentary Returns</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Textile Care</span></li>
              </ul>
            </div>
          </div>

          {/* Newsletter subscription */}
          <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">
            <p className="font-semibold text-white tracking-wider uppercase text-[11px]">
              The Dispatch
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Private access to seasonal drops, fabric restocks, and architectural editions. No clutter.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You have been added to the Moon VIP Dispatch.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col xs:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  aria-label="Subscribe to dispatch"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-neutral-500">
              <span>Bank Deposit Slip Verification</span>
              <span>·</span>
              <span>Island-wide Cash on Delivery</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Moon - Keep it stylish. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-4 text-[11px]">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-neutral-400 cursor-pointer">Payment Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
