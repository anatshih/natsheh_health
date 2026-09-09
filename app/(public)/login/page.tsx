// TODO: تسجيل الدخول الفعلي يتم برقم الهوية (القسم 14)، بينما Supabase Auth
// يتطلب بريدًا. عند الإرسال: ابحث في identities عن id_number، اجلب app_users
// المرتبط، ثم نفّذ supabase.auth.signInWithPassword باستخدام البريد الداخلي
// المصطنع المخزّن لذلك المستخدم — وليس رقم الهوية مباشرة.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-xl font-extrabold">تسجيل الدخول</h1>
      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">رقم الهوية</label>
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">كلمة المرور</label>
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
        >
          دخول
        </button>
        <a href="/forgot-password" className="block text-center text-xs text-primary">
          نسيت كلمة المرور؟
        </a>
      </form>
    </main>
  );
}
