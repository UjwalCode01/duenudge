import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { isSupabaseConfigured } from '@/lib/utils';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Sparkles,
  CheckCircle2,
  FileText,
  Users,
  Download,
  Clock,
  Layers,
} from 'lucide-react';

export default async function HomePage() {
  const supabaseConfigured = isSupabaseConfigured();
  let userEmail: string | null = null;
  let userName: string | null = null;
  let businessName: string | null = null;

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || null;
      userName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        null;

      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      businessName = profile?.business_name || null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between">
      <div>
        <SupabaseNotice isConfigured={supabaseConfigured} />
        <Navbar
          userEmail={userEmail}
          userName={userName}
          businessName={businessName}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phase 2 Released: Clients, Invoicing & PDF Downloads</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
                Never chase an invoice <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                  awkwardly again.
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                DueNudge lets freelancers manage clients, build branded invoices, download high-res PDFs, and automatically send gentle payment reminders before and after due dates.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={userEmail ? '/invoices' : '/login'}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-200 transition group"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span>{userEmail ? 'Go to Invoices' : 'Start Creating Invoices'}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/clients"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base shadow-xs transition"
                >
                  <Users className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Client Directory</span>
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-slate-500 font-medium flex-wrap gap-y-2">
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  Client CRUD & Payment Terms
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  Line Items & Auto-Calculations
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  High-Res PDF Invoice Generation
                </span>
              </div>
            </div>

            {/* Feature Highlight Cards */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Client Management & Net Terms
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Store client billing emails, legal company names, and default payment terms (Net 7, 14, 30). Invoices automatically pre-fill these terms.
                </p>
                <Link
                  href="/clients"
                  className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Manage Clients →
                </Link>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Interactive Invoices & Tax Calculations
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Add dynamic line items with automatic subtotal, tax %, and total calculations. Track statuses across Draft, Sent, Overdue, and Paid.
                </p>
                <Link
                  href="/invoices"
                  className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View Invoices Dashboard →
                </Link>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Instant PDF Invoice Downloads
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Generate print-ready vector PDF invoices with your studio logo, billing addresses, and payment instructions in one click.
                </p>
                <Link
                  href="/invoices/new"
                  className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Create & Download PDF →
                </Link>
              </div>
            </div>

            {/* Phase 1 & 2 Completed Roadmap */}
            <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Milestone Achieved</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Phase 1 & Phase 2 Are Fully Operational
                </h2>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Phase 1 (Complete)
                    </span>
                    <h4 className="font-bold text-white mt-1">Auth & Profile Foundations</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Magic link & Google login, PostgreSQL RLS, business profile settings, and Supabase Storage bucket for high-res logos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Phase 2 (Complete)
                    </span>
                    <h4 className="font-bold text-white mt-1">Clients, Invoices & PDF Engine</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Full Client CRUD, dynamic line items, auto subtotal/tax/totals, filterable dashboard, and high-res PDF invoice export.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. Crafted for Freelancers.</p>
      </footer>
    </div>
  );
}
