import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import MobileNav from '@/components/MobileNav';

const SECONDARY_LINKS = [
  { href: '/stats', label: 'الإحصاءات' },
  { href: '/about', label: 'عن الدليل' },
];

const NAV_LINKS = [
  { href: '/directory', label: 'تصفّح دليل الكفاءات' },
  ...SECONDARY_LINKS,
  { href: '/join', label: 'انضمام كفاءة صحية جديدة' },
];

// شريط علوي موحّد لكل الصفحات العامة، بالشعار الرسمي (القسم 49.1).
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let accountHref = '/login';
  let accountLabel = 'تسجيل دخول الكادر الصحي';

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
    <header className="relative bg-white">
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

        <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-600 sm:flex">
          <Link
            href="/directory"
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            تصفّح دليل الكفاءات
          </Link>
          {SECONDARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="rounded-lg border border-primary px-4 py-2 text-primary hover:bg-primary-soft"
          >
            انضمام كفاءة صحية جديدة
          </Link>
          <Link href={accountHref} className="text-slate-500 hover:text-primary">
            {accountLabel}
          </Link>
        </nav>

        <MobileNav links={NAV_LINKS} accountHref={accountHref} accountLabel={accountLabel} />
      </div>

      <TatreezStrip />
    </header>
  );
}

// شريط زخرفي رفيع في أسفل الهيدر الأبيض نفسه (لا بعده)، مستوحى من غرزة
// التطريز الفلسطيني (معيّن بخيط أزرق ونقطة حمراء) — يعمل كحد سفلي للهيدر
// يفصله عن المحتوى الكريمي أسفله، بدل خط رمادي عادي أو شريط عائم بينهما.
function TatreezStrip() {
  return (
    <svg className="block h-[10px] w-full" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="tatreez-strip" width="20" height="14" patternUnits="userSpaceOnUse">
          <path d="M10 1 L19 7 L10 13 L1 7Z" fill="none" stroke="#005CB6" strokeWidth="1" opacity="0.45" />
          <circle cx="10" cy="7" r="1.3" fill="#A8324A" opacity="0.75" />
        </pattern>
      </defs>
      <rect width="400" height="14" fill="url(#tatreez-strip)" />
    </svg>
  );
}
