'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// كل الإجراءات هنا محمية أيضًا بسياسة RLS "الإدارة تدير الفروع" (is_admin فقط)،
// فأي محاولة من مراجع أو مستخدم عادي تُرفض من قاعدة البيانات نفسها.
export async function addBranch(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;
  await supabase.from('family_branches').insert({ name });
  revalidatePath('/admin/settings/branches');
}

export async function renameBranch(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  if (!id || !name) return;
  await supabase.from('family_branches').update({ name }).eq('id', id);
  revalidatePath('/admin/settings/branches');
}

export async function toggleBranch(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  await supabase.from('family_branches').update({ is_active: nextActive }).eq('id', id);
  revalidatePath('/admin/settings/branches');
}
