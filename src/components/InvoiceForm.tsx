'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  CreditCard,
  Percent,
  Sparkles,
} from 'lucide-react';
import {
  Client,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  BusinessProfile,
  InvoiceInsert,
  InvoiceItemInsert,
} from '@/types/database';
import { ClientModal } from '@/components/ClientModal';
import {
  formatCurrency,
  getTodayDateString,
  calculateDueDate,
  SUPPORTED_CURRENCIES,
  isSupabaseConfigured,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface LineItemState {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  initialClients?: Client[];
  initialProfile?: BusinessProfile | null;
  invoiceToEdit?: Invoice | null;
  initialItems?: InvoiceItem[];
  userId?: string | null;
}

export function InvoiceForm({
  initialClients = [],
  initialProfile,
  invoiceToEdit,
  initialItems = [],
  userId,
}: InvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams?.get('clientId');

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    invoiceToEdit?.client_id || preselectedClientId || ''
  );

  // Invoice Fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    invoiceToEdit?.invoice_number ||
      `${initialProfile?.invoice_prefix || 'INV-'}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [issueDate, setIssueDate] = useState<string>(
    invoiceToEdit?.issue_date || getTodayDateString()
  );
  const [dueDate, setDueDate] = useState<string>(
    invoiceToEdit?.due_date ||
      calculateDueDate(getTodayDateString(), initialProfile?.default_due_days || 14)
  );
  const [currency, setCurrency] = useState<string>(
    invoiceToEdit?.currency || initialProfile?.currency || 'USD'
  );
  const [status, setStatus] = useState<InvoiceStatus>(
    invoiceToEdit?.status || 'draft'
  );
  const [taxPercentage, setTaxPercentage] = useState<number>(
    invoiceToEdit?.tax_percentage || 0
  );
  const [notes, setNotes] = useState<string>(
    invoiceToEdit?.notes || 'Thank you for your business! Payment is due within agreed terms.'
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    invoiceToEdit?.payment_instructions || initialProfile?.payment_instructions || ''
  );

  // Line items
  const [lineItems, setLineItems] = useState<LineItemState[]>(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        }))
      : [
          {
            description: 'Brand Identity & Web Design',
            quantity: 1,
            rate: 1500,
            amount: 1500,
          },
        ]
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();

  // Load clients from localStorage in demo mode if empty
  useEffect(() => {
    if (!supabaseConfigured && clients.length === 0 && typeof window !== 'undefined') {
      const stored = localStorage.getItem('duenudge_demo_clients');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setClients(parsed);
          if (preselectedClientId && !selectedClientId) {
            setSelectedClientId(preselectedClientId);
          } else if (parsed.length > 0 && !selectedClientId) {
            setSelectedClientId(parsed[0].id);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [supabaseConfigured, clients.length, preselectedClientId, selectedClientId]);

  // When client changes, auto-set currency and auto-calculate due date
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      if (client.currency) {
        setCurrency(client.currency);
      }
      const terms = client.default_payment_terms || initialProfile?.default_due_days || 14;
      setDueDate(calculateDueDate(issueDate, terms));
    }
  };

  // When issue date changes, update due date based on client terms
  const handleIssueDateChange = (newIssueDate: string) => {
    setIssueDate(newIssueDate);
    const client = clients.find((c) => c.id === selectedClientId);
    const terms = client?.default_payment_terms || initialProfile?.default_due_days || 14;
    setDueDate(calculateDueDate(newIssueDate, terms));
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof LineItemState, value: string | number) => {
    const updated = [...lineItems];
    const current = { ...updated[index] };

    if (field === 'description') {
      current.description = String(value);
    } else if (field === 'quantity') {
      const qty = parseFloat(String(value)) || 0;
      current.quantity = qty;
      current.amount = Math.round(qty * current.rate * 100) / 100;
    } else if (field === 'rate') {
      const rate = parseFloat(String(value)) || 0;
      current.rate = rate;
      current.amount = Math.round(current.quantity * rate * 100) / 100;
    }

    updated[index] = current;
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: '', quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = Math.round(lineItems.reduce((acc, item) => acc + (item.amount || 0), 0) * 100) / 100;
  const taxAmount = Math.round(subtotal * (Number(taxPercentage) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  // Form submission
  const handleSubmit = async (e: React.FormEvent, targetStatus?: InvoiceStatus) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const effectiveStatus = targetStatus || status;

    if (!invoiceNumber.trim()) {
      setErrorMessage('Invoice number is required.');
      setSaving(false);
      return;
    }

    if (!selectedClientId) {
      setErrorMessage('Please select or add a client.');
      setSaving(false);
      return;
    }

    if (lineItems.length === 0 || !lineItems.some((item) => item.description.trim())) {
      setErrorMessage('Please provide at least one line item with a description.');
      setSaving(false);
      return;
    }

    try {
      const finalInvoiceData = {
        client_id: selectedClientId,
        invoice_number: invoiceNumber.trim(),
        issue_date: issueDate,
        due_date: dueDate,
        status: effectiveStatus,
        currency,
        subtotal,
        tax_percentage: Number(taxPercentage) || 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: notes.trim(),
        payment_instructions: paymentInstructions.trim(),
        updated_at: new Date().toISOString(),
      };

      if (!supabaseConfigured) {
        // Save demo invoice in localStorage
        const invoiceId = invoiceToEdit?.id || `demo_inv_${Date.now()}`;
        const newInvoice: Invoice = {
          id: invoiceId,
          user_id: userId || 'demo_user',
          ...finalInvoiceData,
          created_at: invoiceToEdit?.created_at || new Date().toISOString(),
        };

        const newItems: InvoiceItem[] = lineItems.map((item, idx) => ({
          id: item.id || `demo_item_${Date.now()}_${idx}`,
          invoice_id: invoiceId,
          user_id: userId || 'demo_user',
          description: item.description.trim(),
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          order_index: idx,
          created_at: new Date().toISOString(),
        }));

        // Store invoice
        const storedInvoices = JSON.parse(localStorage.getItem('duenudge_demo_invoices') || '[]');
        let updatedInvoices: Invoice[];
        if (invoiceToEdit) {
          updatedInvoices = storedInvoices.map((inv: Invoice) =>
            inv.id === invoiceToEdit.id ? newInvoice : inv
          );
        } else {
          updatedInvoices = [newInvoice, ...storedInvoices];
        }
        localStorage.setItem('duenudge_demo_invoices', JSON.stringify(updatedInvoices));

        // Store items
        const storedItems = JSON.parse(localStorage.getItem('duenudge_demo_invoice_items') || '[]');
        const filteredItems = storedItems.filter((i: InvoiceItem) => i.invoice_id !== invoiceId);
        localStorage.setItem(
          'duenudge_demo_invoice_items',
          JSON.stringify([...filteredItems, ...newItems])
        );

        router.push(`/invoices/${invoiceId}`);
        router.refresh();
        return;
      }

      // Supabase Live Flow
      const supabase = createClient();
      if (!userId) throw new Error('User session not found. Please log in.');

      let createdInvoiceId = invoiceToEdit?.id;

      if (invoiceToEdit) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update(finalInvoiceData)
          .eq('id', invoiceToEdit.id);

        if (updateError) throw updateError;

        // Delete old items and insert fresh
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceToEdit.id);
      } else {
        const payload: InvoiceInsert = {
          user_id: userId,
          ...finalInvoiceData,
        };

        const { data: insertedInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;
        createdInvoiceId = insertedInvoice.id;
      }

      // Insert line items
      const itemsPayload: InvoiceItemInsert[] = lineItems.map((item, idx) => ({
        invoice_id: createdInvoiceId!,
        user_id: userId,
        description: item.description.trim(),
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        order_index: idx,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      router.push(`/invoices/${createdInvoiceId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save invoice';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Invoices
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {invoiceToEdit ? `Edit Invoice ${invoiceNumber}` : 'Create New Invoice'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Build and issue clean invoices with automatic late-payment reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'sent')}
            disabled={saving}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Save & Issue Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Invoice Error:</span>
            <p className="mt-0.5 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Form Cards */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Card 1: Client & Invoice Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Client / Bill To <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" />
                  New Client
                </button>
              </div>

              {clients.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-xs text-slate-500 mb-2">No clients available yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Client
                  </button>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} — {c.email}
                    </option>
                  ))}
                </select>
              )}

              {selectedClient && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5 text-slate-600">
                  <div className="font-semibold text-slate-900">{selectedClient.name}</div>
                  {selectedClient.company && <div>{selectedClient.company}</div>}
                  <div>{selectedClient.email}</div>
                  {selectedClient.address && <div className="text-slate-500">{selectedClient.address}</div>}
                  <div className="text-indigo-600 font-medium pt-1">
                    Default Terms: Net {selectedClient.default_payment_terms || 14} Days
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Currency
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

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Status */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Invoice Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['draft', 'sent', 'overdue', 'paid'] as InvoiceStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition ${
                        status === s
                          ? s === 'paid'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : s === 'overdue'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : s === 'sent'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Line Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Line Items & Services</h2>
              <p className="text-xs text-slate-500">Add deliverables, billable hours, or project milestones.</p>
            </div>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Item
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {/* Table headers for desktop */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs uppercase tracking-wider font-semibold text-slate-400 px-2 pb-1">
              <div className="sm:col-span-6">Description</div>
              <div className="sm:col-span-2 text-right">Quantity</div>
              <div className="sm:col-span-2 text-right">Rate</div>
              <div className="sm:col-span-2 text-right">Amount</div>
            </div>

            {lineItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 sm:p-2 bg-slate-50/70 sm:bg-transparent rounded-xl border sm:border-0 border-slate-200"
              >
                {/* Description */}
                <div className="sm:col-span-6">
                  <label className="sm:hidden block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="e.g. Design sprint, web development, consultation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="sm:hidden block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Rate */}
                <div className="sm:col-span-2">
                  <label className="sm:hidden block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Rate
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Amount & Delete */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end space-x-2">
                  <span className="font-mono font-semibold text-sm text-slate-900">
                    {formatCurrency(item.amount, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLineItem}
              className="mt-2 w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Line Item</span>
            </button>
          </div>

          {/* Calculations Summary Box */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-end">
            <div className="w-full sm:w-80 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>

              {/* Tax input */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">Tax</span>
                  <div className="flex items-center w-20">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                      className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500 ml-1">%</span>
                  </div>
                </div>
                <span className="font-mono text-slate-700">
                  {formatCurrency(taxAmount, currency)}
                </span>
              </div>

              {/* Total Due */}
              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline font-bold">
                <span className="text-base text-slate-900">Total Due</span>
                <span className="text-xl font-mono text-indigo-600">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Notes & Payment Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Invoice Notes & Terms
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Thank you for your business! Please remit payment before due date."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Payment Instructions (Wire / PayPal / Stripe)
            </label>
            <textarea
              rows={4}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="Bank Name, Routing Number, Account Number, PayPal Link"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>
      </form>

      {/* Inline Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSaved={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
          handleClientSelect(newClient.id);
        }}
        userId={userId}
      />
    </div>
  );
}
