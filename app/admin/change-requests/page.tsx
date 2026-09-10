'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { approveChangeRequest, rejectChangeRequest } from './actions';
import Toast, { type ToastState } from '@/components/Toast';

const FIELD_LABELS: Record<string, string> = {
  display_name: 'الاسم الظاهر للعامة',
  specialty_category_id: 'المجال الصحي',
  specialty_id: 'التخصص الرئيسي',
  sub_specialty_id: 'التخصص الدقيق',
  qualification: 'المؤهل العلمي',
  employer: 'اسم مكان العمل',
  workplace_type: 'نوع مكان العمل',
  workplace_address: 'الموقع (تفاصيل العنوان)',
};

const ID_FIELDS = new Set(['specialty_category_id', 'specialty_id', 'sub_specialty_id']);

type ChangeRequest = {
  id: string;
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

// شاشة البت في طلبات تعديل الملفات المنشورة مسبقًا (القسم 28 و34).
export default function ChangeRequestsPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [nameById, setNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: myAppUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user?.id)
      .single();
    setIsAdmin(myAppUser?.role === 'admin');

    const { data: reqs } = await supabase
      .from('change_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setRequests(reqs ?? []);

    const userIds = [...new Set((reqs ?? []).map((r) => r.user_id))];
    const [{ data: profileRows }, { data: specialtyRows }, { data: categoryRows }] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('specialties').select('id, name'),
      supabase.from('specialty_categories').select('id, name'),
    ]);

    setNameByUserId(Object.fromEntries((profileRows ?? []).map((p: any) => [p.user_id, p.display_name])));
    setNameById({
      ...Object.fromEntries((specialtyRows ?? []).map((s: any) => [s.id, s.name])),
      ...Object.fromEntries((categoryRows ?? []).map((c: any) => [c.id, c.name])),
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function displayValue(fieldName: string, value: string | null) {
    if (!value) return '—';
    if (ID_FIELDS.has(fieldName)) return nameById[value] ?? value;
    return value;
  }

  async function handleApprove(r: ChangeRequest) {
    const name = nameByUserId[r.user_id] ?? 'هذا الشخص';
    if (!confirm(`هل تريد اعتماد هذا التعديل على ملف "${name}"؟ سيُطبَّق فورًا على الملف المنشور.`)) return;

    setBusyId(r.id);
    const fd = new FormData();
    fd.set('id', r.id);
    fd.set('userId', r.user_id);
    fd.set('fieldName', r.field_name);
    fd.set('newValue', r.new_value ?? '');
    const result = await approveChangeRequest(fd);
    setBusyId(null);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
    } else {
      setToast({ message: 'تم اعتماد التعديل بنجاح.', type: 'success' });
      load();
    }
  }

  async function handleReject(r: ChangeRequest) {
    if (!confirm('هل تريد رفض طلب التعديل هذا؟')) return;

    setBusyId(r.id);
    const fd = new FormData();
    fd.set('id', r.id);
    fd.set('userId', r.user_id);
    const result = await rejectChangeRequest(fd);
    setBusyId(null);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
    } else {
      setToast({ message: 'تم رفض طلب التعديل.', type: 'success' });
      load();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">طلبات تعديل الملفات المنشورة</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          يمكنك الاطلاع على الطلبات، لكن اعتمادها أو رفضها مقصور على المدير.
        </p>
      )}

      {!loading && requests.length === 0 && (
        <p className="text-sm text-slate-500">لا توجد طلبات تعديل معلّقة حاليًا.</p>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">{nameByUserId[r.user_id] ?? '—'}</p>
              <span className="text-xs text-slate-400">
                {new Date(r.created_at).toLocaleString('ar')}
              </span>
            </div>

            <p className="mb-3 text-sm">
              <span className="font-semibold text-slate-700">
                {FIELD_LABELS[r.field_name] ?? r.field_name}:
              </span>{' '}
              <span className="text-red-600 line-through">{displayValue(r.field_name, r.old_value)}</span>
              {' ← '}
              <span className="font-semibold text-emerald-700">
                {displayValue(r.field_name, r.new_value)}
              </span>
            </p>

            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(r)}
                  disabled={busyId === r.id}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busyId === r.id ? 'جارٍ التنفيذ…' : 'اعتماد التعديل'}
                </button>
                <button
                  onClick={() => handleReject(r)}
                  disabled={busyId === r.id}
                  className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  رفض
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
