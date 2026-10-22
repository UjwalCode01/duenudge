import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Provide a placeholder so client creation does not throw synchronously at build time
    return createBrowserClient<Database>(
      'https://placeholder-project.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
