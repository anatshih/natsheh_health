import { createClient } from '@/lib/supabase/server';
import { approveChangeRequest, rejectChangeRequest } from './actions';

const FIELD_LABELS: Record<string, string> = {
  display_name: 'الاسم الظاهر للعامة',
  specialty_category_id: 'المجال الصحي',
  specialty_id: 'التخصص الرئيسي',
  sub_specialty_id: 'التخصص الدقيق',
  qualification: 'المؤهل العلمي',
  employer: 'جهة العمل',
  license_number: 'رقم الترخيص',
  license_authority: 'جهة الترخيص',
};

const ID_FIELDS = new Set(['specialty_category_id', 'specialty_id', 'sub_specialty_id']);

// شاشة البت في طلبات تعديل الملفات المنشورة مسبقًا (القسم 28 و34).
export default async function ChangeRequestsPage() {
  const supabase = await createClient();

  const { data: me } = await supabase.auth.getUser();
  const { data: myAppUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', me.user?.id)
    .single();
  const isAdmin = myAppUser?.role === 'admin';

  const { data: requests } = await supabase
    .from('change_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];
  const [{ data: profileRows }, { data: specialtyRows }, { data: categoryRows }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('specialties').select('id, name'),
    supabase.from('specialty_categories').select('id, name'),
  ]);

  const nameByUserId = Object.fromEntries((profileRows ?? []).map((p: any) => [p.user_id, p.display_name]));
  const nameById: Record<string, string> = {
    ...Object.fromEntries((specialtyRows ?? []).map((s: any) => [s.id, s.name])),
    ...Object.fromEntries((categoryRows ?? []).map((c: any) => [c.id, c.name])),
  };

  function displayValue(fieldName: string, value: string | null) {
    if (!value) return '—';
    if (ID_FIELDS.has(fieldName)) return nameById[value] ?? value;
    return value;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-bold">طلبات تعديل الملفات المنشورة</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          يمكنك الاطلاع على الطلبات، لكن اعتمادها أو رفضها مقصور على المدير.
        </p>
      )}

      {(!requests || requests.length === 0) && (
        <p className="text-sm text-slate-500">لا توجد طلبات تعديل معلّقة حاليًا.</p>
      )}

      <div className="space-y-3">
        {requests?.map((r: any) => (
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
                <form action={approveChangeRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="userId" value={r.user_id} />
                  <input type="hidden" name="fieldName" value={r.field_name} />
                  <input type="hidden" name="newValue" value={r.new_value ?? ''} />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    اعتماد التعديل
                  </button>
                </form>
                <form action={rejectChangeRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700"
                  >
                    رفض
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
