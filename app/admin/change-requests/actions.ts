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
]);

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
export async function approveChangeRequest(formData: FormData) {
  const id = formData.get('id') as string;
  const userId = formData.get('userId') as string;
  const fieldName = formData.get('fieldName') as string;
  const newValue = formData.get('newValue') as string;

  const supabase = await createClient();
  const me = await getReviewer(supabase);
  if (!me) return;

  if (PROFILE_FIELDS.has(fieldName)) {
    await supabase
      .from('profiles')
      .update({ [fieldName]: newValue, last_updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else if (PROFESSIONAL_FIELDS.has(fieldName)) {
    await supabase
      .from('professional_profiles')
      .update({ [fieldName]: newValue || null })
      .eq('user_id', userId);
  }

  await supabase
    .from('change_requests')
    .update({ status: 'approved', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'approve_change_request',
    target_table: PROFILE_FIELDS.has(fieldName) ? 'profiles' : 'professional_profiles',
    target_id: userId,
    details: { field_name: fieldName, new_value: newValue },
  });

  revalidatePath('/admin/change-requests');
}

export async function rejectChangeRequest(formData: FormData) {
  const id = formData.get('id') as string;
  const supabase = await createClient();
  const me = await getReviewer(supabase);
  if (!me) return;

  await supabase
    .from('change_requests')
    .update({ status: 'rejected', reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/change-requests');
}
