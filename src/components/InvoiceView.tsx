'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Printer,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  Mail,
  Loader2,
  Bell,
  Sparkles,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  Client,
  BusinessProfile,
  InvoiceStatus,
} from '@/types/database';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeConfig,
  isSupabaseConfigured,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client?: Client | null;
  profile?: BusinessProfile | null;
  userId?: string | null;
}

export function InvoiceView({
  invoice,
  items = [],
  client,
  profile,
  userId,
}: InvoiceViewProps) {
  const router = useRouter();
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const [currentStatus, setCurrentStatus] = useState<InvoiceStatus>(invoice.status);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'reminder'>('invoice');

  const supabaseConfigured = isSupabaseConfigured();

  // Status changer
  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setStatusMenuOpen(false);
    setCurrentStatus(newStatus);

    if (!supabaseConfigured) {
      const stored = JSON.parse(localStorage.getItem('duenudge_demo_invoices') || '[]');
      const updated = stored.map((inv: Invoice) =>
        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
      );
      localStorage.setItem('duenudge_demo_invoices', JSON.stringify(updated));
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update invoice status.');
    }
  };

  // PDF Download Handler using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!invoicePrintRef.current) return;

    setIsGeneratingPdf(true);
    try {
      const element = invoicePrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback: trigger standard browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const badge = getStatusBadgeConfig(currentStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4 print:hidden">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Invoices
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Invoice {invoice.invoice_number}
            </h1>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border} hover:opacity-85 transition`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                <span>{badge.label}</span>
              </button>

              {statusMenuOpen && (
                <div className="absolute left-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                  {(['draft', 'sent', 'overdue', 'paid'] as InvoiceStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 capitalize font-medium text-slate-700"
                    >
                      Mark as {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Preview Toggle Tabs */}
          <div className="bg-slate-100 p-0.5 rounded-xl text-xs font-semibold flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'invoice'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reminder')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                activeTab === 'reminder'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminder Preview</span>
            </button>
          </div>

          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition inline-flex items-center"
            title="Edit invoice"
          >
            <Edit2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Edit</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition inline-flex items-center"
            title="Print invoice"
          >
            <Printer className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition disabled:opacity-70"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {activeTab === 'invoice' ? (
          /* INVOICE CARD (Captured for PDF) */
          <div
            ref={invoicePrintRef}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-slate-900"
          >
            {/* Header: Business & Invoice Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-slate-100 gap-6">
              {/* Business Details */}
              <div>
                {profile?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-12 w-auto object-contain mb-3"
                  />
                ) : (
                  <div className="h-12 w-28 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm mb-3">
                    {profile?.business_name || 'DueNudge Studio'}
                  </div>
                )}
                <h2 className="text-xl font-bold text-slate-900">
                  {profile?.business_name || 'Freelancer Business'}
                </h2>
                {profile?.address && (
                  <p className="text-xs text-slate-500 whitespace-pre-line mt-1 max-w-xs">
                    {profile.address}
                  </p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="sm:text-right">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
                  INVOICE
                </span>
                <p className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {invoice.invoice_number}
                </p>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-500">Issue Date: </span>
                    <span className="text-slate-900">{formatDate(invoice.issue_date)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Due Date: </span>
                    <span className="text-slate-900 font-semibold">{formatDate(invoice.due_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="py-6 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billed To
              </span>
              <div className="mt-1.5 text-sm">
                <p className="font-bold text-slate-900">{client?.name || 'Client'}</p>
                {client?.company && (
                  <p className="text-slate-600 font-medium text-xs mt-0.5">{client.company}</p>
                )}
                {client?.email && (
                  <p className="text-slate-500 text-xs font-mono mt-0.5">{client.email}</p>
                )}
                {client?.address && (
                  <p className="text-slate-500 text-xs whitespace-pre-line mt-1 max-w-xs">
                    {client.address}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5 text-right">Rate</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3.5 pr-4 font-medium text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-3.5 text-right font-mono">{item.quantity}</td>
                      <td className="py-3.5 text-right font-mono">
                        {formatCurrency(Number(item.rate), invoice.currency)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(Number(item.amount), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-slate-200 flex flex-col items-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                  </span>
                </div>

                {Number(invoice.tax_percentage) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({invoice.tax_percentage}%)</span>
                    <span className="font-mono text-slate-900">
                      {formatCurrency(Number(invoice.tax_amount), invoice.currency)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-slate-900">Total Amount Due</span>
                  <span className="text-lg font-mono text-indigo-600">
                    {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Payment Instructions & Notes */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Payment Instructions */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Payment Instructions</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                  {invoice.payment_instructions ||
                    profile?.payment_instructions ||
                    'Please contact us for bank details.'}
                </p>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="p-4 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Terms & Notes</span>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Powered by footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Invoice Generated via DueNudge</span>
              <span>Payment Due: {formatDate(invoice.due_date)}</span>
            </div>
          </div>
        ) : (
          /* AUTOMATED REMINDER EMAIL PREVIEW */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Automated Late-Payment Reminder Preview
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              This is the polite nudge email DueNudge automatically sends to{' '}
              <strong className="text-slate-900">{client?.email || 'your client'}</strong> if this invoice is unpaid as the due date approaches:
            </p>

            {/* Email Mock */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500 w-16 inline-block">To:</span>
                  <span className="text-slate-900 font-mono">{client?.email || 'client@example.com'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 w-16 inline-block">From:</span>
                  <span className="text-slate-900">
                    {profile?.business_name || 'Freelancer'} &lt;reminders@duenudge.app&gt;
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 w-16 inline-block">Subject:</span>
                  <span className="text-slate-900 font-bold">
                    Friendly reminder: Invoice {invoice.invoice_number} is due on {formatDate(invoice.due_date)}
                  </span>
                </div>
              </div>

              <div className="p-6 text-sm text-slate-700 space-y-4 leading-relaxed">
                <p>Hi {client?.name ? client.name.split(' ')[0] : 'there'},</p>
                <p>
                  Hope everything is going well on your end! This is a quick friendly reminder that invoice{' '}
                  <strong className="text-slate-900">{invoice.invoice_number}</strong> for{' '}
                  <strong className="text-indigo-600">
                    {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                  </strong>{' '}
                  is scheduled for payment on <strong>{formatDate(invoice.due_date)}</strong>.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                  <div className="font-bold text-slate-800">Payment Instructions:</div>
                  <div className="whitespace-pre-line text-slate-600">
                    {invoice.payment_instructions || profile?.payment_instructions || 'Bank details attached.'}
                  </div>
                </div>

                <p>
                  If this payment is already in transit, please disregard this note. Thank you for your continued partnership!
                </p>

                <p className="pt-2 font-semibold text-slate-900">
                  Best regards,<br />
                  {profile?.business_name || 'Your Name'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
