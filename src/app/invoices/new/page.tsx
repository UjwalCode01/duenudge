import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { InvoiceForm } from '@/components/InvoiceForm';
import { isSupabaseConfigured } from '@/lib/utils';
import { Client, BusinessProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface NewInvoicePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function NewInvoiceContent({ searchParams }: NewInvoicePageProps) {
  const resolvedParams = await searchParams;
  const isDemo = resolvedParams?.demo === 'true';
  const supabaseConfigured = isSupabaseConfigured();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userName: string | null = null;
  let businessProfile: BusinessProfile | null = null;
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
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      businessProfile = profile;

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
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
        businessName={businessProfile?.business_name || null}
      />
      <main className="pb-16">
        <InvoiceForm
          initialClients={clients}
          initialProfile={businessProfile}
          userId={userId}
        />
      </main>
    </div>
  );
}

export default function NewInvoicePage(props: NewInvoicePageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading Invoice Editor...</span>
            </div>
          </div>
        }
      >
        <NewInvoiceContent {...props} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. Create Invoice.</p>
      </footer>
    </div>
  );
}
