import { createBrowserClient } from '@supabase/ssr';

// عميل Supabase للاستخدام داخل مكونات المتصفح ('use client')
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
