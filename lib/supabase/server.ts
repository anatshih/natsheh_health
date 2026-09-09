import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// عميل Supabase للاستخدام داخل Server Components / Server Actions / Route Handlers
// ملاحظة: cookies() أصبحت غير متزامنة اعتبارًا من Next.js 15، لذا الدالة async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // يُستدعى setAll أحيانًا من Server Component لا يملك صلاحية الكتابة؛
            // يمكن تجاهل الخطأ إذا كان middleware.ts يتولى تحديث الجلسة.
          }
        },
      },
    }
  );
}
