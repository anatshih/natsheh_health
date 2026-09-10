'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

// كل الإجراءات هنا محمية أيضًا بسياسة RLS "الإدارة تدير الفروع" (is_admin فقط)،
// فأي محاولة من مراجع أو مستخدم عادي تُرفض من قاعدة البيانات نفسها.
export async function addBranch(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'الاسم إلزامي.' };
  const { error } = await supabase.from('family_branches').insert({ name });
  if (error) return { error: error.code === '23505' ? 'هذا الفرع موجود بالفعل.' : 'تعذّر الإضافة.' };
  revalidatePath('/admin/settings/branches');
  return { ok: true };
}

export async function renameBranch(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  if (!id || !name) return { error: 'الاسم إلزامي.' };
  const { error } = await supabase.from('family_branches').update({ name }).eq('id', id);
  if (error) return { error: 'تعذّر الحفظ.' };
  revalidatePath('/admin/settings/branches');
  return { ok: true };
}

export async function toggleBranch(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  const { error } = await supabase.from('family_branches').update({ is_active: nextActive }).eq('id', id);
  if (error) return { error: 'تعذّر تغيير الحالة.' };
  revalidatePath('/admin/settings/branches');
  return { ok: true };
}
