import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { BusinessProfileForm } from '@/components/BusinessProfileForm';
import { isSupabaseConfigured } from '@/lib/utils';
import { BusinessProfile } from '@/types/database';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface OnboardingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function OnboardingContent({ searchParams }: OnboardingPageProps) {
  const resolvedParams = await searchParams;
  const isDemo = resolvedParams?.demo === 'true';
  const supabaseConfigured = isSupabaseConfigured();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userName: string | null = null;
  let initialProfile: BusinessProfile | null = null;

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (!isDemo) {
        redirect('/login');
      }
    } else {
      userId = user.id;
      userEmail = user.email || null;
      userName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        null;

      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      initialProfile = profile;
    }
  } else {
    userEmail = 'new-freelancer@duenudge.app';
    userName = 'Taylor Swift';
  }

  return (
    <div>
      <SupabaseNotice isConfigured={supabaseConfigured} />
      <Navbar
        userEmail={userEmail}
        userName={userName}
        businessName={initialProfile?.business_name || null}
      />

      {/* Onboarding Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-indigo-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Step 1 of 1: Freelancer Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to DueNudge! Let&apos;s build your profile.
            </h1>
            <p className="mt-1 text-sm text-indigo-200 max-w-2xl">
              Tell us your studio name, set your standard due days, and paste your payment instructions. You&apos;ll be ready to send branded invoices in under 60 seconds.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Automated Reminders Ready</p>
              <p className="text-indigo-200 text-[11px]">DueNudge will use these details to nudge late payers politely.</p>
            </div>
          </div>
        </div>
      </div>

      <main className="pb-16">
        <BusinessProfileForm
          initialProfile={initialProfile}
          userId={userId}
          userEmail={userEmail}
          isDemo={isDemo || !supabaseConfigured}
        />
      </main>
    </div>
  );
}

export default function OnboardingPage(props: OnboardingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading Onboarding...</span>
            </div>
          </div>
        }
      >
        <OnboardingContent {...props} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. Phase 1 Freelancer Onboarding.</p>
      </footer>
    </div>
  );
}
