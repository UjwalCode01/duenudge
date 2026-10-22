'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Invoice, Client, InvoiceStatus } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeConfig,
  isSupabaseConfigured,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface InvoicesDashboardProps {
  initialInvoices?: (Invoice & { client?: Client | null })[];
  userId?: string | null;
}

export function InvoicesDashboard({
  initialInvoices = [],
  userId,
}: InvoicesDashboardProps) {
  const [invoices, setInvoices] = useState<(Invoice & { client?: Client | null })[]>(
    initialInvoices
  );
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  // Demo fallback loader
  useEffect(() => {
    if (!supabaseConfigured && invoices.length === 0 && typeof window !== 'undefined') {
      const stored = localStorage.getItem('duenudge_demo_invoices');
      const storedClients = JSON.parse(localStorage.getItem('duenudge_demo_clients') || '[]');

      if (stored) {
        try {
          const parsed: Invoice[] = JSON.parse(stored);
          const enriched = parsed.map((inv) => ({
            ...inv,
            client: storedClients.find((c: Client) => c.id === inv.client_id) || null,
          }));
          setInvoices(enriched);
        } catch {
          // ignore
        }
      } else {
        // Initialize default mock invoices for an amazing preview experience
        const defaultInvoices: (Invoice & { client?: Client | null })[] = [
          {
            id: 'inv_demo_101',
            user_id: 'demo_user',
            client_id: 'client_1',
            invoice_number: 'INV-1001',
            issue_date: '2026-10-10',
            due_date: '2026-10-24',
            status: 'sent',
            currency: 'USD',
            subtotal: 3500.0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 3500.0,
            notes: 'Mobile app UI design and design token system.',
            payment_instructions: 'Wire transfer to Chase account 987654321',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client: {
              id: 'client_1',
              user_id: 'demo_user',
              name: 'Sarah Connor',
              email: 'sarah@skynet-solutions.com',
              company: 'Cyberdyne Systems Inc.',
              currency: 'USD',
              default_payment_terms: 14,
              address: 'Los Angeles, CA',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          {
            id: 'inv_demo_102',
            user_id: 'demo_user',
            client_id: 'client_2',
            invoice_number: 'INV-1002',
            issue_date: '2026-09-15',
            due_date: '2026-09-29',
            status: 'overdue',
            currency: 'GBP',
            subtotal: 2200.0,
            tax_percentage: 20,
            tax_amount: 440.0,
            total_amount: 2640.0,
            notes: 'Backend API integration and testing suite.',
            payment_instructions: 'Pay via PayPal: https://paypal.me/nexusdev',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client: {
              id: 'client_2',
              user_id: 'demo_user',
              name: 'David Miller',
              email: 'david.miller@fintechlabs.io',
              company: 'Fintech Labs UK',
              currency: 'GBP',
              default_payment_terms: 14,
              address: 'London, UK',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          {
            id: 'inv_demo_103',
            user_id: 'demo_user',
            client_id: 'client_3',
            invoice_number: 'INV-1003',
            issue_date: '2026-10-01',
            due_date: '2026-10-08',
            status: 'paid',
            currency: 'USD',
            subtotal: 1800.0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 1800.0,
            notes: 'Consultation & Cloud Architecture Review.',
            payment_instructions: 'Wire or ACH',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client: {
              id: 'client_3',
              user_id: 'demo_user',
              name: 'Aarav Patel',
              email: 'aarav@cloudscale.tech',
              company: 'CloudScale Technologies',
              currency: 'USD',
              default_payment_terms: 7,
              address: 'Bengaluru, India',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ];

        localStorage.setItem('duenudge_demo_invoices', JSON.stringify(defaultInvoices));
        setInvoices(defaultInvoices);
      }
    }
  }, [supabaseConfigured, invoices.length]);

  // Metrics computation
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;
    let totalPaid = 0;

    invoices.forEach((inv) => {
      const amount = Number(inv.total_amount) || 0;
      totalInvoiced += amount;

      if (inv.status === 'paid') {
        totalPaid += amount;
      } else {
        totalUnpaid += amount;
        if (inv.status === 'overdue') {
          totalOverdue += amount;
        }
      }
    });

    return { totalInvoiced, totalUnpaid, totalOverdue, totalPaid };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (activeTab === 'paid' && inv.status !== 'paid') return false;
      if (activeTab === 'overdue' && inv.status !== 'overdue') return false;
      if (activeTab === 'unpaid' && inv.status === 'paid') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoice_number.toLowerCase().includes(q);
        const clientMatch = inv.client?.name.toLowerCase().includes(q) || false;
        const compMatch = inv.client?.company?.toLowerCase().includes(q) || false;
        return numMatch || clientMatch || compMatch;
      }

      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  // Quick status change
  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    setStatusMenuOpenId(null);

    if (!supabaseConfigured) {
      const updated = invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      );
      setInvoices(updated);
      localStorage.setItem('duenudge_demo_invoices', JSON.stringify(updated));
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
      );
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update invoice status.');
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    if (!supabaseConfigured) {
      const updated = invoices.filter((inv) => inv.id !== invoiceId);
      setInvoices(updated);
      localStorage.setItem('duenudge_demo_invoices', JSON.stringify(updated));
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;

      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Phase 2 Live
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
            Invoice Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track invoice statuses, generate PDF downloads, and automate late-payment reminders.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Invoiced</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono">
            {formatCurrency(metrics.totalInvoiced)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Across all generated invoices</div>
        </div>

        {/* Unpaid / Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Outstanding / Unpaid</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 font-mono">
            {formatCurrency(metrics.totalUnpaid)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Draft, sent, & overdue</div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Overdue Amount</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600 font-mono">
            {formatCurrency(metrics.totalOverdue)}
          </div>
          <div className="mt-1 text-xs text-rose-600 font-medium">Ready for DueNudge reminders</div>
        </div>

        {/* Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 font-mono">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Collected in full</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'unpaid', label: 'Unpaid' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'paid', label: 'Paid' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or client..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No matching invoices found' : 'No invoices in this view'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search query or reset your filter tabs.'
                : 'Create your first invoice to bill clients and automatically trigger late-payment reminders.'}
            </p>
            <div className="mt-5">
              <Link
                href="/invoices/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Invoice
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Dates</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const badge = getStatusBadgeConfig(inv.status);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition group">
                      {/* Invoice Number */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="hover:text-indigo-600 transition inline-flex items-center"
                        >
                          <span>{inv.invoice_number}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {inv.client?.name || 'Unassigned Client'}
                        </div>
                        {inv.client?.company && (
                          <div className="text-xs text-slate-500">{inv.client.company}</div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>
                          Issued: <span className="text-slate-800">{formatDate(inv.issue_date)}</span>
                        </div>
                        <div className="mt-0.5">
                          Due:{' '}
                          <span
                            className={
                              inv.status === 'overdue'
                                ? 'font-bold text-rose-600'
                                : 'font-medium text-slate-800'
                            }
                          >
                            {formatDate(inv.due_date)}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {formatCurrency(inv.total_amount, inv.currency)}
                      </td>

                      {/* Status & Status Dropdown */}
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setStatusMenuOpenId(statusMenuOpenId === inv.id ? null : inv.id)
                            }
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border} hover:opacity-85 transition`}
                            title="Click to change status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </button>

                          {statusMenuOpenId === inv.id && (
                            <div className="absolute left-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                              {(['draft', 'sent', 'overdue', 'paid'] as InvoiceStatus[]).map(
                                (s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleStatusChange(inv.id, s)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 capitalize font-medium text-slate-700"
                                  >
                                    Mark {s}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                            title="View Invoice & Download PDF"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>View / PDF</span>
                          </Link>

                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
