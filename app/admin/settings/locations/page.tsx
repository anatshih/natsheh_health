import { createClient } from '@/lib/supabase/server';
import { addCountry, toggleCountry, addCity, toggleCity } from './actions';
import ToggleSwitch from '@/components/ToggleSwitch';
import SettingsTabs from '@/components/SettingsTabs';

// إدارة الدول والمدن (القسم 54). لا حذف، فقط تفعيل/تعطيل.
export default async function LocationsPage() {
  const supabase = await createClient();

  const { data: me } = await supabase.auth.getUser();
  const { data: myAppUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', me.user?.id)
    .single();
  const isAdmin = myAppUser?.role === 'admin';

  const [{ data: countries }, { data: cities }] = await Promise.all([
    supabase.from('countries').select('*').order('name_ar'),
    supabase.from('cities').select('*, countries(name_ar)').order('name_ar'),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsTabs active="locations" />
      <div className="space-y-8">
      <h2 className="text-lg font-bold">إدارة الدول والمدن</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          إدارة الدول والمدن مقصورة على المدير.
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">الدول</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {countries?.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 text-sm">
                <span>
                  {c.name_ar} {c.iso_code && <span className="text-xs text-slate-400">({c.iso_code})</span>}
                </span>
                {isAdmin && (
                  <form action={toggleCountry}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="nextActive" value={(!c.is_active).toString()} />
                    <ToggleSwitch active={c.is_active} activeLabel="نشطة" inactiveLabel="معطّلة" itemName={c.name_ar} />
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <form action={addCountry} className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-5">
            <input name="name_ar" required placeholder="اسم الدولة بالعربية" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="name_en" placeholder="بالإنجليزية (اختياري)" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="iso_code" placeholder="رمز ISO (اختياري)" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
              إضافة دولة
            </button>
          </form>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">المدن</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {cities?.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 text-sm">
                <span>
                  {c.name_ar} <span className="text-xs text-slate-400">— {c.countries?.name_ar}</span>
                </span>
                {isAdmin && (
                  <form action={toggleCity}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="nextActive" value={(!c.is_active).toString()} />
                    <ToggleSwitch active={c.is_active} activeLabel="نشطة" inactiveLabel="معطّلة" itemName={c.name_ar} />
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <form action={addCity} className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-5">
            <select name="country_id" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">اختر الدولة</option>
              {countries?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
            <input name="name_ar" required placeholder="اسم المدينة" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
              إضافة مدينة
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
