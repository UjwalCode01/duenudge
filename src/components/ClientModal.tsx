'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Building2, Mail, User, Clock, DollarSign, MapPin } from 'lucide-react';
import { Client, ClientInsert, ClientUpdate } from '@/types/database';
import { SUPPORTED_CURRENCIES } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (client: Client) => void;
  clientToEdit?: Client | null;
  userId?: string | null;
}

export function ClientModal({
  isOpen,
  onClose,
  onSaved,
  clientToEdit,
  userId,
}: ClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(14);
  const [address, setAddress] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setEmail(clientToEdit.email || '');
      setCompany(clientToEdit.company || '');
      setCurrency(clientToEdit.currency || 'USD');
      setDefaultPaymentTerms(clientToEdit.default_payment_terms || 14);
      setAddress(clientToEdit.address || '');
    } else {
      setName('');
      setEmail('');
      setCompany('');
      setCurrency('USD');
      setDefaultPaymentTerms(14);
      setAddress('');
    }
    setErrorMessage(null);
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Client name is required.');
      setSaving(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid client email address is required.');
      setSaving(false);
      return;
    }

    try {
      const supabaseConfigured = isSupabaseConfigured();

      if (!supabaseConfigured) {
        // Demo storage fallback
        const demoClient: Client = {
          id: clientToEdit?.id || `demo_client_${Date.now()}`,
          user_id: userId || 'demo_user',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || null,
          currency,
          default_payment_terms: Number(defaultPaymentTerms) || 14,
          address: address.trim() || null,
          created_at: clientToEdit?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const existingStr = localStorage.getItem('duenudge_demo_clients') || '[]';
        let clientsList: Client[] = JSON.parse(existingStr);
        if (clientToEdit) {
          clientsList = clientsList.map((c) => (c.id === clientToEdit.id ? demoClient : c));
        } else {
          clientsList.unshift(demoClient);
        }
        localStorage.setItem('duenudge_demo_clients', JSON.stringify(clientsList));

        onSaved(demoClient);
        onClose();
        return;
      }

      const supabase = createClient();

      if (clientToEdit) {
        const payload: ClientUpdate = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || null,
          currency,
          default_payment_terms: Number(defaultPaymentTerms) || 14,
          address: address.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', clientToEdit.id)
          .select()
          .single();

        if (error) throw error;
        onSaved(data);
      } else {
        if (!userId) throw new Error('User session not found.');

        const payload: ClientInsert = {
          user_id: userId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || null,
          currency,
          default_payment_terms: Number(defaultPaymentTerms) || 14,
          address: address.trim() || null,
        };

        const { data, error } = await supabase
          .from('clients')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        onSaved(data);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save client';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {clientToEdit ? 'Edit Client Details' : 'Add New Client'}
              </h3>
              <p className="text-xs text-slate-500">
                {clientToEdit ? 'Update client billing terms and contact info' : 'Add a client to assign invoices and late-reminders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-6 mb-0 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@acmecorp.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Company */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corporation Ltd."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Default Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Terms (Days)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(parseInt(e.target.value) || 14)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Due in {defaultPaymentTerms} days (Net {defaultPaymentTerms})
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Address (For Invoice Header)
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, Suite, City, State, Country"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Saving Client...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>{clientToEdit ? 'Update Client' : 'Add Client'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
