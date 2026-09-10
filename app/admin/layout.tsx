import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABELS } from '@/lib/admin-labels';
import LogoutButton from '@/components/LogoutButton';
import AdminNav from '@/components/AdminNav';

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

  // أعداد العناصر المعلّقة لكل شاشة "طلبات" — بنفس شرط كل شاشة بالضبط، لعرضها
  // كشارة في القائمة المنسدلة بدل اضطرار المدير لفتح الأربع شاشات يدويًا.
  const [{ count: applications }, { count: changeRequests }, { count: deletionRequests }, { count: passwordResets }] =
    await Promise.all([
      supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'in_review', 'needs_completion']),
      supabase
        .from('change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

  const counts = {
    applications: applications ?? 0,
    changeRequests: changeRequests ?? 0,
    deletionRequests: deletionRequests ?? 0,
    passwordResets: passwordResets ?? 0,
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="relative print:hidden border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-9 w-auto" />
            <h1 className="font-heading text-lg font-bold text-primary">
              لوحة إدارة الدليل الصحي
            </h1>
          </Link>

          <AdminNav counts={counts} />

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-500 sm:inline">
              دور الحساب: {ROLE_LABELS[appUser.role] ?? appUser.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="p-6 print:p-0">{children}</div>
    </div>
  );
}
