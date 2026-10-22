import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Clock, ArrowRight } from 'lucide-react';

export default function RemindersPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Phase 2 Preview
          </span>

          <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">
            Automated Late-Payment Reminders
          </h1>

          <p className="mt-3 text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
            DueNudge uses your business timezone and payment instructions to automatically send friendly nudge emails to clients when invoices approach or pass their due date.
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/settings"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Configure Due Days & Payment Details</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </main>
      </div>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. All rights reserved.</p>
      </footer>
    </div>
  );
}
