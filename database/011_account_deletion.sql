-- ============================================================================
-- حق طلب حذف الحساب نهائيًا (القسم 38). يضيف:
-- 1) previous_status لاستعادة حالة الحساب إن رفضت الإدارة طلب حذف كيدي.
-- 2) حالة 'rejected' الإضافية لهذا السبب بالذات.
-- 3) صلاحية حذف فعلي لبيانات الهوية والاتصال، مقصورة على admin فقط (وليس أي
--    عضو من فريق الإدارة) لأنها عملية غير قابلة للتراجع.
-- ============================================================================

alter table public.deletion_requests add column if not exists previous_status text;

alter table public.deletion_requests drop constraint if exists deletion_requests_status_check;
alter table public.deletion_requests add constraint deletion_requests_status_check
  check (status in ('pending', 'confirmed', 'completed', 'rejected'));

create policy "المدير يحذف بيانات الهوية نهائيًا" on public.identities
  for delete using (is_admin());

create policy "المدير يحذف بيانات الاتصال نهائيًا" on public.contacts
  for delete using (is_admin());
