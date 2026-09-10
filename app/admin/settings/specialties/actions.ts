'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'الاسم إلزامي.' };
  const { error } = await supabase.from('specialty_categories').insert({ name });
  if (error) return { error: error.code === '23505' ? 'هذا المجال موجود بالفعل.' : 'تعذّر الإضافة.' };
  revalidatePath('/admin/settings/specialties');
  return { ok: true };
}

export async function toggleCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  const { error } = await supabase.from('specialty_categories').update({ is_active: nextActive }).eq('id', id);
  if (error) return { error: 'تعذّر تغيير الحالة.' };
  revalidatePath('/admin/settings/specialties');
  return { ok: true };
}

export async function addSpecialty(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const category_id = formData.get('category_id') as string;
  const parent_id = (formData.get('parent_id') as string) || null;
  const name = (formData.get('name') as string)?.trim();
  if (!category_id || !name) return { error: 'المجال الصحي والاسم إلزاميان.' };
  const { error } = await supabase.from('specialties').insert({ category_id, parent_id, name });
  if (error) return { error: error.code === '23505' ? 'هذا التخصص موجود بالفعل.' : 'تعذّر الإضافة.' };
  revalidatePath('/admin/settings/specialties');
  return { ok: true };
}

export async function toggleSpecialty(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  const { error } = await supabase.from('specialties').update({ is_active: nextActive }).eq('id', id);
  if (error) return { error: 'تعذّر تغيير الحالة.' };
  revalidatePath('/admin/settings/specialties');
  return { ok: true };
}
