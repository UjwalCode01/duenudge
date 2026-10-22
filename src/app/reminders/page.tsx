import React, { Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { isSupabaseConfigured } from '@/lib/utils';
import {
  Clock,
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function RemindersPage() {
  const supabaseConfigured = isSupabaseConfigured();

  const reminderTiers = [
    {
      title: 'Tier 1: Pre-Due Courtesy Notice',
      timing: '3 Days Before Due Date',
      badge: 'Soft Nudge',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      subject: 'Upcoming: Invoice INV-1001 is scheduled for payment in 3 days',
      preview:
        'Hi Sarah, just a friendly heads-up that invoice INV-1001 for $3,500.00 is due in 3 days. Our bank details are attached for convenience.',
    },
    {
      title: 'Tier 2: Due Date Notification',
      timing: 'On Due Date (09:00 AM Client Timezone)',
      badge: 'Due Today',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      subject: 'Invoice INV-1001 is due today',
      preview:
        'Hi Sarah, invoice INV-1001 is due today. If payment has already been sent, thank you! Otherwise, here is the direct payment link.',
    },
    {
      title: 'Tier 3: Grace Period Overdue Follow-up',
      timing: '7 Days Past Due',
      badge: 'Urgent & Polite',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      subject: 'Follow-up regarding overdue invoice INV-1001',
      preview:
        'Hi Sarah, hope all is well! We noticed invoice INV-1001 is now 7 days past due. Please let us know if you need another copy of the invoice or help with payment.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <SupabaseNotice isConfigured={supabaseConfigured} />
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Automated Email Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Automated Payment Reminders
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                DueNudge schedules polite, non-confrontational email nudges automatically according to your clients&apos; payment terms.
              </p>
            </div>

            <Link
              href="/invoices"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <span>View Active Invoices</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>

          {/* Three-Stage Reminder Sequence */}
          <div className="mt-8 space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              Automated 3-Stage Reminder Flow
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reminderTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tier.badgeColor}`}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{tier.title}</h3>
                    <div className="text-xs text-indigo-600 font-medium flex items-center mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>{tier.timing}</span>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div className="text-[11px] text-slate-500 font-medium">Subject:</div>
                      <div className="font-semibold text-slate-800 text-[11px]">{tier.subject}</div>
                      <div className="text-[11px] text-slate-600 line-clamp-3 pt-1 border-t border-slate-200/60">
                        &quot;{tier.preview}&quot;
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>Auto-dispatched via DueNudge</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Callout */}
          <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Customize Sender Signature & Payment Instructions
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your business branding, timezone, and bank wire information in your profile settings.
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold whitespace-nowrap transition"
            >
              Configure Settings →
            </Link>
          </div>
        </main>
      </div>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. Automated Late-Payment Reminders.</p>
      </footer>
    </div>
  );
}
