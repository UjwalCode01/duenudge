'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  MapPin,
  Clock,
  Trash2,
  Eye,
  Mail,
  Send,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BusinessProfile } from '@/types/database';
import { SUPPORTED_CURRENCIES, COMMON_TIMEZONES, isSupabaseConfigured } from '@/lib/utils';

interface BusinessProfileFormProps {
  initialProfile?: BusinessProfile | null;
  userId?: string | null;
  userEmail?: string | null;
  isDemo?: boolean;
}

export function BusinessProfileForm({
  initialProfile,
  userId,
  userEmail,
  isDemo = false,
}: BusinessProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [businessName, setBusinessName] = useState(
    initialProfile?.business_name || (isDemo ? 'Nexus Design & Development' : '')
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    initialProfile?.logo_url || ''
  );
  const [address, setAddress] = useState(
    initialProfile?.address ||
      (isDemo ? '123 Innovation Way, Suite 400\nSan Francisco, CA 94107' : '')
  );
  const [currency, setCurrency] = useState(initialProfile?.currency || 'USD');
  const [defaultDueDays, setDefaultDueDays] = useState<number>(
    initialProfile?.default_due_days || 14
  );
  const [invoicePrefix, setInvoicePrefix] = useState(
    initialProfile?.invoice_prefix || 'INV-'
  );
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone ||
      (typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        : 'UTC')
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialProfile?.payment_instructions ||
      (isDemo
        ? 'Bank: Silicon Valley Bank\nRouting: 121000358\nAccount: 9876543210\nOr PayPal: https://paypal.me/nexusdev'
        : '')
  );

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form Status State
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Preview Card Tab
  const [previewTab, setPreviewTab] = useState<'invoice' | 'reminder'>('invoice');

  const supabaseConfigured = isSupabaseConfigured();

  // Load from LocalStorage if in demo mode or unconfigured
  useEffect(() => {
    if ((!supabaseConfigured || isDemo) && typeof window !== 'undefined') {
      const saved = localStorage.getItem('duenudge_demo_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.business_name) setBusinessName(parsed.business_name);
          if (parsed.logo_url) setLogoUrl(parsed.logo_url);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.default_due_days) setDefaultDueDays(parsed.default_due_days);
          if (parsed.invoice_prefix) setInvoicePrefix(parsed.invoice_prefix);
          if (parsed.timezone) setTimezone(parsed.timezone);
          if (parsed.payment_instructions) setPaymentInstructions(parsed.payment_instructions);
        } catch (e) {
          console.error('Error parsing local demo profile', e);
        }
      }
    }
  }, [supabaseConfigured, isDemo]);

  // Handle Logo File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewLogoUrl(objectUrl);
    setIsDirty(true);
    setErrorMessage(null);
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setPreviewLogoUrl(null);
    setLogoUrl('');
    setIsDirty(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload logo to Supabase storage or convert to base64
  const processLogoUpload = async (): Promise<string | null> => {
    if (!selectedFile) return logoUrl;

    setIsUploadingLogo(true);
    try {
      if (!supabaseConfigured || isDemo) {
        // Fallback: Read as Data URL
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setLogoUrl(result);
            resolve(result);
          };
          reader.readAsDataURL(selectedFile);
        });
      }

      const supabase = createClient();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId || 'user'}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw new Error(`Logo upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('business-logos')
        .getPublicUrl(uploadData.path);

      return publicUrlData.publicUrl;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Quick Payment Instruction Templates
  const applyPaymentTemplate = (type: 'bank' | 'paypal' | 'stripe') => {
    let template = '';
    if (type === 'bank') {
      template = `Bank Name: JPMorgan Chase\nAccount Name: ${businessName || 'Freelancer'}\nAccount Number: 123456789\nRouting / SWIFT: 021000021\nReference: Invoice #[Invoice Number]`;
    } else if (type === 'paypal') {
      template = `Pay via PayPal: https://paypal.me/yourusername\nOr via Venmo: @yourhandle\nPlease include the invoice number in the payment note.`;
    } else if (type === 'stripe') {
      template = `Direct Card / Stripe Payment Link: https://buy.stripe.com/your-payment-link\nAccepted: Visa, MasterCard, Amex, Apple Pay, Google Pay.`;
    }
    setPaymentInstructions(template);
    setIsDirty(true);
  };

  // Save Settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const finalLogoUrl = await processLogoUpload();

      const profilePayload = {
        business_name: businessName.trim(),
        logo_url: finalLogoUrl,
        address: address.trim(),
        currency,
        default_due_days: Number(defaultDueDays) || 14,
        invoice_prefix: invoicePrefix.trim() || 'INV-',
        timezone,
        payment_instructions: paymentInstructions.trim(),
        updated_at: new Date().toISOString(),
      };

      if (!supabaseConfigured || isDemo) {
        // Save to LocalStorage in demo / unconfigured mode
        localStorage.setItem('duenudge_demo_profile', JSON.stringify(profilePayload));
        setLogoUrl(finalLogoUrl || '');
        setSaveSuccess(true);
        setIsDirty(false);
        setTimeout(() => setSaveSuccess(false), 3500);
        return;
      }

      const supabase = createClient();

      if (!userId) {
        throw new Error('User session not found. Please log in again.');
      }

      // Upsert into business_profiles
      const { error: upsertError } = await supabase
        .from('business_profiles')
        .upsert(
          {
            user_id: userId,
            ...profilePayload,
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) {
        throw upsertError;
      }

      setLogoUrl(finalLogoUrl || '');
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 3500);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save business profile';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const activeLogo = previewLogoUrl || logoUrl;
  const currencySymbol =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Phase 1
            </span>
            {isDemo && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Demo Mode Active
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
            Business Profile & Invoicing Defaults
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure your business branding, default payment terms, and client payment details.
          </p>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center space-x-3">
          {isDirty && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || isUploadingLogo}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving || isUploadingLogo ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3 transition-all animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 font-medium">
            Business profile successfully saved! Your invoice templates and late-reminder configurations have been updated.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3 transition-all">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Error saving profile:</span>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 space-y-6"
          onChange={() => setIsDirty(true)}
        >
          {/* Card 1: Business Identity & Logo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Business Identity & Branding</h2>
                <p className="text-xs text-slate-500">Your brand name and logo will appear on all invoices and emails.</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Business Name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Business / Freelancer Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Apex Creative Studio"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Business Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Logo Preview Box */}
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                    {activeLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeLogo}
                        alt="Business Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium leading-tight">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload-input"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="logo-upload-input"
                        className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        {activeLogo ? 'Change Logo' : 'Upload Logo'}
                      </label>

                      {activeLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Recommended: Transparent PNG, SVG, or JPG under 5MB. Rendered in high-res on client invoices.
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Business Address / Tax Location
                </label>
                <div className="relative">
                  <textarea
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Street Address, Suite / Floor&#10;City, State / Province, Postal Code&#10;Country"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Invoicing Terms & Defaults */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Invoicing Defaults</h2>
                <p className="text-xs text-slate-500">Set standard currency, due dates, and invoice numbering format.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Default Currency */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Default Currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    {SUPPORTED_CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.name} ({cur.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoice Prefix */}
              <div>
                <label
                  htmlFor="invoicePrefix"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Invoice Prefix
                </label>
                <div className="relative">
                  <input
                    id="invoicePrefix"
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => {
                      setInvoicePrefix(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="INV-"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Sample next invoice:</span>
                    <span className="font-mono font-semibold text-indigo-600">
                      {invoicePrefix}0001
                    </span>
                  </div>
                </div>
              </div>

              {/* Default Due Days */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="defaultDueDays"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Default Payment Due Days
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {[7, 14, 21, 30, 45, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setDefaultDueDays(days);
                          setIsDirty(true);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          defaultDueDays === days
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <input
                      id="defaultDueDays"
                      type="number"
                      min={1}
                      max={365}
                      value={defaultDueDays}
                      onChange={(e) => {
                        setDefaultDueDays(parseInt(e.target.value) || 14);
                        setIsDirty(true);
                      }}
                      className="w-28 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                    <span className="text-xs text-slate-500">
                      Invoices will be marked due {defaultDueDays} days after being issued.
                    </span>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="timezone"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Business Timezone (For Reminder Timing)
                </label>
                <div className="relative">
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Late reminder emails will fire at 09:00 AM according to this timezone.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Payment Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment Instructions</h2>
                  <p className="text-xs text-slate-500">How your clients can pay you (Wire, PayPal, Stripe, etc.)</p>
                </div>
              </div>

              {/* Template shortcuts */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Insert template:</span>
                <button
                  type="button"
                  onClick={() => applyPaymentTemplate('bank')}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  + Bank Wire
                </button>
                <button
                  type="button"
                  onClick={() => applyPaymentTemplate('paypal')}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  + PayPal
                </button>
                <button
                  type="button"
                  onClick={() => applyPaymentTemplate('stripe')}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  + Stripe Link
                </button>
              </div>
            </div>

            <div className="mt-5">
              <textarea
                id="paymentInstructions"
                rows={5}
                value={paymentInstructions}
                onChange={(e) => {
                  setPaymentInstructions(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Bank Name: Example Bank&#10;Account Holder: Your Name&#10;Account / IBAN: 0000 1111 2222&#10;SWIFT / BIC: EXAMPXXX&#10;Or PayPal: https://paypal.me/yourusername"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                These instructions are embedded directly at the bottom of your invoices and in automated reminder emails.
              </p>
            </div>
          </div>
        </form>

        {/* Right Column: Live Interactive Client Preview */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            {/* Preview Navigation Tabs */}
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Live Client Preview
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('invoice')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    previewTab === 'invoice'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Invoice Header
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('reminder')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    previewTab === 'reminder'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Email Reminder
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6">
              {previewTab === 'invoice' ? (
                /* INVOICE PREVIEW */
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                    <div>
                      {activeLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activeLogo}
                          alt="Logo Preview"
                          className="h-10 w-auto object-contain mb-2"
                        />
                      ) : (
                        <div className="h-10 w-24 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-semibold mb-2">
                          [Your Logo]
                        </div>
                      )}
                      <h3 className="font-bold text-slate-900 text-base">
                        {businessName || 'Your Business Name'}
                      </h3>
                      <p className="text-xs text-slate-500 whitespace-pre-line mt-0.5">
                        {address || '123 Freelancer Lane, City, Country'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold uppercase text-indigo-600 tracking-wider">
                        Invoice
                      </span>
                      <p className="font-mono text-sm font-bold text-slate-800">
                        {invoicePrefix}0001
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1">
                        <div>Issued: Today</div>
                        <div>
                          Due in: <strong className="text-slate-800">{defaultDueDays} days</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Line Items */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700 pb-2 border-b border-slate-200">
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    <div className="flex justify-between py-2 text-slate-600 border-b border-slate-100">
                      <span>Brand Identity & UI Design Services</span>
                      <span className="font-mono">{currencySymbol} 2,400.00</span>
                    </div>
                    <div className="flex justify-between pt-2.5 font-bold text-slate-900 text-sm">
                      <span>Total Due</span>
                      <span className="text-indigo-600 font-mono">
                        {currencySymbol} 2,400.00 {currency}
                      </span>
                    </div>
                  </div>

                  {/* Payment Instructions in Preview */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center">
                      <CreditCard className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      Payment Instructions
                    </h4>
                    <p className="text-xs text-indigo-950 font-mono whitespace-pre-line">
                      {paymentInstructions || 'No payment instructions provided yet.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* AUTOMATED REMINDER EMAIL PREVIEW */
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center text-slate-500">
                      <span className="w-14 font-semibold">From:</span>
                      <span className="text-slate-800">
                        {businessName || 'Your Business'} &lt;reminders@duenudge.app&gt;
                      </span>
                    </div>
                    <div className="flex items-center text-slate-500">
                      <span className="w-14 font-semibold">Subject:</span>
                      <span className="text-slate-800 font-semibold">
                        Friendly reminder: Invoice {invoicePrefix}0001 is due in 3 days
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 space-y-3 leading-relaxed">
                    <p>Hi John,</p>
                    <p>
                      Hope you&apos;re having a productive week! This is a polite automated reminder that invoice{' '}
                      <strong>{invoicePrefix}0001</strong> for{' '}
                      <strong>
                        {currencySymbol} 2,400.00 {currency}
                      </strong>{' '}
                      is due on schedule.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] whitespace-pre-line">
                      {paymentInstructions || 'Payment details will appear here.'}
                    </div>
                    <p>
                      If you&apos;ve already processed this payment, please disregard this note. Thanks for your business!
                    </p>
                    <p className="pt-1 font-semibold text-slate-900">
                      — {businessName || 'Your Name / Studio'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      DueNudge schedules these reminders automatically based on your{' '}
                      <strong>{defaultDueDays}-day</strong> payment terms.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom hint */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Timezone: {timezone}</span>
              <span className="font-semibold text-indigo-600">Phase 1 Real-Time Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
