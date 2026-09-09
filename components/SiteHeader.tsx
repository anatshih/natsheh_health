import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// شريط علوي موحّد لكل الصفحات العامة، بالشعار الرسمي (القسم 49.1).
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let accountHref = '/login';
  let accountLabel = 'تسجيل الدخول';

  if (user) {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (appUser && ['admin', 'reviewer'].includes(appUser.role)) {
      accountHref = '/admin';
      accountLabel = 'لوحة الإدارة';
    } else if (appUser) {
      accountHref = '/profile';
      accountLabel = 'ملفي الشخصي';
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-10 w-auto" />
          <span>
            <span className="block font-heading text-sm font-bold leading-tight text-slate-900">
              دليل الكفاءات الصحية
            </span>
            <span className="block text-[11px] text-slate-500">
              مجلس عائلة النتشة — الخليل، فلسطين
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <Link href="/directory" className="hidden hover:text-primary sm:inline">
            دليل الكفاءات
          </Link>
          <Link href="/join" className="hidden hover:text-primary sm:inline">
            طلب انضمام
          </Link>
          <Link
            href={accountHref}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            {accountLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
