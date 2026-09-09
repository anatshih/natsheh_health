-- ============================================================================
-- دليل الكفاءات الصحية لعائلة النتشة — مخطط قاعدة البيانات (Supabase / PostgreSQL)
-- يطبّق الجداول المذكورة في القسم 42 من وثيقة المتطلبات، ومبادئ التصميم في القسم 43.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. جداول مرجعية تديرها الإدارة (Lookup tables)
-- ----------------------------------------------------------------------------

create table public.family_branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.countries (
  id        uuid primary key default gen_random_uuid(),
  name_ar   text not null,
  name_en   text,
  iso_code  text unique,
  is_active boolean not null default true
);

create table public.cities (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references public.countries(id) on delete restrict,
  name_ar     text not null,
  name_en     text,
  is_active   boolean not null default true,
  unique (country_id, name_ar)
);

create table public.specialty_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,     -- المجال الصحي الرئيسي
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table public.specialties (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.specialty_categories(id) on delete restrict,
  parent_id     uuid references public.specialties(id) on delete restrict, -- null = تخصص رئيسي، غير null = تخصص دقيق تابع لتخصص رئيسي
  name          text not null,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  unique (category_id, parent_id, name)
);

-- ----------------------------------------------------------------------------
-- 2. حسابات المستخدمين وربطها بالمصادقة
-- ----------------------------------------------------------------------------
-- ملاحظة معمارية (القسم 14 من الوثيقة): تسجيل الدخول يتم برقم الهوية لا بالبريد.
-- يُنشأ لكل مستخدم بريد داخلي مصطنع في Supabase Auth (auth.users) عند التسجيل،
-- بينما يتعامل المستخدم في الواجهة برقم هويته فقط. app_users هو الجدول الوسيط.

create table public.app_users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  role          text not null default 'applicant'
                  check (role in ('applicant', 'reviewer', 'admin')),
  status        text not null default 'draft'
                  check (status in (
                    'draft', 'submitted', 'in_review', 'needs_completion',
                    'approved', 'published', 'needs_update', 'suspended',
                    'archived', 'rejected'
                  )),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- بيانات الهوية الحساسة — معزولة تمامًا عن جداول العرض العام (القسم 43، مبدأ 2)
create table public.identities (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.app_users(id) on delete cascade,
  id_type               text not null default 'national_id'
                          check (id_type in ('national_id', 'passport', 'other')),
  id_number             text not null,
  id_issuing_country_id uuid references public.countries(id),
  full_name_legal       text not null,   -- الاسم الكامل حسب الهوية
  created_at            timestamptz not null default now(),
  unique (id_type, id_number)
);

-- ----------------------------------------------------------------------------
-- 3. البيانات القابلة للعرض العام (بعد الاعتماد والنشر وموافقة صاحبها)
-- ----------------------------------------------------------------------------

create table public.profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.app_users(id) on delete cascade,
  display_name       text not null,      -- الاسم كما يظهر للعامة (قد يطابق الاسم القانوني أو صيغة مختصرة)
  family_branch_id   uuid references public.family_branches(id),
  residence_country_id uuid references public.countries(id),
  residence_city_id  uuid references public.cities(id),
  photo_url          text,
  bio                text,
  future_contribution_willingness text
                          check (future_contribution_willingness in ('yes', 'depends', 'not_available')),
  future_contribution_areas text[],       -- مصفوفة نصية من قائمة مجالات المساهمة (القسم 16)
  last_updated_at    timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.app_users(id) on delete cascade,
  phone       text not null,
  whatsapp    text not null,
  email       text,
  created_at  timestamptz not null default now()
);

create table public.professional_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.app_users(id) on delete cascade,
  specialty_category_id uuid not null references public.specialty_categories(id),
  specialty_id          uuid not null references public.specialties(id),
  sub_specialty_id      uuid references public.specialties(id),
  qualification         text not null,      -- المؤهل العلمي
  university            text,
  job_title             text,
  employer              text,
  work_country_id       uuid references public.countries(id),
  work_city_id          uuid references public.cities(id),
  years_experience      int check (years_experience >= 0 and years_experience <= 70),
  license_number        text,
  license_authority     text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- إعدادات الخصوصية والنشر — مصدر الحقيقة الوحيد لما يظهر للعامة (القسم 17)
create table public.publication_preferences (
  user_id           uuid primary key references public.app_users(id) on delete cascade,
  show_photo        boolean not null default false,
  show_employer     boolean not null default true,
  show_city         boolean not null default true,
  show_phone        boolean not null default false,
  show_whatsapp     boolean not null default false,
  show_email        boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. دورة حياة الطلب: التقديم، المراجعة، التعديلات
-- ----------------------------------------------------------------------------

create table public.applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.app_users(id) on delete cascade,
  submitted_at   timestamptz,
  first_reviewed_at timestamptz,
  decided_at     timestamptz,
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  reviewer_id     uuid not null references public.app_users(id),
  action          text not null
                    check (action in (
                      'approve', 'approve_publish', 'approve_no_publish',
                      'request_completion', 'reject'
                    )),
  note            text,
  created_at      timestamptz not null default now()
);

-- طلبات تعديل على ملف منشور مسبقًا وتحتاج مراجعة (القسم 34)
create table public.change_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.app_users(id) on delete cascade,
  field_name    text not null,
  old_value     jsonb,
  new_value     jsonb not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_by   uuid references public.app_users(id),
  note          text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

-- ----------------------------------------------------------------------------
-- 5. آليات دعم إضافية من الوثيقة
-- ----------------------------------------------------------------------------

-- نسيان كلمة المرور (القسم 36) — يمر عبر تحقق يدوي من الإدارة
create table public.password_reset_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.app_users(id) on delete cascade,
  submitted_phone   text not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'verified', 'completed', 'rejected')),
  verified_by       uuid references public.app_users(id),
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

-- طلب حذف الحساب نهائيًا (القسم 38 — حق الحذف)
create table public.deletion_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.app_users(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending', 'confirmed', 'completed')),
  requested_at        timestamptz not null default now(),
  scheduled_purge_at  timestamptz,
  completed_at        timestamptz
);

-- سجل العمليات الحساسة (القسم 41)
create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.app_users(id),
  action       text not null,
  target_table text not null,
  target_id    uuid,
  details      jsonb,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. فهارس لتحسين أداء البحث والتقارير
-- ----------------------------------------------------------------------------

create index idx_app_users_status on public.app_users(status);
create index idx_profiles_branch on public.profiles(family_branch_id);
create index idx_profiles_country on public.profiles(residence_country_id);
create index idx_prof_specialty on public.professional_profiles(specialty_id);
create index idx_prof_category on public.professional_profiles(specialty_category_id);
create index idx_prof_work_country on public.professional_profiles(work_country_id);
create index idx_applications_user on public.applications(user_id);
create index idx_reviews_application on public.reviews(application_id);
create index idx_change_requests_status on public.change_requests(status);
create index idx_audit_logs_target on public.audit_logs(target_table, target_id);

-- بحث نصي عربي على الاسم (يدعم متطلب المطابقة الجزئية، القسم 25)
create index idx_profiles_display_name_trgm on public.profiles using gin (display_name gin_trgm_ops);
