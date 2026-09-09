-- ============================================================================
-- تخزين الصورة الشخصية (القسم 15). الدلو عام للقراءة (Public) لتبسيط عرض
-- الصور المسموح بها في الدليل عبر رابط مباشر، لكن الرفع/التعديل/الحذف مقصور
-- على صاحب الملف فقط عبر مسار يبدأ بمعرّف حسابه في Supabase Auth (auth.uid()).
-- القيد الأقصى للحجم 5 ميغابايت، ونوعا الملف المسموحان JPG وPNG فقط.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "المستخدم يرفع صورته الخاصة" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "المستخدم يحدث صورته الخاصة" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "المستخدم يحذف صورته الخاصة" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
