'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createStaffAccount, updateStaffRole } from './actions';

type StaffRow = {
  id: string;
  auth_user_id: string;
  role: string;
  staff_name: string | null;
  staff_email: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير نظام',
  reviewer: 'مراجع',
};

// شاشة "المستخدمون" (القسم 28): إنشاء حسابات فريق (مدير/مراجع) وإدارة صلاحياتها.
export default function UsersPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: me } = await supabase
      .from('app_users')
      .select('id, role')
      .eq('auth_user_id', user?.id)
      .single();
    setIsAdmin(me?.role === 'admin');
    setMyId(me?.id ?? null);

    const { data: rows } = await supabase
      .from('app_users')
      .select('id, auth_user_id, role, staff_name, staff_email, created_at')
      .in('role', ['admin', 'reviewer'])
      .order('created_at');

    setStaff(rows ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(formData: FormData) {
    setError(null);
    setCreated(null);
    setLoading(true);
    const result = await createStaffAccount(formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'حدث خطأ غير متوقع.');
      return;
    }

    setCreated(formData.get('email') as string);
    setFormKey((k) => k + 1); // إعادة تعيين النموذج (بما فيها كلمة المرور) بعد نجاح الإنشاء
    load();
  }

  async function handleRevoke(userId: string) {
    if (!confirm('هل تريد إلغاء صلاحية هذا الحساب؟ سيفقد الوصول إلى لوحة الإدارة فورًا.')) return;
    const fd = new FormData();
    fd.set('userId', userId);
    fd.set('role', 'applicant');
    await updateStaffRole(fd);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h2 className="text-lg font-bold">المستخدمون</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          إدارة حسابات الفريق مقصورة على المدير.
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">حسابات الفريق الحالية</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {staff.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد حسابات فريق بعد.</p>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0 text-sm"
                >
                  <div>
                    <p className="font-semibold">{s.staff_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{s.staff_email ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      {ROLE_LABELS[s.role] ?? s.role}
                    </span>
                    {isAdmin && s.id !== myId && (
                      <button
                        onClick={() => handleRevoke(s.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        إلغاء الصلاحية
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة حساب فريق جديد</h3>
          <form
            key={formKey}
            action={handleCreate}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5"
          >
            <select name="role" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="reviewer">مراجع — صلاحية مراجعة فقط</option>
              <option value="admin">مدير نظام — صلاحية كاملة</option>
            </select>
            <input
              name="name"
              required
              placeholder="الاسم"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="اسم المستخدم (بريد إلكتروني)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="كلمة المرور (8 أحرف على الأقل)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            {created && (
              <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                تم إنشاء حساب "{created}" بنجاح.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
