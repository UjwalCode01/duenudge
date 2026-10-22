import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { FileText, ArrowRight } from 'lucide-react';

export default function InvoicesPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            Phase 2 Preview
          </span>

          <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">
            Invoice Creation & Line Items
          </h1>

          <p className="mt-3 text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
            Phase 1 established your business profile, default currency, prefix, and payment instructions. In Phase 2, you will be able to issue live invoices, download PDFs, and dispatch them directly to clients.
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/settings"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Review Business Settings</span>
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
