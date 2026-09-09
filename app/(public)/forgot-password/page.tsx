'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// القسم 36: لا بريد إلكتروني ولا OTP. يرسل الشخص رقم الهوية ورقم الهاتف
// فيصل الطلب إلى الإدارة التي تتحقق من هويته هاتفيًا قبل تفعيل كلمة مرور جديدة.
export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // النتيجة المعروضة واحدة دائمًا بصرف النظر عن التطابق الفعلي، حتى لا يُستدل
    // من الرسالة على وجود رقم هوية معيّن في النظام من عدمه.
    await supabase.rpc('submit_password_reset_request', {
      p_id_number: idNumber,
      p_phone: phone,
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24 text-center">
        <h1 className="mb-4 text-lg font-extrabold text-primary">تم استلام طلبك</h1>
        <p className="text-sm leading-7 text-slate-600">
          إذا كانت البيانات مطابقة لحساب مسجل، سيصل طلبك إلى إدارة الدليل، وسيتم
          التواصل معك هاتفيًا للتحقق من هويتك قبل تفعيل كلمة مرور جديدة.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="mb-2 text-xl font-extrabold">نسيت كلمة المرور؟</h1>
      <p className="mb-6 text-xs text-slate-500">
        أدخل رقم هويتك ورقم هاتفك المسجَّل، وسيتواصل معك فريق الإدارة للتحقق من
        هويتك وتفعيل كلمة مرور جديدة.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">رقم الهوية</label>
          <input
            required
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">رقم الهاتف أو الواتساب المسجَّل</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
        </button>
      </form>
    </main>
  );
}
