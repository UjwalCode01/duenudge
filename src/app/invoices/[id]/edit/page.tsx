import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { InvoiceForm } from '@/components/InvoiceForm';
import { isSupabaseConfigured } from '@/lib/utils';
import { Invoice, InvoiceItem, Client, BusinessProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function EditInvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseConfigured = isSupabaseConfigured();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userName: string | null = null;
  let businessProfile: BusinessProfile | null = null;
  let invoice: Invoice | null = null;
  let items: InvoiceItem[] = [];
  let clients: Client[] = [];

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

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

    // Fetch invoice
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    invoice = invoiceData;

    if (invoice) {
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('order_index');
      items = itemsData || [];
    }
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
          invoiceToEdit={invoice}
          initialItems={items}
          userId={userId}
        />
      </main>
    </div>
  );
}

export default function EditInvoicePage(props: EditInvoicePageProps) {
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
        <EditInvoiceContent params={props.params} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>&copy; 2026 DueNudge. Edit Invoice.</p>
      </footer>
    </div>
  );
}
