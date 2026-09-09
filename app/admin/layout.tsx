import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

// حماية إضافية على مستوى الصفحة فوق middleware.ts: التحقق الفعلي من الدور
// (reviewer/admin) وليس فقط من وجود جلسة (القسم 61، بند 4 و5).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: appUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  if (!appUser || !['reviewer', 'admin'].includes(appUser.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="print:hidden flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-9 w-auto" />
            <h1 className="font-heading text-lg font-bold text-primary">
              لوحة إدارة الدليل الصحي
            </h1>
          </div>
          <nav className="flex gap-4 text-sm font-semibold text-slate-600">
            <Link href="/admin" className="hover:text-primary">
              لوحة المؤشرات
            </Link>
            <Link href="/admin/applications" className="hover:text-primary">
              طلبات الانضمام
            </Link>
            <Link href="/admin/change-requests" className="hover:text-primary">
              طلبات التعديل
            </Link>
            <Link href="/admin/specialties" className="hover:text-primary">
              التخصصات
            </Link>
            <Link href="/admin/branches" className="hover:text-primary">
              الفروع
            </Link>
            <Link href="/admin/locations" className="hover:text-primary">
              الدول والمدن
            </Link>
            <Link href="/admin/password-resets" className="hover:text-primary">
              استعادة الحسابات
            </Link>
            <Link href="/admin/reports" className="hover:text-primary">
              التقارير
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">دور الحساب: {appUser.role}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="p-6 print:p-0">{children}</div>
    </div>
  );
}
