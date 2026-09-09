-- ============================================================================
-- تنبيه التشابه التقريبي عند مراجعة طلب انضمام (القسم 22): لا يوجد دمج أو حذف
-- آلي — فقط تحذير يظهر للمراجع/المدير أثناء نظره في الطلب، ليقرر هو بنفسه.
-- تُشغَّل بصلاحيات المستدعي (لا Security Definer) لأن استعلامها عبر جداول
-- محمية بـ RLS أصلاً؛ لن تُعيد نتائج مفيدة إلا لحساب staff فعليًا.
-- ============================================================================

create or replace function public.find_similar_applicants(p_user_id uuid, p_name_threshold real default 0.35)
returns table (
  other_user_id uuid,
  full_name_legal text,
  id_number text,
  phone text,
  whatsapp text,
  status text,
  match_reason text
)
language sql
stable
as $$
  with target as (
    select i.full_name_legal, c.phone, c.whatsapp
    from public.identities i
    join public.contacts c on c.user_id = i.user_id
    where i.user_id = p_user_id
  )
  select
    i.user_id,
    i.full_name_legal,
    i.id_number,
    c.phone,
    c.whatsapp,
    u.status,
    case
      when c.phone = (select phone from target) then 'رقم هاتف مطابق'
      when c.whatsapp = (select whatsapp from target) then 'رقم واتساب مطابق'
      else 'اسم متشابه'
    end as match_reason
  from public.identities i
  join public.contacts c on c.user_id = i.user_id
  join public.app_users u on u.id = i.user_id
  where i.user_id <> p_user_id
    and (
      c.phone = (select phone from target)
      or c.whatsapp = (select whatsapp from target)
      or similarity(i.full_name_legal, (select full_name_legal from target)) >= p_name_threshold
    );
$$;

grant execute on function public.find_similar_applicants(uuid, real) to authenticated;
