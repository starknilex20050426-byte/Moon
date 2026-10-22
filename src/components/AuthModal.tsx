import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, Phone, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Copy, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  checkoutNotice?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  checkoutNotice = false,
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const formatFirebaseError = (err: any) => {
    const code = err?.code || '';
    if (code.includes('unauthorized-domain')) {
      setIsUnauthorizedDomain(true);
      return 'Google Sign-In is not yet authorized for this domain. You can create an account or sign in directly with Email & Password below!';
    }
    setIsUnauthorizedDomain(false);
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Incorrect email or password. Please verify and try again.';
    }
    if (code.includes('email-already-in-use')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (code.includes('weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (code.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code.includes('popup-closed-by-user')) {
      return 'Google sign-in popup was closed.';
    }
    return err?.message || 'Authentication failed. Please check your credentials.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !name) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        setSuccessMsg('Welcome back!');
      } else {
        await signUpWithEmail(name, email, password, phone);
        setSuccessMsg('Account created successfully!');
      }

      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(formatFirebaseError(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(formatFirebaseError(err));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
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
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 sm:p-8 sm:pb-4 text-center">
              <span className="font-['Alex_Brush'] text-3xl sm:text-4xl text-neutral-900 block leading-tight">
                Moon
              </span>
              <p className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 mt-1">
                Keep it stylish · Customer Portal
              </p>

              {checkoutNotice && (
                <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-left flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Sign in required to checkout</span>
                    <span className="text-[11px] text-amber-800">
                      Sign in or create an account to save your delivery address and track your purchases.
                    </span>
                  </div>
                </div>
              )}

              {/* Mode Tabs */}
              <div className="mt-5 grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setIsUnauthorizedDomain(false);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setIsUnauthorizedDomain(false);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              {isUnauthorizedDomain ? (
                <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-left space-y-2.5 text-xs text-amber-950 animate-in fade-in">
                  <div className="flex items-start gap-2 font-semibold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Google Sign-In Needs Domain Authorization</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Google popup sign-in requires this domain (<code>{typeof window !== 'undefined' ? window.location.hostname : 'your domain'}</code>) to be whitelisted in Firebase Console.
                  </p>

                  <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 space-y-1 text-[11px]">
                    <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Instant Solution: Use Email &amp; Password Below</span>
                    </div>
                    <p className="text-neutral-600">
                      Email and password accounts work immediately on all domains with zero setup. Simply fill in your details below and click {mode === 'signin' ? 'Sign In' : 'Create Account'}.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                    <span className="text-[10px] text-neutral-600 font-mono truncate">
                      Domain: {typeof window !== 'undefined' ? window.location.hostname : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                    </button>
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Social Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 mb-4 bg-white border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kasun Perera"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Phone Number (for Courier updates)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="077 123 4567"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Must be at least 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In to Moon' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-neutral-500">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-neutral-900 hover:underline cursor-pointer"
                  >
                    {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
