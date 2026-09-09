'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { confirmAccountDeletion, rejectAccountDeletion } from './actions';

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

    const detailMap: Record<string, { name: string; idNumber: string; phone: string }> = {};
    for (const r of reqs ?? []) {
      const [{ data: identity }, { data: contact }] = await Promise.all([
        supabase.from('identities').select('full_name_legal, id_number').eq('user_id', r.user_id).single(),
        supabase.from('contacts').select('phone').eq('user_id', r.user_id).single(),
      ]);
      detailMap[r.user_id] = {
        name: identity?.full_name_legal ?? '—',
        idNumber: identity?.id_number ?? '—',
        phone: contact?.phone ?? '—',
      };
    }
    setDetails(detailMap);
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
    await confirmAccountDeletion(fd);
    setBusyId(null);
    load();
  }

  async function handleReject(r: Request) {
    setBusyId(r.id);
    const fd = new FormData();
    fd.set('requestId', r.id);
    fd.set('userId', r.user_id);
    fd.set('previousStatus', r.previous_status ?? 'approved');
    await rejectAccountDeletion(fd);
    setBusyId(null);
    load();
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

      {requests.length === 0 && <p className="text-sm text-slate-500">لا توجد طلبات حذف معلّقة.</p>}

      <div className="space-y-3">
        {requests.map((r) => {
          const d = details[r.user_id];
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {busyId === r.id ? 'جارٍ الحذف…' : 'حذف نهائي بعد التحقق'}
                  </button>
                  <button
                    onClick={() => handleReject(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    رفض واستعادة الحساب
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
