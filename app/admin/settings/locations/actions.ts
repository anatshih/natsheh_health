'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

export async function addCountry(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const name_ar = (formData.get('name_ar') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim() || null;
  const iso_code = (formData.get('iso_code') as string)?.trim() || null;
  if (!name_ar) return { error: 'اسم الدولة إلزامي.' };
  const { error } = await supabase.from('countries').insert({ name_ar, name_en, iso_code });
  if (error) return { error: error.code === '23505' ? 'هذه الدولة موجودة بالفعل.' : 'تعذّر الإضافة.' };
  revalidatePath('/admin/settings/locations');
  return { ok: true };
}

export async function toggleCountry(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  const { error } = await supabase.from('countries').update({ is_active: nextActive }).eq('id', id);
  if (error) return { error: 'تعذّر تغيير الحالة.' };
  revalidatePath('/admin/settings/locations');
  return { ok: true };
}

export async function addCity(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const country_id = formData.get('country_id') as string;
  const name_ar = (formData.get('name_ar') as string)?.trim();
  if (!country_id || !name_ar) return { error: 'الدولة واسم المدينة إلزاميان.' };
  const { error } = await supabase.from('cities').insert({ country_id, name_ar });
  if (error) return { error: error.code === '23505' ? 'هذه المدينة موجودة بالفعل.' : 'تعذّر الإضافة.' };
  revalidatePath('/admin/settings/locations');
  return { ok: true };
}

export async function toggleCity(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  const { error } = await supabase.from('cities').update({ is_active: nextActive }).eq('id', id);
  if (error) return { error: 'تعذّر تغيير الحالة.' };
  revalidatePath('/admin/settings/locations');
  return { ok: true };
}
