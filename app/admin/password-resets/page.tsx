'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolvePasswordReset, rejectPasswordReset } from './actions';
import Toast, { type ToastState } from '@/components/Toast';

type Request = {
  id: string;
  user_id: string;
  submitted_phone: string;
  status: string;
  created_at: string;
};

export default function PasswordResetsPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [details, setDetails] = useState<Record<string, { name: string; phone: string; whatsapp: string }>>({});
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: me } = await supabase
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user?.id)
      .single();
    setIsAdmin(me?.role === 'admin');

    const { data: reqs } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setRequests(reqs ?? []);

    const detailMap: Record<string, { name: string; phone: string; whatsapp: string }> = {};
    for (const r of reqs ?? []) {
      const [{ data: identity }, { data: contact }] = await Promise.all([
        supabase.from('identities').select('full_name_legal').eq('user_id', r.user_id).single(),
        supabase.from('contacts').select('phone, whatsapp').eq('user_id', r.user_id).single(),
      ]);
      detailMap[r.user_id] = {
        name: identity?.full_name_legal ?? '—',
        phone: contact?.phone ?? '—',
        whatsapp: contact?.whatsapp ?? '—',
      };
    }
    setDetails(detailMap);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(req: Request) {
    const name = details[req.user_id]?.name ?? 'هذا الحساب';
    if (
      !confirm(
        `هل أنت متأكد من تفعيل كلمة مرور جديدة لحساب "${name}"؟ كلمة المرور الحالية ستُلغى فورًا ولن تعمل بعد الآن.`
      )
    ) {
      return;
    }
    setBusyId(req.id);
    const result = await resolvePasswordReset(req.id, req.user_id);
    setBusyId(null);
    if (typeof result.password === 'string') {
      const newPassword = result.password;
      setRevealedPasswords((p) => ({ ...p, [req.id]: newPassword }));
      load();
    } else {
      setToast({ message: result.error ?? 'حدث خطأ غير متوقع.', type: 'error' });
    }
  }

  async function handleReject(req: Request) {
    setBusyId(req.id);
    const fd = new FormData();
    fd.set('requestId', req.id);
    const result = await rejectPasswordReset(fd);
    setBusyId(null);
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
    } else {
      setToast({ message: 'تم رفض الطلب.', type: 'success' });
      load();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">طلبات استعادة الحساب</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          يمكنك الاطلاع على الطلبات، لكن تفعيل كلمة مرور جديدة مقصور على المدير.
        </p>
      )}

      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        قبل الضغط على "تفعيل كلمة مرور جديدة": تأكد أنك اتصلت بالشخص على رقمه
        <strong> المسجَّل في النظام</strong> (وليس بالضرورة الرقم الذي أرسله في
        الطلب) وتحققت من هويته بمعلومة إضافية (القسم 36).
      </p>

      {loading && <p className="text-sm text-slate-500">جارٍ التحميل…</p>}
      {!loading && requests.length === 0 && <p className="text-sm text-slate-500">لا توجد طلبات معلّقة.</p>}

      <div className="space-y-3">
        {requests.map((r) => {
          const d = details[r.user_id];
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{d?.name ?? '…'}</p>
                <span className="text-xs text-slate-400">
                  {new Date(r.created_at).toLocaleString('ar')}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">الهاتف المسجَّل في النظام</p>
                  <p>{d?.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">الواتساب المسجَّل</p>
                  <p>{d?.whatsapp}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">الرقم الذي قدّمه الطالب</p>
                  <p>{r.submitted_phone}</p>
                </div>
              </div>

              {revealedPasswords[r.id] ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  <p className="mb-1 font-semibold text-emerald-800">
                    كلمة المرور الجديدة (انسخها وأرسلها للمستخدم الآن — لن تظهر مرة أخرى):
                  </p>
                  <p className="font-mono text-base">{revealedPasswords[r.id]}</p>
                </div>
              ) : (
                isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(r)}
                      disabled={busyId === r.id}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {busyId === r.id ? 'جارٍ التفعيل…' : 'تفعيل كلمة مرور جديدة'}
                    </button>
                    <button
                      onClick={() => handleReject(r)}
                      disabled={busyId === r.id}
                      className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                    >
                      رفض الطلب
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
