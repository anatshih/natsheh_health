'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addCountry(formData: FormData) {
  const supabase = await createClient();
  const name_ar = (formData.get('name_ar') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim() || null;
  const iso_code = (formData.get('iso_code') as string)?.trim() || null;
  if (!name_ar) return;
  await supabase.from('countries').insert({ name_ar, name_en, iso_code });
  revalidatePath('/admin/settings/locations');
}

export async function toggleCountry(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  await supabase.from('countries').update({ is_active: nextActive }).eq('id', id);
  revalidatePath('/admin/settings/locations');
}

export async function addCity(formData: FormData) {
  const supabase = await createClient();
  const country_id = formData.get('country_id') as string;
  const name_ar = (formData.get('name_ar') as string)?.trim();
  if (!country_id || !name_ar) return;
  await supabase.from('cities').insert({ country_id, name_ar });
  revalidatePath('/admin/settings/locations');
}

export async function toggleCity(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const nextActive = formData.get('nextActive') === 'true';
  await supabase.from('cities').update({ is_active: nextActive }).eq('id', id);
  revalidatePath('/admin/settings/locations');
}
