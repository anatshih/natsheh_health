'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const PROFILE_FIELDS = new Set(['display_name']);
const PROFESSIONAL_FIELDS = new Set([
  'specialty_category_id',
  'specialty_id',
  'sub_specialty_id',
  'qualification',
  'employer',
  'workplace_type',
  'workplace_address',
]);

type ActionResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

async function getReviewer(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();
  return me;
}

// يطبّق القيمة الجديدة فعليًا على الملف المنشور (القسم 34)، بعد موافقة الإدارة.
// لا يُعلَّم الطلب "معتمد" ولا يُسجَّل في audit_logs إلا بعد نجاح التحديث
// فعليًا — سابقًا كان الكود يتابع ويُعلِّم "نجاح" حتى لو فشل تحديث البيانات.
export async function approveChangeRequest(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id') as string;
  const userId = formData.get('userId') as string;
  const fieldName = formData.get('fieldName') as string;
  const newValue = formData.get('newValue') as string;

  const supabase = await createClient();
  const me = await getReviewer(supabase);
  if (!me || me.role !== 'admin') return { error: 'هذا الإجراء مقصور على المدير.' };

  const targetTable = PROFILE_FIELDS.has(fieldName) ? 'profiles' : 'professional_profiles';

  if (PROFILE_FIELDS.has(fieldName)) {
    const { error } = await supabase
      .from('profiles')
      .update({ [fieldName]: newValue, last_updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) return { error: 'تعذّر تطبيق التعديل على الملف. حاول مرة أخرى.' };
  } else if (PROFESSIONAL_FIELDS.has(fieldName)) {
    const { error } = await supabase
      .from('professional_profiles')
      .update({ [fieldName]: newValue || null })
      .eq('user_id', userId);
    if (error) return { error: 'تعذّر تطبيق التعديل على الملف. حاول مرة أخرى.' };
  }

  const { error: statusError } = await supabase
    .from('change_requests')
    .update({ status: 'approved', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (statusError) return { error: 'طُبِّق التعديل لكن تعذّر تحديث حالة الطلب.' };

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'approve_change_request',
    target_table: targetTable,
    target_id: userId,
    details: { field_name: fieldName, new_value: newValue },
  });

  revalidatePath('/admin/change-requests');
  return { ok: true };
}

export async function rejectChangeRequest(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id') as string;
  const userId = formData.get('userId') as string;
  const supabase = await createClient();
  const me = await getReviewer(supabase);
  if (!me || me.role !== 'admin') return { error: 'هذا الإجراء مقصور على المدير.' };

  const { error } = await supabase
    .from('change_requests')
    .update({ status: 'rejected', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'تعذّر رفض الطلب. حاول مرة أخرى.' };

  // لم يكن الرفض يُسجَّل في audit_logs سابقًا بخلاف الاعتماد — أُضيف للتناسق.
  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'reject_change_request',
    target_table: 'change_requests',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin/change-requests');
  return { ok: true };
}
