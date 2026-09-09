-- ============================================================================
-- حقل "الموقع" التفصيلي لمكان العمل (نص حر، مثل: "الخليل، بجانب مستشفى
-- المحتسب الحكومي") — منفصل عن الدولة/المدينة الموجودتين أصلاً، ومعامَل بنفس
-- منطق "اسم مكان العمل": اختياري، ويظهر في الدليل العام فقط إن وافق صاحبه
-- (نفس تفضيل show_employer)، ويُعتبر حقلاً جوهريًا يمر عبر change_requests
-- عند تعديله على ملف منشور مسبقًا (القسم 34).
-- ============================================================================

alter table public.professional_profiles add column if not exists workplace_address text;

create or replace view public.directory_public as
select
  p.id                                as profile_id,
  p.display_name,
  case when pp.show_photo then p.photo_url else null end as photo_url,
  fb.name                             as family_branch,
  co.name_ar                          as residence_country,
  ci.name_ar                          as residence_city,
  p.bio,
  sc.name                             as specialty_category,
  sp.name                             as specialty,
  ssp.name                            as sub_specialty,
  prof.qualification,
  case when pp.show_employer then prof.job_title else null end  as job_title,
  case when pp.show_employer then prof.employer  else null end  as employer,
  wc.name_ar                          as work_country,
  wci.name_ar                         as work_city,
  prof.years_experience,
  case when pp.show_phone    then c.phone    else null end as phone,
  case when pp.show_whatsapp then c.whatsapp else null end as whatsapp,
  case when pp.show_email    then c.email    else null end as email,
  p.last_updated_at,
  case when pp.show_employer then prof.workplace_type else null end as workplace_type,
  case when pp.show_employer then prof.workplace_address else null end as workplace_address
from public.profiles p
join public.app_users u              on u.id = p.user_id and u.status = 'published'
join public.professional_profiles prof on prof.user_id = p.user_id
left join public.publication_preferences pp on pp.user_id = p.user_id
left join public.contacts c          on c.user_id = p.user_id
left join public.family_branches fb  on fb.id = p.family_branch_id
left join public.countries co        on co.id = p.residence_country_id
left join public.cities ci           on ci.id = p.residence_city_id
left join public.specialty_categories sc on sc.id = prof.specialty_category_id
left join public.specialties sp      on sp.id = prof.specialty_id
left join public.specialties ssp     on ssp.id = prof.sub_specialty_id
left join public.countries wc        on wc.id = prof.work_country_id
left join public.cities wci          on wci.id = prof.work_city_id;
