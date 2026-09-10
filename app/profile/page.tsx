'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from '@/components/LogoutButton';
import PhotoUpload from '@/components/PhotoUpload';
import { updateProfile, updatePrivacyPreferences, requestAccountDeletion } from './actions';
import { WORKPLACE_TYPES } from '@/lib/workplaceTypes';
import { STATUS_LABELS } from '@/lib/admin-labels';

type Lookup = { id: string; name?: string; name_ar?: string; country_id?: string; category_id?: string; parent_id?: string | null };

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [appUser, setAppUser] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [prof, setProf] = useState<any>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  const [familyBranches, setFamilyBranches] = useState<Lookup[]>([]);
  const [countries, setCountries] = useState<Lookup[]>([]);
  const [cities, setCities] = useState<Lookup[]>([]);
  const [specialtyCategories, setSpecialtyCategories] = useState<Lookup[]>([]);
  const [specialties, setSpecialties] = useState<Lookup[]>([]);

  const [residenceCountryId, setResidenceCountryId] = useState('');
  const [workCountryId, setWorkCountryId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: au } = await supabase
        .from('app_users')
        .select('id, status')
        .eq('auth_user_id', user.id)
        .single();

      if (!au) {
        router.push('/login');
        return;
      }

      const [
        { data: id_ },
        { data: co_ },
        { data: pr_ },
        { data: pf_ },
        { data: pref_ },
        { data: changes_ },
        { data: fb },
        { data: countryRows },
        { data: cityRows },
        { data: catRows },
        { data: specRows },
      ] = await Promise.all([
        supabase.from('identities').select('*').eq('user_id', au.id).single(),
        supabase.from('contacts').select('*').eq('user_id', au.id).single(),
        supabase.from('profiles').select('*').eq('user_id', au.id).single(),
        supabase.from('professional_profiles').select('*').eq('user_id', au.id).single(),
        supabase.from('publication_preferences').select('*').eq('user_id', au.id).single(),
        supabase.from('change_requests').select('*').eq('user_id', au.id).eq('status', 'pending'),
        supabase.from('family_branches').select('id, name').eq('is_active', true),
        supabase.from('countries').select('id, name_ar').eq('is_active', true).order('sort_order'),
        supabase.from('cities').select('id, country_id, name_ar').eq('is_active', true).order('sort_order'),
        supabase.from('specialty_categories').select('id, name').eq('is_active', true).order('sort_order'),
        supabase.from('specialties').select('id, category_id, parent_id, name').eq('is_active', true).order('sort_order'),
      ]);

      setAppUser(au);
      setIdentity(id_);
      setContact(co_);
      setProfile(pr_);
      setProf(pf_);
      setPrefs(pref_);
      setPendingChanges(changes_ ?? []);
      setFamilyBranches(fb ?? []);
      setCountries(countryRows ?? []);
      setCities(cityRows ?? []);
      setSpecialtyCategories(catRows ?? []);
      setSpecialties(specRows ?? []);

      setResidenceCountryId(pr_?.residence_country_id ?? '');
      setWorkCountryId(pf_?.work_country_id ?? '');
      setCategoryId(pf_?.specialty_category_id ?? '');
      setSpecialtyId(pf_?.specialty_id ?? '');

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-20 text-center text-sm text-slate-500">جارٍ التحميل…</main>;
  }

  const residenceCities = cities.filter((c) => c.country_id === residenceCountryId);
  const workCities = cities.filter((c) => c.country_id === workCountryId);
  const mainSpecialties = specialties.filter((s) => s.category_id === categoryId && !s.parent_id);
  const subSpecialties = specialties.filter((s) => s.parent_id === specialtyId);
  const isPrePublication = ['draft', 'submitted', 'needs_completion', 'rejected'].includes(appUser.status);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-11 w-auto" />
          <div>
            <h1 className="text-2xl font-extrabold">ملفي الشخصي</h1>
            <p className="text-sm text-slate-600">دليل الكفاءات الصحية — عائلة النتشة</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusTile label="حالة الحساب" value={STATUS_LABELS[appUser.status] ?? appUser.status} />
        <StatusTile label="معتمد؟" value={['approved', 'published'].includes(appUser.status) ? 'نعم' : 'لا'} />
        <StatusTile label="منشور؟" value={appUser.status === 'published' ? 'نعم' : 'لا'} />
        <StatusTile
          label="آخر تحديث"
          value={profile?.last_updated_at ? new Date(profile.last_updated_at).toLocaleDateString('ar') : '—'}
        />
      </div>

      {appUser.status === 'needs_completion' && (
        <p className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          توجد بعض المعلومات التي تحتاج إلى استكمال قبل اعتماد الملف. يرجى مراجعة بياناتك أدناه وتحديثها ثم الحفظ.
        </p>
      )}

      {pendingChanges.length > 0 && (
        <p className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          لديك {pendingChanges.length} تعديلًا بانتظار مراجعة الإدارة قبل ظهوره في ملفك المنشور.
        </p>
      )}

      <form action={updateProfile} className="space-y-6">
        <Section title="بيانات الهوية">
          <div className="mb-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-700">الصورة الشخصية</p>
            <PhotoUpload
              currentUrl={profile?.photo_url}
              onUploaded={async (url) => {
                await supabase.from('profiles').update({ photo_url: url }).eq('user_id', appUser.id);
              }}
            />
          </div>
          <p className="text-xs text-slate-500">رقم الهوية: {identity?.id_number} (لا يمكن تعديله ذاتيًا)</p>
          <Field name="display_name" label="الاسم الظاهر للعامة" defaultValue={profile?.display_name} required />
          <SelectField
            name="family_branch_id"
            label="الفخذ / الفرع العائلي"
            defaultValue={profile?.family_branch_id}
            options={familyBranches.map((b) => ({ value: b.id, label: b.name! }))}
          />
        </Section>

        <Section title="بيانات الاتصال">
          <Field name="phone" label="الهاتف" defaultValue={contact?.phone} required />
          <Field name="whatsapp" label="الواتساب" defaultValue={contact?.whatsapp} required />
          <Field name="email" label="البريد الإلكتروني" defaultValue={contact?.email} optional />
          <Field name="facebook" label="رابط حساب فيسبوك" defaultValue={contact?.facebook} optional />
        </Section>

        <Section title="بيانات الإقامة">
          <SelectField
            name="residence_country_id"
            label="الدولة"
            value={residenceCountryId}
            onChange={setResidenceCountryId}
            options={countries.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <SelectField
            name="residence_city_id"
            label="المدينة"
            defaultValue={profile?.residence_city_id}
            options={residenceCities.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
        </Section>

        <Section title="البيانات المهنية">
          <SelectField
            name="specialty_category_id"
            label="المجال الصحي"
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v);
              setSpecialtyId('');
            }}
            options={specialtyCategories.map((c) => ({ value: c.id, label: c.name! }))}
          />
          <SelectField
            name="specialty_id"
            label="التخصص الرئيسي"
            value={specialtyId}
            onChange={setSpecialtyId}
            options={mainSpecialties.map((s) => ({ value: s.id, label: s.name! }))}
          />
          {subSpecialties.length > 0 && (
            <SelectField
              name="sub_specialty_id"
              label="التخصص الدقيق"
              defaultValue={prof?.sub_specialty_id}
              options={subSpecialties.map((s) => ({ value: s.id, label: s.name! }))}
            />
          )}
          <Field name="qualification" label="المؤهل العلمي" defaultValue={prof?.qualification} required />
          <Field name="university" label="الجامعة" defaultValue={prof?.university} optional />
          <Field name="job_title" label="المسمى الوظيفي" defaultValue={prof?.job_title} optional />
          <SelectField
            name="workplace_type"
            label="نوع مكان العمل"
            defaultValue={prof?.workplace_type}
            options={WORKPLACE_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Field
            name="employer"
            label="اسم مكان العمل (المستشفى / العيادة / الصيدلية...)"
            defaultValue={prof?.employer}
            optional
          />
          <Field
            name="workplace_address"
            label="الموقع (تفاصيل العنوان)"
            defaultValue={prof?.workplace_address}
            optional
          />
          <SelectField
            name="work_country_id"
            label="دولة العمل"
            value={workCountryId}
            onChange={setWorkCountryId}
            options={countries.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <SelectField
            name="work_city_id"
            label="مدينة العمل"
            defaultValue={prof?.work_city_id}
            options={workCities.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <Field
            name="years_experience"
            label="سنوات الخبرة"
            type="number"
            defaultValue={prof?.years_experience}
            optional
          />
          <TextAreaField name="bio" label="النبذة المهنية" defaultValue={profile?.bio} />
        </Section>

        {!isPrePublication && (
          <p className="text-xs text-slate-500">
            بما أن ملفك معتمد أو منشور، التعديلات على البيانات الجوهرية (الاسم، التخصص،
            المؤهل، جهة العمل، الترخيص) تُرسَل للمراجعة قبل تطبيقها، بينما تُطبَّق بقية
            التعديلات فورًا.
          </p>
        )}

        <button type="submit" className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white">
          حفظ التعديلات
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-700">إعدادات الخصوصية والنشر</h2>
        <form action={updatePrivacyPreferences} className="space-y-2">
          <ToggleField name="show_photo" label="عرض الصورة" defaultChecked={prefs?.show_photo} />
          <ToggleField name="show_employer" label="عرض جهة العمل" defaultChecked={prefs?.show_employer ?? true} />
          <ToggleField name="show_city" label="عرض المدينة" defaultChecked={prefs?.show_city ?? true} />
          <ToggleField name="show_phone" label="عرض رقم الهاتف" defaultChecked={prefs?.show_phone} />
          <ToggleField name="show_whatsapp" label="عرض رقم الواتساب" defaultChecked={prefs?.show_whatsapp} />
          <ToggleField name="show_email" label="عرض البريد الإلكتروني" defaultChecked={prefs?.show_email} />
          <ToggleField name="show_facebook" label="عرض حساب فيسبوك" defaultChecked={prefs?.show_facebook} />
          <button
            type="submit"
            className="mt-3 rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary"
          >
            حفظ إعدادات الخصوصية
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-sm font-bold text-red-800">منطقة الخطر</h2>
        <p className="mb-4 text-xs leading-6 text-red-700">
          حذف حسابك يُخفي ملفك فورًا من الدليل العام، ثم يصل الطلب إلى إدارة
          الدليل للتأكد من هويتك قبل حذف بياناتك الشخصية والمهنية نهائيًا خلال
          30 يومًا. <strong>لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</strong>
        </p>
        <form action={requestAccountDeletion}>
          <label className="mb-3 flex items-start gap-2 text-xs text-red-800">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              className="mt-0.5"
            />
            أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه بعد موافقة الإدارة.
          </label>
          <button
            type="submit"
            disabled={!confirmDelete}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            حذف حسابي نهائيًا
          </button>
        </form>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-bold text-slate-700">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  optional,
  type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}
        {optional && <span className="mr-1 font-normal text-slate-400">(اختياري)</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextAreaField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label} <span className="font-normal text-slate-400">(اختياري)</span>
      </label>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue ?? ''}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  defaultValue,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const props = onChange
    ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) }
    : { defaultValue: defaultValue ?? '' };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <select name={name} {...props} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="" />
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={!!defaultChecked} />
      {label}
    </label>
  );
}
