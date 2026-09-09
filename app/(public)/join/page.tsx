'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEPS = [
  'بيانات الهوية والحساب',
  'البيانات المهنية',
  'المساهمة المستقبلية',
  'المراجعة والإرسال',
];

const CONTRIBUTION_AREAS = [
  'استشارات',
  'توعية صحية',
  'تدريب',
  'أيام صحية',
  'دعم تطوير خدمات صحية',
  'خبرة إدارية',
  'خبرة تقنية',
  'علاقات مع جهات صحية',
  'تطوع عام',
];

type LookupRow = { id: string; name?: string; name_ar?: string; country_id?: string; category_id?: string; parent_id?: string | null };

type FormState = {
  idNumber: string;
  fullName: string;
  familyBranchId: string;
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  countryId: string;
  cityId: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreePrivacy: boolean;

  specialtyCategoryId: string;
  specialtyId: string;
  subSpecialtyId: string;
  qualification: string;
  university: string;
  jobTitle: string;
  employer: string;
  workCountryId: string;
  workCityId: string;
  yearsExperience: string;
  licenseNumber: string;
  licenseAuthority: string;
  bio: string;

  futureWillingness: string;
  futureAreas: string[];

  showPhoto: boolean;
  showEmployer: boolean;
  showCity: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
};

const initialForm: FormState = {
  idNumber: '',
  fullName: '',
  familyBranchId: '',
  phone: '',
  whatsapp: '',
  sameAsPhone: false,
  countryId: '',
  cityId: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,

  specialtyCategoryId: '',
  specialtyId: '',
  subSpecialtyId: '',
  qualification: '',
  university: '',
  jobTitle: '',
  employer: '',
  workCountryId: '',
  workCityId: '',
  yearsExperience: '',
  licenseNumber: '',
  licenseAuthority: '',
  bio: '',

  futureWillingness: '',
  futureAreas: [],

  showPhoto: false,
  showEmployer: true,
  showCity: true,
  showPhone: false,
  showWhatsapp: false,
  showEmail: false,
};

export default function JoinPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [familyBranches, setFamilyBranches] = useState<LookupRow[]>([]);
  const [countries, setCountries] = useState<LookupRow[]>([]);
  const [cities, setCities] = useState<LookupRow[]>([]);
  const [specialtyCategories, setSpecialtyCategories] = useState<LookupRow[]>([]);
  const [specialties, setSpecialties] = useState<LookupRow[]>([]);

  useEffect(() => {
    async function loadReferenceData() {
      const [fb, co, ci, sc, sp] = await Promise.all([
        supabase.from('family_branches').select('id, name').eq('is_active', true),
        supabase.from('countries').select('id, name_ar').eq('is_active', true),
        supabase.from('cities').select('id, country_id, name_ar').eq('is_active', true),
        supabase.from('specialty_categories').select('id, name').eq('is_active', true).order('sort_order'),
        supabase.from('specialties').select('id, category_id, parent_id, name').eq('is_active', true).order('sort_order'),
      ]);
      setFamilyBranches(fb.data ?? []);
      setCountries(co.data ?? []);
      setCities(ci.data ?? []);
      setSpecialtyCategories(sc.data ?? []);
      setSpecialties(sp.data ?? []);
    }
    loadReferenceData();
  }, [supabase]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const residenceCities = cities.filter((c) => c.country_id === form.countryId);
  const workCities = cities.filter((c) => c.country_id === form.workCountryId);
  const mainSpecialties = specialties.filter(
    (s) => s.category_id === form.specialtyCategoryId && !s.parent_id
  );
  const subSpecialties = specialties.filter((s) => s.parent_id === form.specialtyId);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن لا تقل عن 8 أحرف.');
      return;
    }
    if (!form.agreePrivacy) {
      setError('يجب الموافقة على سياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    try {
      const internalEmail = `${crypto.randomUUID()}@users.natsheh-health.internal`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: internalEmail,
        password: form.password,
      });

      if (signUpError || !signUpData.user) {
        setError('تعذّر إنشاء الحساب. حاول مرة أخرى لاحقًا.');
        setLoading(false);
        return;
      }

      const { data: newAppUser, error: appUserError } = await supabase
        .from('app_users')
        .insert({ auth_user_id: signUpData.user.id })
        .select('id')
        .single();

      if (appUserError || !newAppUser) {
        setError('تعذّر إنشاء الحساب. حاول مرة أخرى لاحقًا.');
        setLoading(false);
        return;
      }

      const { error: identityError } = await supabase.from('identities').insert({
        user_id: newAppUser.id,
        id_number: form.idNumber,
        full_name_legal: form.fullName,
        auth_email: internalEmail,
      });

      if (identityError) {
        if (identityError.code === '23505') {
          setError(
            'يوجد حساب مرتبط برقم الهوية المدخل. إذا كان الحساب يعود لك، يرجى استخدام تسجيل الدخول أو استعادة الحساب.'
          );
        } else {
          setError('تعذّر حفظ بيانات الهوية. حاول مرة أخرى.');
        }
        setLoading(false);
        return;
      }

      const whatsappNumber = form.sameAsPhone ? form.phone : form.whatsapp;

      await supabase.from('contacts').insert({
        user_id: newAppUser.id,
        phone: form.phone,
        whatsapp: whatsappNumber,
        email: form.email || null,
      });

      await supabase.from('profiles').insert({
        user_id: newAppUser.id,
        display_name: form.fullName,
        family_branch_id: form.familyBranchId || null,
        residence_country_id: form.countryId || null,
        residence_city_id: form.cityId || null,
      });

      await supabase.from('applications').insert({ user_id: newAppUser.id });

      setAppUserId(newAppUser.id);
      setStep(2);
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!appUserId) {
      setError('انتهت الجلسة، الرجاء إعادة تعبئة الخطوة الأولى.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const { error: profError } = await supabase.from('professional_profiles').insert({
        user_id: appUserId,
        specialty_category_id: form.specialtyCategoryId,
        specialty_id: form.specialtyId,
        sub_specialty_id: form.subSpecialtyId || null,
        qualification: form.qualification,
        university: form.university || null,
        job_title: form.jobTitle || null,
        employer: form.employer || null,
        work_country_id: form.workCountryId || null,
        work_city_id: form.workCityId || null,
        years_experience: form.yearsExperience ? Number(form.yearsExperience) : null,
        license_number: form.licenseNumber || null,
        license_authority: form.licenseAuthority || null,
      });

      if (profError) {
        setError('تعذّر حفظ البيانات المهنية. تأكد من تعبئة الحقول الإلزامية.');
        setLoading(false);
        return;
      }

      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!appUserId) return;

    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({
          bio: form.bio || null,
          future_contribution_willingness: form.futureWillingness || null,
          future_contribution_areas: form.futureAreas.length ? form.futureAreas : null,
        })
        .eq('user_id', appUserId);

      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit() {
    if (!appUserId) return;
    setError(null);
    setLoading(true);

    try {
      await supabase.from('publication_preferences').upsert({
        user_id: appUserId,
        show_photo: form.showPhoto,
        show_employer: form.showEmployer,
        show_city: form.showCity,
        show_phone: form.showPhone,
        show_whatsapp: form.showWhatsapp,
        show_email: form.showEmail,
      });

      await supabase
        .from('app_users')
        .update({ status: 'submitted' })
        .eq('id', appUserId);

      await supabase
        .from('applications')
        .update({ submitted_at: new Date().toISOString() })
        .eq('user_id', appUserId);

      setSubmitted(true);
    } catch {
      setError('تعذّر إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="mb-4 text-xl font-extrabold text-primary">تم استلام طلبك بنجاح</h1>
        <p className="text-sm leading-8 text-slate-600">
          ستتم مراجعة وتدقيق البيانات قبل اعتماد الملف وظهوره في دليل الكفاءات
          الصحية لعائلة النتشة.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          الذهاب إلى ملفي الشخصي
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">طلب انضمام إلى الدليل</h1>
      <p className="mb-8 text-sm text-slate-600">دليل الكفاءات الصحية — عائلة النتشة</p>

      <ol className="mb-10 flex gap-2 text-xs font-semibold text-slate-400">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 border-t-2 pt-2 text-center ${
              i + 1 <= step ? 'border-primary text-primary' : 'border-slate-200'
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <Field label="رقم الهوية" required value={form.idNumber} onChange={(v) => update('idNumber', v)} />
          <Field label="الاسم الكامل حسب الهوية" required value={form.fullName} onChange={(v) => update('fullName', v)} />
          <SelectField
            label="الفخذ / الفرع العائلي"
            required
            value={form.familyBranchId}
            onChange={(v) => update('familyBranchId', v)}
            options={familyBranches.map((b) => ({ value: b.id, label: b.name! }))}
          />
          <Field label="رقم الهاتف" required value={form.phone} onChange={(v) => update('phone', v)} />

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.sameAsPhone}
              onChange={(e) => update('sameAsPhone', e.target.checked)}
            />
            رقم الواتساب هو نفسه رقم الهاتف
          </label>

          {!form.sameAsPhone && (
            <Field label="رقم الواتساب" required value={form.whatsapp} onChange={(v) => update('whatsapp', v)} />
          )}

          <SelectField
            label="الدولة"
            required
            value={form.countryId}
            onChange={(v) => {
              update('countryId', v);
              update('cityId', '');
            }}
            options={countries.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <SelectField
            label="المدينة / مكان الإقامة"
            required
            value={form.cityId}
            onChange={(v) => update('cityId', v)}
            options={residenceCities.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <Field label="البريد الإلكتروني" optional type="email" value={form.email} onChange={(v) => update('email', v)} />
          <Field label="كلمة المرور" required type="password" value={form.password} onChange={(v) => update('password', v)} />
          <Field
            label="تأكيد كلمة المرور"
            required
            type="password"
            value={form.confirmPassword}
            onChange={(v) => update('confirmPassword', v)}
          />

          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              required
              className="mt-0.5"
              checked={form.agreePrivacy}
              onChange={(e) => update('agreePrivacy', e.target.checked)}
            />
            <span>أوافق على سياسة الخصوصية وشروط استخدام الدليل</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'جارٍ الحفظ…' : 'التالي: البيانات المهنية ›'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <SelectField
            label="المجال الصحي الرئيسي"
            required
            value={form.specialtyCategoryId}
            onChange={(v) => {
              update('specialtyCategoryId', v);
              update('specialtyId', '');
              update('subSpecialtyId', '');
            }}
            options={specialtyCategories.map((c) => ({ value: c.id, label: c.name! }))}
          />
          <SelectField
            label="التخصص الرئيسي"
            required
            value={form.specialtyId}
            onChange={(v) => {
              update('specialtyId', v);
              update('subSpecialtyId', '');
            }}
            options={mainSpecialties.map((s) => ({ value: s.id, label: s.name! }))}
          />
          {subSpecialties.length > 0 && (
            <SelectField
              label="التخصص الدقيق"
              optional
              value={form.subSpecialtyId}
              onChange={(v) => update('subSpecialtyId', v)}
              options={subSpecialties.map((s) => ({ value: s.id, label: s.name! }))}
            />
          )}
          <Field label="المؤهل العلمي" required value={form.qualification} onChange={(v) => update('qualification', v)} />
          <Field label="الجامعة / المؤسسة التعليمية" optional value={form.university} onChange={(v) => update('university', v)} />
          <Field label="المسمى الوظيفي الحالي" optional value={form.jobTitle} onChange={(v) => update('jobTitle', v)} />
          <Field label="جهة العمل" optional value={form.employer} onChange={(v) => update('employer', v)} />
          <SelectField
            label="دولة العمل"
            optional
            value={form.workCountryId}
            onChange={(v) => {
              update('workCountryId', v);
              update('workCityId', '');
            }}
            options={countries.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <SelectField
            label="مدينة العمل"
            optional
            value={form.workCityId}
            onChange={(v) => update('workCityId', v)}
            options={workCities.map((c) => ({ value: c.id, label: c.name_ar! }))}
          />
          <Field
            label="سنوات الخبرة"
            required
            type="number"
            value={form.yearsExperience}
            onChange={(v) => update('yearsExperience', v)}
          />
          <Field label="رقم الترخيص المهني" optional value={form.licenseNumber} onChange={(v) => update('licenseNumber', v)} />
          <Field label="جهة الترخيص" optional value={form.licenseAuthority} onChange={(v) => update('licenseAuthority', v)} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700"
            >
              ‹ رجوع
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'جارٍ الحفظ…' : 'التالي: المساهمة المستقبلية ›'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold">
            هل لديك استعداد للمساهمة في أنشطة صحية أو مجتمعية مستقبلًا؟
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {[
              ['yes', 'نعم'],
              ['depends', 'حسب طبيعة النشاط'],
              ['not_available', 'غير متاح حاليًا'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="willingness"
                  checked={form.futureWillingness === value}
                  onChange={() => update('futureWillingness', value)}
                />
                {label}
              </label>
            ))}
          </div>

          {form.futureWillingness && form.futureWillingness !== 'not_available' && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-semibold">مجالات المساهمة</p>
              {CONTRIBUTION_AREAS.map((area) => (
                <label key={area} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.futureAreas.includes(area)}
                    onChange={(e) =>
                      update(
                        'futureAreas',
                        e.target.checked
                          ? [...form.futureAreas, area]
                          : form.futureAreas.filter((a) => a !== area)
                      )
                    }
                  />
                  {area}
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              النبذة المهنية <span className="font-normal text-slate-400">(اختياري)</span>
            </label>
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700"
            >
              ‹ رجوع
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'جارٍ الحفظ…' : 'التالي: المراجعة والإرسال ›'}
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="mb-3 text-sm font-bold">ما الذي تسمح بعرضه للعامة بعد الاعتماد؟</h2>
            <div className="flex flex-col gap-2 text-sm">
              <ToggleField label="عرض الصورة" checked={form.showPhoto} onChange={(v) => update('showPhoto', v)} />
              <ToggleField label="عرض جهة العمل" checked={form.showEmployer} onChange={(v) => update('showEmployer', v)} />
              <ToggleField label="عرض المدينة" checked={form.showCity} onChange={(v) => update('showCity', v)} />
              <ToggleField label="عرض رقم الهاتف" checked={form.showPhone} onChange={(v) => update('showPhone', v)} />
              <ToggleField label="عرض رقم الواتساب" checked={form.showWhatsapp} onChange={(v) => update('showWhatsapp', v)} />
              <ToggleField label="عرض البريد الإلكتروني" checked={form.showEmail} onChange={(v) => update('showEmail', v)} />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            بعد الإرسال لن يظهر ملفك في الدليل العام إلا بعد المراجعة والاعتماد من إدارة الدليل.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700"
            >
              ‹ رجوع
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'جارٍ الإرسال…' : 'إرسال طلب الانضمام'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  required,
  optional,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="mr-1 text-accent">*</span>}
        {optional && <span className="mr-1 font-normal text-slate-400">(اختياري)</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  optional,
  value,
  onChange,
  options,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="mr-1 text-accent">*</span>}
        {optional && <span className="mr-1 font-normal text-slate-400">(اختياري)</span>}
      </label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
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
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
