-- ============================================================================
-- آلية "نسيت كلمة المرور" (القسم 36). لا بريد إلكتروني حقيقي ولا OTP، فالتحقق
-- بشري: يقدّم الشخص رقم الهوية ورقم هاتفه، تُطابَق تلقائيًا مع contacts، ثم
-- يصل الطلب للإدارة التي تتصل بالشخص هاتفيًا على الرقم *المسجل مسبقًا* للتأكد
-- من هويته قبل تفعيل كلمة مرور جديدة (وليس بمجرد تطابق تلقائي وحده).
-- ============================================================================

-- الوصول لـ identities/contacts هنا مقصور على هذه الدالة (security definer)
-- تفاديًا لأي سياسة RLS تكشف بيانات حساسة لغير مصادَق عليه.
create or replace function public.submit_password_reset_request(p_id_number text, p_phone text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_phone text;
  v_whatsapp text;
begin
  select i.user_id into v_user_id from public.identities i where i.id_number = p_id_number;
  if v_user_id is null then
    return false;
  end if;

  select c.phone, c.whatsapp into v_phone, v_whatsapp from public.contacts c where c.user_id = v_user_id;
  if p_phone is distinct from v_phone and p_phone is distinct from v_whatsapp then
    return false;
  end if;

  insert into public.password_reset_requests (user_id, submitted_phone) values (v_user_id, p_phone);
  return true;
end;
$$;

grant execute on function public.submit_password_reset_request(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- إعادة تعيين فعلية لكلمة المرور — تكتب مباشرة في auth.users عبر pgcrypto لأن
-- بريد المستخدم الداخلي المصطنع لا يستقبل رسائل، فآلية Supabase Auth القياسية
-- (رابط عبر البريد) غير قابلة للاستخدام هنا. الدالة محمية داخليًا: ترفض أي
-- استدعاء من غير حساب بصلاحية admin في app_users، بصرف النظر عمن يملك مفتاح
-- الاستدعاء (تمت الموافقة على هذا التصميم صراحة من مالك المشروع).
-- ----------------------------------------------------------------------------
create or replace function public.admin_reset_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
as $$
declare
  v_role text;
  v_auth_user_id uuid;
begin
  select role into v_role from public.app_users where auth_user_id = auth.uid();
  if v_role is distinct from 'admin' then
    raise exception 'يتطلب صلاحية مدير';
  end if;

  select auth_user_id into v_auth_user_id from public.app_users where id = p_user_id;
  if v_auth_user_id is null then
    raise exception 'مستخدم غير موجود';
  end if;

  update auth.users
    set encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
    where id = v_auth_user_id;
end;
$$;

grant execute on function public.admin_reset_password(uuid, text) to authenticated;
