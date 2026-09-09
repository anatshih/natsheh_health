'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { suspendAccount, reactivateAccount, adminDeleteAccount } from './actions';

// نسخة محلية من تسميات الحالات (بدل الاستيراد من lib/reports.ts) لأن ذلك
// الملف يستورد عميل Supabase الخاص بالخادم (next/headers)، وهذا مكوّن عميل.
const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
  approved: 'معتمد',
  published: 'منشور',
  needs_update: 'يحتاج تحديثًا',
  suspended: 'موقوف',
  archived: 'مؤرشف',
  rejected: 'مرفوض',
};

type Row = {
  id: string;
  status: string;
  created_at: string;
  full_name_legal: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  approved: 'bg-sky-50 text-sky-700',
  submitted: 'bg-amber-50 text-amber-700',
  in_review: 'bg-amber-50 text-amber-700',
  needs_completion: 'bg-amber-50 text-amber-700',
  needs_update: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
  archived: 'bg-slate-100 text-slate-500',
  draft: 'bg-slate-100 text-slate-500',
};

// قائمة كل المسجَّلين بحالتهم أسفل صناديق لوحة المؤشرات، مع إمكانية تعطيل
// أو حذف أي حساب مباشرة (بدل الاقتصار على شاشات منفصلة لكل حالة).
export default function RegistrantsList() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
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

    const { data: appUsers } = await supabase
      .from('app_users')
      .select('id, status, created_at')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    const ids = (appUsers ?? []).map((u) => u.id);
    const { data: identities } = ids.length
      ? await supabase.from('identities').select('user_id, full_name_legal').in('user_id', ids)
      : { data: [] as any[] };

    const nameMap = Object.fromEntries((identities ?? []).map((i: any) => [i.user_id, i.full_name_legal]));

    setRows((appUsers ?? []).map((u) => ({ ...u, full_name_legal: nameMap[u.id] ?? null })));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSuspend(id: string) {
    if (!confirm('هل تريد تعطيل هذا الحساب؟ سيختفي فورًا من الدليل العام إن كان منشورًا.')) return;
    setBusyId(id);
    const fd = new FormData();
    fd.set('userId', id);
    await suspendAccount(fd);
    setBusyId(null);
    load();
  }

  async function handleReactivate(id: string) {
    setBusyId(id);
    const fd = new FormData();
    fd.set('userId', id);
    await reactivateAccount(fd);
    setBusyId(null);
    load();
  }

  async function handleDelete(id: string, name: string | null) {
    if (
      !confirm(
        `هل أنت متأكد من حذف بيانات "${name ?? 'هذا الحساب'}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`
      )
    )
      return;
    setBusyId(id);
    const fd = new FormData();
    fd.set('userId', id);
    await adminDeleteAccount(fd);
    setBusyId(null);
    load();
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-bold text-slate-700">جميع المسجَّلين</h2>

      {!isAdmin && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          يمكنك استعراض القائمة، لكن التعطيل والحذف مقصوران على المدير.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">الاسم</th>
              <th className="px-4 py-3 font-bold">تاريخ التسجيل</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              {isAdmin && <th className="px-4 py-3 font-bold">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  لا يوجد مسجَّلون بعد.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.full_name_legal ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString('ar')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_BADGE[r.status] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5">
                      {r.status === 'archived' ? (
                        <span className="text-xs text-slate-400">لا يوجد إجراء (تم الحذف)</span>
                      ) : (
                      <div className="flex gap-3">
                        {r.status === 'suspended' ? (
                          <button
                            onClick={() => handleReactivate(r.id)}
                            disabled={busyId === r.id}
                            className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
                          >
                            إعادة تفعيل
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(r.id)}
                            disabled={busyId === r.id}
                            className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-60"
                          >
                            تعطيل
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id, r.full_name_legal)}
                          disabled={busyId === r.id}
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                        >
                          حذف
                        </button>
                      </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
