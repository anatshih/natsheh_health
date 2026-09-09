import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { reviewApplication } from '../actions';

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

const REVIEW_ACTION_LABELS: Record<string, string> = {
  approve: 'اعتماد',
  approve_publish: 'اعتماد ونشر',
  approve_no_publish: 'اعتماد دون نشر',
  request_completion: 'طلب استكمال',
  reject: 'رفض',
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: me } = await supabase.auth.getUser();
  const { data: myAppUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', me.user?.id)
    .single();
  const canDecide = myAppUser?.role === 'admin';

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id, role, status, created_at')
    .eq('id', userId)
    .single();

  if (!appUser) notFound();

  const [{ data: identity }, { data: contact }, { data: profile }, { data: prof }] =
    await Promise.all([
      supabase.from('identities').select('*').eq('user_id', userId).single(),
      supabase.from('contacts').select('*').eq('user_id', userId).single(),
      supabase
        .from('profiles')
        .select('*, family_branches(name), countries(name_ar), cities(name_ar)')
        .eq('user_id', userId)
        .single(),
      supabase.from('professional_profiles').select('*').eq('user_id', userId).single(),
    ]);

  let specialtyLabels = { category: '', specialty: '', subSpecialty: '', workCountry: '', workCity: '' };
  if (prof) {
    const ids = [prof.specialty_category_id, prof.specialty_id, prof.sub_specialty_id].filter(Boolean);
    const [{ data: specialtyRows }, { data: workCountry }, { data: workCity }] = await Promise.all([
      supabase.from('specialties').select('id, name'),
      prof.work_country_id
        ? supabase.from('countries').select('name_ar').eq('id', prof.work_country_id).single()
        : Promise.resolve({ data: null }),
      prof.work_city_id
        ? supabase.from('cities').select('name_ar').eq('id', prof.work_city_id).single()
        : Promise.resolve({ data: null }),
    ]);
    const { data: categoryRow } = await supabase
      .from('specialty_categories')
      .select('name')
      .eq('id', prof.specialty_category_id)
      .single();
    const byId = Object.fromEntries((specialtyRows ?? []).map((s: any) => [s.id, s.name]));
    specialtyLabels = {
      category: categoryRow?.name ?? '',
      specialty: byId[prof.specialty_id] ?? '',
      subSpecialty: prof.sub_specialty_id ? byId[prof.sub_specialty_id] ?? '' : '',
      workCountry: workCountry?.name_ar ?? '',
      workCity: workCity?.name_ar ?? '',
    };
    void ids;
  }

  const { data: application } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: reviews } = application
    ? await supabase
        .from('reviews')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">مراجعة الطلب</h2>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          {STATUS_LABELS[appUser.status] ?? appUser.status}
        </span>
      </div>

      <Section title="بيانات الهوية">
        <Row label="الاسم الكامل حسب الهوية" value={identity?.full_name_legal} />
        <Row label="رقم الهوية" value={identity?.id_number} sensitive />
        <Row label="الفخذ / الفرع العائلي" value={profile?.family_branches?.name} />
      </Section>

      <Section title="بيانات الاتصال">
        <Row label="الهاتف" value={contact?.phone} />
        <Row label="الواتساب" value={contact?.whatsapp} />
        <Row label="البريد الإلكتروني" value={contact?.email} />
      </Section>

      <Section title="بيانات الإقامة">
        <Row label="الدولة" value={profile?.countries?.name_ar} />
        <Row label="المدينة" value={profile?.cities?.name_ar} />
      </Section>

      <Section title="البيانات المهنية">
        <Row label="المجال الصحي" value={specialtyLabels.category} />
        <Row label="التخصص الرئيسي" value={specialtyLabels.specialty} />
        <Row label="التخصص الدقيق" value={specialtyLabels.subSpecialty} />
        <Row label="المؤهل العلمي" value={prof?.qualification} />
        <Row label="الجامعة" value={prof?.university} />
        <Row label="المسمى الوظيفي" value={prof?.job_title} />
        <Row label="جهة العمل" value={prof?.employer} />
        <Row label="دولة العمل" value={specialtyLabels.workCountry} />
        <Row label="مدينة العمل" value={specialtyLabels.workCity} />
        <Row label="سنوات الخبرة" value={prof?.years_experience} />
        <Row label="رقم الترخيص" value={prof?.license_number} />
      </Section>

      {reviews && reviews.length > 0 && (
        <Section title="سجل المراجعات السابقة">
          {reviews.map((r: any) => (
            <div key={r.id} className="border-b border-slate-100 py-2 text-sm last:border-0">
              <p className="font-semibold">{REVIEW_ACTION_LABELS[r.action] ?? r.action}</p>
              {r.note && <p className="text-slate-600">{r.note}</p>}
              <p className="text-xs text-slate-400">
                {new Date(r.created_at).toLocaleString('ar')}
              </p>
            </div>
          ))}
        </Section>
      )}

      <Section title="الإجراءات">
        {!canDecide && (
          <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            حسابك بصلاحية مراجع: يمكنك الاطلاع على الطلب، لكن الاعتماد النهائي أو الرفض
            مقصور على المدير.
          </p>
        )}
        <form action={reviewApplication} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">ملاحظة (اختياري)</label>
            <textarea
              name="note"
              rows={3}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton name="approve" label="اعتماد" disabled={!canDecide} />
            <ActionButton name="approve_publish" label="اعتماد ونشر" primary disabled={!canDecide} />
            <ActionButton name="approve_no_publish" label="اعتماد دون نشر" disabled={!canDecide} />
            <ActionButton name="request_completion" label="طلب استكمال" disabled={!canDecide} />
            <ActionButton name="reject" label="رفض" danger disabled={!canDecide} />
          </div>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-700">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, sensitive }: { label: string; value: any; sensitive?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={sensitive ? 'font-mono' : ''}>{value || '—'}</span>
    </div>
  );
}

function ActionButton({
  name,
  label,
  primary,
  danger,
  disabled,
}: {
  name: string;
  label: string;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name="action"
      value={name}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? 'bg-primary text-white'
          : danger
            ? 'border border-red-300 text-red-700'
            : 'border border-slate-300 text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
