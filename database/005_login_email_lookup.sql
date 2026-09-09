-- ============================================================================
-- دعم تسجيل الدخول برقم الهوية (القسم 14 من الوثيقة) دون كشف أي بيانات حساسة.
-- كل مستخدم يُنشأ له بريد داخلي مصطنع عشوائي (وليس مشتقًا من رقم الهوية نفسه،
-- تجنبًا لظهوره في auth.users أو في سجلات Supabase) يُخزَّن في identities.auth_email.
-- هذه الدالة تحوّل "رقم الهوية" المُدخل في نموذج تسجيل الدخول إلى ذلك البريد
-- الداخلي فقط، دون كشف أي حقل آخر من identities لغير المصادَق عليهم.
-- ============================================================================

alter table public.identities add column if not exists auth_email text unique;

create or replace function public.resolve_login_email(p_id_number text)
returns text
language sql
security definer
stable
as $$
  select auth_email from public.identities where id_number = p_id_number limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
