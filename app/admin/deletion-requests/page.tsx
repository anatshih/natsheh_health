'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { confirmAccountDeletion, rejectAccountDeletion } from './actions';
import Toast, { type ToastState } from '@/components/Toast';

type Request = {
  id: string;
  user_id: string;
  status: string;
  previous_status: string | null;
  requested_at: string;
};

export default function DeletionRequestsPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [details, setDetails] = useState<Record<string, { name: string; idNumber: string; phone: string }>>({});
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
      .from('deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    setRequests(reqs ?? []);

    const userIds = [...new Set((reqs ?? []).map((r) => r.user_id))];
    const [{ data: identityRows }, { data: contactRows }] = await Promise.all([
      userIds.length
        ? supabase.from('identities').select('user_id, full_name_legal, id_number').in('user_id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabase.from('contacts').select('user_id, phone').in('user_id', userIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const identityMap = Object.fromEntries((identityRows ?? []).map((i: any) => [i.user_id, i]));
    const contactMap = Object.fromEntries((contactRows ?? []).map((c: any) => [c.user_id, c]));

    const detailMap: Record<string, { name: string; idNumber: string; phone: string }> = {};
    for (const r of reqs ?? []) {
      detailMap[r.user_id] = {
        name: identityMap[r.user_id]?.full_name_legal ?? '—',
        idNumber: identityMap[r.user_id]?.id_number ?? '—',
        phone: contactMap[r.user_id]?.phone ?? '—',
      };
    }
    setDetails(detailMap);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConfirm(r: Request) {
    if (
      !confirm(
        `هل أنت متأكد من حذف بيانات "${details[r.user_id]?.name}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`
      )
    ) {
      return;
    }
    setBusyId(r.id);
    const fd = new FormData();
    fd.set('requestId', r.id);
    fd.set('userId', r.user_id);
    const result = await confirmAccountDeletion(fd);
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      setBusyId(null);
    } else {
      await load(); // انتظار اكتمال إعادة الجلب قبل تحرير الزر يمنع تنفيذ الحذف مرتين بنقر سريع
      setBusyId(null);
      setToast({ message: 'تم حذف بيانات الحساب نهائيًا.', type: 'success' });
    }
  }

  async function handleReject(r: Request) {
    setBusyId(r.id);
    const fd = new FormData();
    fd.set('requestId', r.id);
    fd.set('userId', r.user_id);
    fd.set('previousStatus', r.previous_status ?? 'approved');
    const result = await rejectAccountDeletion(fd);
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      setBusyId(null);
    } else {
      await load();
      setBusyId(null);
      setToast({ message: 'تم رفض طلب الحذف واستعادة الحساب.', type: 'success' });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">طلبات حذف الحساب</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          يمكنك الاطلاع على الطلبات، لكن الحذف النهائي أو الرفض مقصور على المدير.
        </p>
      )}

      <p className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
        قبل التأكيد: تحقق من هوية مقدّم الطلب هاتفيًا إن أمكن، لمنع حذف كيدي
        لحساب مخترق (القسم 38). الحذف النهائي لا يمكن التراجع عنه.
      </p>

      {loading && <p className="text-sm text-slate-500">جارٍ التحميل…</p>}
      {!loading && requests.length === 0 && <p className="text-sm text-slate-500">لا توجد طلبات حذف معلّقة.</p>}

      <div className="space-y-3">
        {requests.map((r) => {
          const d = details[r.user_id];
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{d?.name ?? '…'}</p>
                  <p className="text-xs text-slate-500">
                    رقم الهوية: {d?.idNumber} · الهاتف: {d?.phone}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(r.requested_at).toLocaleString('ar')}
                </span>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => handleReject(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    رفض واستعادة الحساب
                  </button>
                  <button
                    onClick={() => handleConfirm(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                  >
                    {busyId === r.id ? 'جارٍ الحذف…' : 'حذف نهائي بعد التحقق'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
