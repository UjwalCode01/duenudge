import React from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Bell, CheckCircle2, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            DueNudge
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to home
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Column (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit mb-6">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Built for Freelancers & Contractors
            </div>

            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Get paid on time, <br />
              <span className="text-indigo-600">without the awkwardness.</span>
            </h2>

            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              DueNudge automates invoice delivery and polite late-payment nudges so you keep great client relationships while maintaining predictable cash flow.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Passwordless Sign In</p>
                  <p className="text-xs text-slate-500">Sign in securely with one-click Magic Link or Google Auth.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Row-Level Security (RLS)</p>
                  <p className="text-xs text-slate-500">Your business profile and client data remain 100% private and protected in Supabase.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Custom Business Identity</p>
                  <p className="text-xs text-slate-500">Upload your studio logo, set default currencies, and attach payment instructions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <AuthForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        <p>&copy; 2026 DueNudge. All rights reserved. Powered by Next.js & Supabase.</p>
      </footer>
    </div>
  );
}
