'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/utils';

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!supabaseConfigured) {
      // In preview mode when Supabase credentials aren't set yet
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setMagicLinkSent(true);
      }, 700);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);

    if (!supabaseConfigured) {
      setGoogleLoading(true);
      setTimeout(() => {
        setGoogleLoading(false);
        // Navigate to settings in demo mode
        router.push('/settings?demo=true');
      }, 600);
      return;
    }

    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Google';
      setErrorMessage(message);
      setGoogleLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    router.push('/settings?demo=true');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to DueNudge
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in or create your account with magic link or Google. No passwords to remember.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Authentication Error:</span>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Magic Link Success State */}
        {magicLinkSent ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-600 mt-1">
                We sent a secure magic sign-in link to:
              </p>
              <p className="font-semibold text-indigo-700 text-sm mt-0.5">{email}</p>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Click the link in your email to sign in instantly. Don&apos;t forget to check your spam folder if it doesn&apos;t arrive in 30 seconds.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                ← Use a different email address
              </button>

              {!supabaseConfigured && (
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="mt-2 w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-xs transition"
                >
                  Continue to Onboarding & Settings (Demo Mode) →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <div className="bg-white px-3 text-xs uppercase tracking-wider font-semibold text-slate-400 absolute">
                Or with email
              </div>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Freelancer Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@freelance.studio"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Mode Button for quick review */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Explore Phase 1 in Demo Mode (Instant Access)</span>
              </button>
            </div>
          </div>
        )}

        {/* Security badge footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <div className="inline-flex items-center text-xs text-slate-500 space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by Supabase Auth & Row-Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
