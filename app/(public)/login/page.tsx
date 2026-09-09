'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// تسجيل الدخول برقم الهوية (القسم 14). الآلية:
// 1) إن كان المُدخل يحتوي "@" يُعامل كبريد مباشر (لحسابات الإدارة/المراجعين
//    التي تُنشأ يدويًا ببريد حقيقي — القسم 62.1).
// 2) غير ذلك يُعامل كرقم هوية: نستدعي دالة قاعدة البيانات resolve_login_email
//    لتحويله إلى البريد الداخلي المصطنع المرتبط به، ثم نسجّل الدخول به.
// رسالة الخطأ عامة دائمًا (لا تكشف إن كان الرقم غير موجود أو كلمة المرور خاطئة)
// تنفيذًا لمتطلب عدم كشف معلومات حساسة في رسائل الخطأ (القسم 61، بند 15).
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let email = identifier.trim();

      if (!email.includes('@')) {
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'resolve_login_email',
          { p_id_number: email }
        );

        if (rpcError || !resolvedEmail) {
          setError('رقم الهوية أو كلمة المرور غير صحيحة.');
          setLoading(false);
          return;
        }

        email = resolvedEmail;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.user) {
        setError('رقم الهوية أو كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', signInData.user.id)
        .single();

      router.push(appUser && ['admin', 'reviewer'].includes(appUser.role) ? '/admin' : '/profile');
      router.refresh();
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-xl font-extrabold">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">رقم الهوية</label>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">كلمة المرور</label>
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'جارٍ الدخول…' : 'دخول'}
        </button>
        <a href="/forgot-password" className="block text-center text-xs text-primary">
          نسيت كلمة المرور؟
        </a>
      </form>
    </main>
  );
}
