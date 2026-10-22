import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { ClientsList } from '@/components/ClientsList';
import { isSupabaseConfigured } from '@/lib/utils';
import { Client } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface ClientsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ClientsContent({ searchParams }: ClientsPageProps) {
  const resolvedParams = await searchParams;
  const isDemo = resolvedParams?.demo === 'true';
  const supabaseConfigured = isSupabaseConfigured();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userName: string | null = null;
  let businessName: string | null = null;
  let clients: Client[] = [];

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

      // Fetch profile
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      businessName = profile?.business_name || null;

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      clients = clientsData || [];
    }
  } else {
    userEmail = 'freelancer.preview@duenudge.app';
    userName = 'Alex Mercer';
  }

  return (
    <div>
      <SupabaseNotice isConfigured={supabaseConfigured} />
      <Navbar
        userEmail={userEmail}
        userName={userName}
        businessName={businessName}
      />
      <main className="pb-16">
        <ClientsList initialClients={clients} userId={userId} />
      </main>
    </div>
  );
}

export default function ClientsPage(props: ClientsPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading Clients...</span>
            </div>
          </div>
        }
      >
        <ClientsContent {...props} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. All rights reserved. Phase 2 — Client & Invoice Management.</p>
      </footer>
    </div>
  );
}
