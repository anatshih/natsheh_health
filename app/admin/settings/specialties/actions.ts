'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;
  await supabase.from('specialty_categories').insert({ name });
  revalidatePath('/admin/settings/specialties');
}

export async function toggleCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  await supabase.from('specialty_categories').update({ is_active: nextActive }).eq('id', id);
  revalidatePath('/admin/settings/specialties');
}

export async function addSpecialty(formData: FormData) {
  const supabase = await createClient();
  const category_id = formData.get('category_id') as string;
  const parent_id = (formData.get('parent_id') as string) || null;
  const name = (formData.get('name') as string)?.trim();
  if (!category_id || !name) return;
  await supabase.from('specialties').insert({ category_id, parent_id, name });
  revalidatePath('/admin/settings/specialties');
}

export async function toggleSpecialty(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  await supabase.from('specialties').update({ is_active: nextActive }).eq('id', id);
  revalidatePath('/admin/settings/specialties');
}
