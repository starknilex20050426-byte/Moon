import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import {
  X,
  Mail,
  Send,
  Printer,
  Copy,
  Check,
  Smartphone,
  Monitor,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  initialHtml?: string;
  initialSubject?: string;
  recipient?: string;
  onResendSuccess?: (msg: string) => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  initialHtml,
  initialSubject,
  recipient,
  onResendSuccess,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [htmlContent, setHtmlContent] = useState<string>(initialHtml || '');
  const [subject, setSubject] = useState<string>(initialSubject || '');
  const [emailRecipient, setEmailRecipient] = useState<string>(recipient || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialHtml) {
      setHtmlContent(initialHtml);
      setSubject(initialSubject || `Order Confirmation - #${orderId || ''}`);
      setEmailRecipient(recipient || '');
      return;
    }

    if (orderId) {
      setIsLoading(true);
      apiFetch(`/api/orders/${encodeURIComponent(orderId)}/email-preview`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHtmlContent(data.html);
            setSubject(data.subject);
            if (data.recipient) setEmailRecipient(data.recipient);
          } else {
            setHtmlContent(
              `<div style="padding: 40px; text-align: center; font-family: sans-serif; color: #666;">
                <h3>Email preview not available</h3>
                <p>${data.message || 'Could not load order email.'}</p>
              </div>`
            );
          }
        })
        .catch((err) => {
          console.error('Failed to load email preview:', err);
          setHtmlContent(
            `<div style="padding: 40px; text-align: center; font-family: sans-serif; color: #666;">
              <h3>Unable to load email preview</h3>
            </div>`
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, orderId, initialHtml, initialSubject, recipient]);

  const handleResend = async () => {
    if (!orderId && !emailRecipient) return;
    setIsResending(true);
    setResendStatus(null);

    try {
      const endpoint = orderId
        ? `/api/orders/${encodeURIComponent(orderId)}/send-email`
        : '/api/settings/test-email';

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRecipient: emailRecipient, targetEmail: emailRecipient }),
      });
      const data = await res.json();

      if (data.success) {
        setResendStatus('Dispatched successfully!');
        if (onResendSuccess) {
          onResendSuccess(`Order confirmation email sent to ${emailRecipient}`);
        }
        setTimeout(() => setResendStatus(null), 4000);
      } else {
        setResendStatus(data.message || 'Dispatch failed');
      }
    } catch {
      setResendStatus('Network error while sending');
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyHtml = () => {
    if (!htmlContent) return;
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="email-preview-modal-overlay" className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="email-preview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh]"
        >
          {/* Top Bar */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Luxury Order Confirmation Email
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Auto-Dispatched
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  High-end responsive email layout delivered directly to customer inbox
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Responsive Device Switcher */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'desktop'
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Desktop View (Wide)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'mobile'
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Email Envelope Metadata Bar */}
          <div className="px-4 py-2.5 bg-neutral-950/70 border-b border-neutral-800/80 text-xs text-neutral-300 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-sans">To:</span>
              <span className="text-amber-300 font-bold">{emailRecipient || 'customer@client.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-sans">Subject:</span>
              <span className="text-white font-medium truncate max-w-xs sm:max-w-md">{subject || 'Order Confirmed - MOON APPAREL'}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="font-sans">From:</span>
              <span>MOON APPAREL ATELIER &lt;orders@moon-clothing.com&gt;</span>
            </div>
          </div>

          {/* Main Email Preview Container */}
          <div className="flex-1 bg-neutral-950 p-3 sm:p-6 overflow-y-auto flex justify-center items-start min-h-[420px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <RefreshCw className="w-8 h-8 text-neutral-500 animate-spin" />
                <p className="text-xs text-neutral-400 font-mono">Rendering email template...</p>
              </div>
            ) : (
              <div
                className={`transition-all duration-300 mx-auto shadow-2xl rounded-2xl overflow-hidden border border-neutral-800 bg-[#f7f5f0] ${
                  viewMode === 'mobile' ? 'w-[375px] max-w-full' : 'w-full max-w-[640px]'
                }`}
              >
                <iframe
                  title="Order Confirmation Email Preview"
                  srcDoc={htmlContent}
                  className="w-full border-0 block"
                  style={{ height: '580px' }}
                  sandbox="allow-same-origin allow-popups"
                />
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs">
              {resendStatus && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  {resendStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy raw HTML email code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
              </button>

              {(orderId || emailRecipient) && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isResending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
