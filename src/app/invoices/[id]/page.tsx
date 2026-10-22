import React, { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { InvoiceView } from '@/components/InvoiceView';
import { isSupabaseConfigured } from '@/lib/utils';
import { Invoice, InvoiceItem, Client, BusinessProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface InvoiceDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function InvoiceDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseConfigured = isSupabaseConfigured();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userName: string | null = null;
  let businessProfile: BusinessProfile | null = null;
  let invoice: Invoice | null = null;
  let items: InvoiceItem[] = [];
  let client: Client | null = null;

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

    // Fetch invoice
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (invoiceData) {
      invoice = invoiceData as unknown as Invoice;
      client = (invoiceData as unknown as { client?: Client }).client || null;

      // Fetch items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('order_index');
      items = itemsData || [];
    }
  }

  // Fallback / Demo invoice if not loaded from Supabase
  if (!invoice) {
    // Provide a sample demo invoice so dynamic page preview does not crash
    invoice = {
      id,
      user_id: 'demo_user',
      client_id: 'client_1',
      invoice_number: 'INV-1001',
      issue_date: '2026-10-10',
      due_date: '2026-10-24',
      status: 'sent',
      currency: 'USD',
      subtotal: 3500.0,
      tax_percentage: 0,
      tax_amount: 0,
      total_amount: 3500.0,
      notes: 'Mobile app UI design and design token system.',
      payment_instructions: 'Wire transfer to Chase account 987654321',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    client = {
      id: 'client_1',
      user_id: 'demo_user',
      name: 'Sarah Connor',
      email: 'sarah@skynet-solutions.com',
      company: 'Cyberdyne Systems Inc.',
      currency: 'USD',
      default_payment_terms: 14,
      address: '100 Industrial Parkway, Los Angeles, CA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    items = [
      {
        id: 'item_1',
        invoice_id: id,
        user_id: 'demo_user',
        description: 'Design System & Component Library Creation',
        quantity: 1,
        rate: 2000,
        amount: 2000,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item_2',
        invoice_id: id,
        user_id: 'demo_user',
        description: 'Interactive Prototyping & Client Review Cycles',
        quantity: 15,
        rate: 100,
        amount: 1500,
        order_index: 1,
        created_at: new Date().toISOString(),
      },
    ];

    businessProfile = {
      id: 'profile_demo',
      user_id: 'demo_user',
      business_name: 'Nexus Design Studio LLC',
      logo_url: '',
      address: '123 Creative Studio Blvd\nSan Francisco, CA 94107',
      currency: 'USD',
      payment_instructions: 'Wire: Chase Bank\nRouting: 121000358\nAccount: 9876543210',
      default_due_days: 14,
      invoice_prefix: 'INV-',
      timezone: 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
        <InvoiceView
          invoice={invoice}
          items={items}
          client={client}
          profile={businessProfile}
          userId={userId}
        />
      </main>
    </div>
  );
}

export default function InvoiceDetailsPage(props: InvoiceDetailsPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Rendering Invoice & PDF View...</span>
            </div>
          </div>
        }
      >
        <InvoiceDetailsContent params={props.params} />
      </Suspense>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white print:hidden">
        <p>&copy; 2026 DueNudge. All rights reserved.</p>
      </footer>
    </div>
  );
}
