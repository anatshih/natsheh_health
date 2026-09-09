-- ============================================================================
-- حذف فعلي لعمودي رقم الترخيص المهني وجهة الترخيص من professional_profiles،
-- بعد إزالتهما من نموذج التسجيل ولوحة الإدارة بقرار من مالك المشروع.
-- ============================================================================

alter table public.professional_profiles
  drop column if exists license_number,
  drop column if exists license_authority;
