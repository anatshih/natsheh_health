import { createClient } from '@/lib/supabase/server';
import { addBranch, renameBranch, toggleBranch } from './actions';

// إدارة الفخذ / الفرع العائلي (القسم 53): لا حذف، فقط تفعيل/تعطيل حفاظًا
// على السجلات المرتبطة به.
export default async function BranchesPage() {
  const supabase = await createClient();

  const { data: me } = await supabase.auth.getUser();
  const { data: myAppUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', me.user?.id)
    .single();
  const isAdmin = myAppUser?.role === 'admin';

  const { data: branches } = await supabase
    .from('family_branches')
    .select('*')
    .order('name');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-lg font-bold">إدارة الفروع / الأفخاذ العائلية</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          إدارة الفروع مقصورة على المدير.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-2">
          {branches?.map((b) => (
            <div key={b.id} className="flex items-center gap-2 border-b border-slate-50 py-2 last:border-0">
              <form action={renameBranch} className="flex flex-1 items-center gap-2">
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
                <form action={toggleBranch}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="nextActive" value={(!b.is_active).toString()} />
                  <button
                    type="submit"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {b.is_active ? 'نشط' : 'معطّل'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <form action={addBranch} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-5">
          <input
            name="name"
            required
            placeholder="اسم الفرع الجديد"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
            إضافة
          </button>
        </form>
      )}
    </div>
  );
}
