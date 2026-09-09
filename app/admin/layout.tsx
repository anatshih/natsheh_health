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
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="font-heading text-lg font-bold text-primary">
          لوحة إدارة الدليل الصحي
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">دور الحساب: {appUser.role}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
