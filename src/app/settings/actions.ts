'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ProfileSavePayload {
  business_name: string;
  logo_url?: string | null;
  address?: string | null;
  currency: string;
  invoice_prefix: string;
  default_due_days: number;
  timezone: string;
  payment_instructions?: string | null;
}

export async function saveProfile(data: ProfileSavePayload) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User session not found. Please log in again.' };
    }

    const payload = {
      business_name: data.business_name || '',
      logo_url: data.logo_url || '',
      address: data.address || '',
      currency: data.currency || 'USD',
      invoice_prefix: data.invoice_prefix || 'INV-',
      default_due_days: Number(data.default_due_days) || 14,
      timezone: data.timezone || 'UTC',
      payment_instructions: data.payment_instructions || '',
      updated_at: new Date().toISOString(),
    };

    // 1. Standard Supabase client syntax: await supabase.from('profiles').upsert({ id: user.id, ...data })
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        user_id: user.id,
        ...payload,
      });

    // 2. Also sync to business_profiles if present in schema
    const { error: bpError } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: user.id,
        ...payload,
      });

    // If both failed, report error
    if (profileError && bpError) {
      console.error('Error saving profile:', profileError, bpError);
      return {
        success: false,
        error: profileError.message || bpError.message || 'Failed to update profile.',
      };
    }

    revalidatePath('/settings');
    revalidatePath('/invoices');
    revalidatePath('/invoices/new');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
