'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// حقول تُعتبر "جوهرية" وفق القسم 34: إن كان الملف منشورًا مسبقًا تمر عبر
// change_requests لمراجعة الإدارة بدل التطبيق الفوري، حفاظًا على الملف
// المنشور كما هو إلى حين الاعتماد.
const SUBSTANTIVE_FIELDS = [
  'display_name',
  'specialty_category_id',
  'specialty_id',
  'sub_specialty_id',
  'qualification',
  'employer',
] as const;

async function getCurrentAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .single();
  if (!appUser) redirect('/login');

  return { supabase, appUser };
}

export async function updateProfile(formData: FormData) {
  const { supabase, appUser } = await getCurrentAppUser();
  const isPrePublication = ['draft', 'submitted', 'needs_completion', 'rejected'].includes(
    appUser.status
  );

  const [{ data: profile }, { data: prof }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', appUser.id).single(),
    supabase.from('professional_profiles').select('*').eq('user_id', appUser.id).single(),
  ]);

  const str = (name: string) => (formData.get(name) as string) || '';

  // حقول بسيطة — تُطبَّق فورًا دائمًا (لا تحتاج مراجعة، القسم 34).
  await supabase
    .from('contacts')
    .update({
      phone: str('phone'),
      whatsapp: str('whatsapp'),
      email: str('email') || null,
    })
    .eq('user_id', appUser.id);

  await supabase
    .from('profiles')
    .update({
      family_branch_id: str('family_branch_id') || null,
      residence_country_id: str('residence_country_id') || null,
      residence_city_id: str('residence_city_id') || null,
      bio: str('bio') || null,
      last_updated_at: new Date().toISOString(),
    })
    .eq('user_id', appUser.id);

  await supabase
    .from('professional_profiles')
    .update({
      university: str('university') || null,
      job_title: str('job_title') || null,
      work_country_id: str('work_country_id') || null,
      work_city_id: str('work_city_id') || null,
      years_experience: str('years_experience') ? Number(str('years_experience')) : null,
    })
    .eq('user_id', appUser.id);

  // حقول جوهرية
  const newValues: Record<string, string> = {
    display_name: str('display_name'),
    specialty_category_id: str('specialty_category_id'),
    specialty_id: str('specialty_id'),
    sub_specialty_id: str('sub_specialty_id'),
    qualification: str('qualification'),
    employer: str('employer'),
  };

  const oldValues: Record<string, string> = {
    display_name: profile?.display_name ?? '',
    specialty_category_id: prof?.specialty_category_id ?? '',
    specialty_id: prof?.specialty_id ?? '',
    sub_specialty_id: prof?.sub_specialty_id ?? '',
    qualification: prof?.qualification ?? '',
    employer: prof?.employer ?? '',
  };

  if (isPrePublication) {
    await supabase
      .from('profiles')
      .update({ display_name: newValues.display_name })
      .eq('user_id', appUser.id);

    await supabase
      .from('professional_profiles')
      .update({
        specialty_category_id: newValues.specialty_category_id,
        specialty_id: newValues.specialty_id,
        sub_specialty_id: newValues.sub_specialty_id || null,
        qualification: newValues.qualification,
        employer: newValues.employer || null,
      })
      .eq('user_id', appUser.id);
  } else {
    const changed = SUBSTANTIVE_FIELDS.filter((f) => newValues[f] !== oldValues[f]);
    if (changed.length > 0) {
      await supabase.from('change_requests').insert(
        changed.map((field) => ({
          user_id: appUser.id,
          field_name: field,
          old_value: oldValues[field],
          new_value: newValues[field],
        }))
      );
    }
  }

  revalidatePath('/profile');
}

// طلب حذف الحساب نهائيًا (القسم 38). يُخفي الملف فورًا (حالة "موقوف")، ويصل
// الطلب للإدارة للتأكيد قبل أي حذف فعلي — تحديدًا لمنع حذف كيدي من حساب مخترق.
export async function requestAccountDeletion() {
  const { supabase, appUser } = await getCurrentAppUser();

  await supabase.from('deletion_requests').insert({
    user_id: appUser.id,
    status: 'pending',
    previous_status: appUser.status,
  });

  await supabase.from('app_users').update({ status: 'suspended' }).eq('id', appUser.id);

  await supabase.auth.signOut();
  redirect('/');
}

export async function updatePrivacyPreferences(formData: FormData) {
  const { supabase, appUser } = await getCurrentAppUser();

  await supabase.from('publication_preferences').upsert({
    user_id: appUser.id,
    show_photo: formData.get('show_photo') === 'on',
    show_employer: formData.get('show_employer') === 'on',
    show_city: formData.get('show_city') === 'on',
    show_phone: formData.get('show_phone') === 'on',
    show_whatsapp: formData.get('show_whatsapp') === 'on',
    show_email: formData.get('show_email') === 'on',
  });

  revalidatePath('/profile');
}
