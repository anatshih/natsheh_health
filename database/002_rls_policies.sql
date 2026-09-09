-- ============================================================================
-- سياسات أمان مستوى الصفوف (Row Level Security) — القسم 61 من الوثيقة
-- المبدأ العام: تمكين RLS على كل جدول، ورفض كل شيء افتراضيًا، ثم فتح
-- الوصول صراحة فقط لما تسمح به الوثيقة (الزائر / صاحب الملف / المراجع / المدير).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- دالة مساعدة: هل المستخدم الحالي إداري (مراجع أو مدير)؟
-- ----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.app_users
    where auth_user_id = auth.uid()
      and role in ('reviewer', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.app_users
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- الحصول على app_users.id للمستخدم الحالي (لمطابقة user_id في الجداول الأخرى)
create or replace function public.current_app_user_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.app_users where auth_user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- تفعيل RLS على كل الجداول
-- ----------------------------------------------------------------------------
alter table public.family_branches           enable row level security;
alter table public.countries                 enable row level security;
alter table public.cities                    enable row level security;
alter table public.specialty_categories      enable row level security;
alter table public.specialties               enable row level security;
alter table public.app_users                 enable row level security;
alter table public.identities                enable row level security;
alter table public.profiles                  enable row level security;
alter table public.contacts                  enable row level security;
alter table public.professional_profiles     enable row level security;
alter table public.publication_preferences   enable row level security;
alter table public.applications              enable row level security;
alter table public.reviews                   enable row level security;
alter table public.change_requests           enable row level security;
alter table public.password_reset_requests   enable row level security;
alter table public.deletion_requests         enable row level security;
alter table public.audit_logs                enable row level security;

-- ----------------------------------------------------------------------------
-- 1. الجداول المرجعية — قراءة عامة، تعديل للمدير فقط (القسم 27، 53، 54)
-- ----------------------------------------------------------------------------
create policy "قراءة عامة للفروع النشطة" on public.family_branches
  for select using (is_active or public.is_staff());
create policy "الإدارة تدير الفروع" on public.family_branches
  for all using (public.is_admin()) with check (public.is_admin());

create policy "قراءة عامة للدول" on public.countries
  for select using (is_active or public.is_staff());
create policy "الإدارة تدير الدول" on public.countries
  for all using (public.is_admin()) with check (public.is_admin());

create policy "قراءة عامة للمدن" on public.cities
  for select using (is_active or public.is_staff());
create policy "الإدارة تدير المدن" on public.cities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "قراءة عامة للمجالات الصحية" on public.specialty_categories
  for select using (is_active or public.is_staff());
create policy "الإدارة تدير المجالات" on public.specialty_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "قراءة عامة للتخصصات" on public.specialties
  for select using (is_active or public.is_staff());
create policy "الإدارة تدير التخصصات" on public.specialties
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. app_users — كل مستخدم يرى صفّه فقط؛ الإدارة ترى الجميع
-- ----------------------------------------------------------------------------
create policy "المستخدم يرى حسابه" on public.app_users
  for select using (auth_user_id = auth.uid() or public.is_staff());
create policy "المستخدم يحدث حسابه" on public.app_users
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid() and role = 'applicant'); -- لا يمكن للمستخدم رفع صلاحيته بنفسه
create policy "الإدارة تدير الحسابات" on public.app_users
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. identities — سرّي بالكامل (القسم 14). لا وصول عام إطلاقًا.
-- ----------------------------------------------------------------------------
create policy "صاحب الهوية أو الإدارة فقط" on public.identities
  for select using (
    user_id = public.current_app_user_id() or public.is_staff()
  );
create policy "صاحب الهوية يسجلها مرة" on public.identities
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تعدل بيانات الهوية عند الحاجة" on public.identities
  for update using (public.is_staff());

-- ----------------------------------------------------------------------------
-- 4. profiles — عامة فقط إذا كانت حالة صاحبها "منشور"، وإلا خاصة بصاحبها والإدارة
-- ----------------------------------------------------------------------------
create policy "قراءة الملفات المنشورة للعامة" on public.profiles
  for select using (
    exists (
      select 1 from public.app_users u
      where u.id = profiles.user_id and u.status = 'published'
    )
    or user_id = public.current_app_user_id()
    or public.is_staff()
  );
create policy "صاحب الملف يعدل ملفه" on public.profiles
  for update using (user_id = public.current_app_user_id());
create policy "صاحب الملف ينشئ ملفه" on public.profiles
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تدير كل الملفات" on public.profiles
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- 5. contacts — لا تُقرأ علنًا أبدًا مباشرة من الجدول؛ العرض العام يمر عبر
--    View مخصص (انظر 003) يطبّق publication_preferences. هنا فقط صاحبها والإدارة.
-- ----------------------------------------------------------------------------
create policy "صاحب البيانات أو الإدارة" on public.contacts
  for select using (user_id = public.current_app_user_id() or public.is_staff());
create policy "صاحب البيانات يعدلها" on public.contacts
  for insert with check (user_id = public.current_app_user_id());
create policy "صاحب البيانات يحدثها" on public.contacts
  for update using (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 6. professional_profiles — تعرض للعامة فقط ضمن الملفات المنشورة
-- ----------------------------------------------------------------------------
create policy "قراءة عامة للبيانات المهنية المنشورة" on public.professional_profiles
  for select using (
    exists (
      select 1 from public.app_users u
      where u.id = professional_profiles.user_id and u.status = 'published'
    )
    or user_id = public.current_app_user_id()
    or public.is_staff()
  );
create policy "صاحب الملف يدير بياناته المهنية" on public.professional_profiles
  for insert with check (user_id = public.current_app_user_id());
create policy "صاحب الملف يحدث بياناته المهنية" on public.professional_profiles
  for update using (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 7. publication_preferences — خاصة بصاحبها وبالإدارة فقط
-- ----------------------------------------------------------------------------
create policy "صاحب الإعدادات أو الإدارة" on public.publication_preferences
  for all using (user_id = public.current_app_user_id() or public.is_staff())
  with check (user_id = public.current_app_user_id() or public.is_staff());

-- ----------------------------------------------------------------------------
-- 8. applications / reviews / change_requests — صاحبها والإدارة فقط
-- ----------------------------------------------------------------------------
create policy "صاحب الطلب أو الإدارة" on public.applications
  for select using (user_id = public.current_app_user_id() or public.is_staff());
create policy "صاحب الطلب ينشئ طلبه" on public.applications
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تحدّث الطلبات" on public.applications
  for update using (public.is_staff());

create policy "أطراف المراجعة يرون السجل" on public.reviews
  for select using (
    public.is_staff() or exists (
      select 1 from public.applications a
      where a.id = reviews.application_id and a.user_id = public.current_app_user_id()
    )
  );
create policy "المراجعون يسجلون قراراتهم" on public.reviews
  for insert with check (public.is_staff() and reviewer_id = public.current_app_user_id());

create policy "صاحب التعديل أو الإدارة" on public.change_requests
  for select using (user_id = public.current_app_user_id() or public.is_staff());
create policy "صاحب الملف يطلب تعديلًا" on public.change_requests
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تبت في طلبات التعديل" on public.change_requests
  for update using (public.is_staff());

-- ----------------------------------------------------------------------------
-- 9. password_reset_requests / deletion_requests — صاحبها والإدارة فقط
-- ----------------------------------------------------------------------------
create policy "صاحب الطلب أو الإدارة يرى طلب الاستعادة" on public.password_reset_requests
  for select using (user_id = public.current_app_user_id() or public.is_staff());
create policy "أي مستخدم يقدم طلب استعادة" on public.password_reset_requests
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تعالج طلبات الاستعادة" on public.password_reset_requests
  for update using (public.is_staff());

create policy "صاحب الحساب أو الإدارة يرى طلب الحذف" on public.deletion_requests
  for select using (user_id = public.current_app_user_id() or public.is_staff());
create policy "صاحب الحساب يطلب الحذف" on public.deletion_requests
  for insert with check (user_id = public.current_app_user_id());
create policy "الإدارة تعالج طلبات الحذف" on public.deletion_requests
  for update using (public.is_staff());

-- ----------------------------------------------------------------------------
-- 10. audit_logs — للإدارة فقط، ولا تعديل أو حذف من أي أحد (سجل ثابت)
-- ----------------------------------------------------------------------------
create policy "الإدارة تقرأ سجل العمليات" on public.audit_logs
  for select using (public.is_admin());
create policy "كتابة سجل العمليات من الخادم فقط" on public.audit_logs
  for insert with check (public.is_staff());
-- لا توجد سياسة update أو delete: أي محاولة تعديل/حذف تُرفض تلقائيًا.
