import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { BusinessProfileForm } from '@/components/BusinessProfileForm';
import { isSupabaseConfigured } from '@/lib/utils';
import { BusinessProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface SettingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function SettingsContent({ searchParams }: SettingsPageProps) {
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

      // Fetch user's profile from 'profiles' (id = user.id) or fallback to 'business_profiles'
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const { data: bp } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        profile = bp as unknown as typeof profile;
      }

      initialProfile = profile as unknown as BusinessProfile;
    }
  } else {
    // Supabase credentials not provided yet in .env.local
    userEmail = 'freelancer.preview@duenudge.app';
    userName = 'Alex Mercer';
  }

  return (
    <div>
      <SupabaseNotice isConfigured={supabaseConfigured} />
      <Navbar
        userEmail={userEmail}
        userName={userName}
        businessName={initialProfile?.business_name || null}
      />
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

export default function SettingsPage(props: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading DueNudge Settings...</span>
            </div>
          </div>
        }
      >
        <SettingsContent {...props} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. All rights reserved. Phase 1 — Authentication & Business Profile Settings.</p>
      </footer>
    </div>
  );
}
