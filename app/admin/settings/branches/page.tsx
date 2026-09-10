'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addBranch, renameBranch, toggleBranch } from './actions';
import ToggleSwitch from '@/components/ToggleSwitch';
import SettingsTabs from '@/components/SettingsTabs';
import Toast, { type ToastState } from '@/components/Toast';

type Branch = { id: string; name: string; is_active: boolean };

// إدارة الفخذ / الفرع العائلي (القسم 53): لا حذف، فقط تفعيل/تعطيل حفاظًا
// على السجلات المرتبطة به.
export default function BranchesPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
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

    const { data } = await supabase.from('family_branches').select('*').order('name');
    setBranches(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsTabs active="branches" />
      <div className="space-y-6">
        <h2 className="text-lg font-bold">إدارة الفروع / الأفخاذ العائلية</h2>

        {!isAdmin && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            إدارة الفروع مقصورة على المدير.
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center gap-2 border-b border-slate-50 py-2 last:border-0">
                <form
                  action={async (fd) => {
                    const result = await renameBranch(fd);
                    if (result.error) setToast({ message: result.error, type: 'error' });
                    else {
                      setToast({ message: 'تم حفظ الاسم.', type: 'success' });
                      load();
                    }
                  }}
                  className="flex flex-1 items-center gap-2"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <input
                    name="name"
                    defaultValue={b.name}
                    disabled={!isAdmin}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:bg-slate-50"
                  />
                  {isAdmin && (
                    <button type="submit" className="text-xs font-semibold text-primary">
                      حفظ
                    </button>
                  )}
                </form>
                {isAdmin && (
                  <form
                    action={async (fd) => {
                      const result = await toggleBranch(fd);
                      if (result.error) setToast({ message: result.error, type: 'error' });
                      else load();
                    }}
                  >
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="nextActive" value={(!b.is_active).toString()} />
                    <ToggleSwitch active={b.is_active} itemName={b.name} />
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <form
            action={async (fd) => {
              const result = await addBranch(fd);
              if (result.error) {
                setToast({ message: result.error, type: 'error' });
              } else {
                setToast({ message: 'تمت إضافة الفرع.', type: 'success' });
                load();
              }
            }}
            className="flex gap-2 rounded-xl border border-slate-200 bg-white p-5"
          >
            <input
              name="name"
              required
              placeholder="اسم الفرع الجديد"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
              إضافة فرع
            </button>
          </form>
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
