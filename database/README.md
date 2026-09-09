# قاعدة بيانات دليل الكفاءات الصحية لعائلة النتشة

هذا المجلد يحتوي مخطط قاعدة البيانات الكامل (PostgreSQL / Supabase) المطابق لوثيقة المتطلبات، مقسّمًا إلى ملفات تُنفَّذ بالترتيب التالي.

## ترتيب التنفيذ

1. `001_schema.sql` — الجداول والعلاقات والفهارس.
2. `002_rls_policies.sql` — تفعيل Row Level Security وسياسات الوصول لكل جدول.
3. `003_public_directory_view.sql` — View آمن للعرض العام يطبّق إعدادات الخصوصية تلقائيًا.
4. `004_seed_reference_data.sql` — بيانات مرجعية أولية (دول، مدن، تخصصات) قابلة للتعديل من لوحة الإدارة لاحقًا.
5. `005_login_email_lookup.sql` — دالة آمنة تحوّل رقم الهوية إلى البريد الداخلي المستخدم في Supabase Auth، لتفعيل تسجيل الدخول برقم الهوية (القسم 14).
6. `006_app_users_self_insert.sql` — سياسة RLS تسمح لمستخدم جديد بإنشاء صف حسابه الخاص عند التسجيل.
7. `007_password_reset.sql` — دالتا "نسيت كلمة المرور" (القسم 36): مطابقة رقم الهوية بالهاتف، وإعادة تعيين كلمة المرور فعليًا (مقصورة على admin).
8. `008_professional_profiles_staff_update.sql` — سياسة RLS تسمح لفريق الإدارة بتعديل `professional_profiles`، لازمة لاعتماد "طلبات التعديل" (القسم 34).
9. `009_similarity_check.sql` — دالة `find_similar_applicants` لتنبيه التشابه التقريبي (الاسم/الهاتف/الواتساب) أثناء مراجعة الطلبات (القسم 22).
10. `010_profile_photos_storage.sql` — دلو تخزين `profile-photos` عام القراءة، بسياسات تسمح لكل مستخدم برفع/تعديل/حذف صورته الخاصة فقط (القسم 15).
11. `011_account_deletion.sql` — عمود `previous_status` وحالة `rejected` الإضافية في `deletion_requests`، وسياستا حذف على `identities`/`contacts` مقصورتان على admin فقط (القسم 38).
12. `012_drop_license_columns.sql` — حذف فعلي لعمودي `license_number`/`license_authority` من `professional_profiles` بعد إزالتهما من نموذج التسجيل بقرار من مالك المشروع.
13. `013_workplace_type.sql` — عمود `workplace_type` (نوع مكان العمل: مستشفى/عيادة/صيدلية/مختبر...) في `professional_profiles`، وتحديث `directory_public` لعرضه ضمن نفس تفضيل `show_employer`. القائمة ثابتة في كود التطبيق (`lib/workplaceTypes.ts`) وليست جدولاً مُدارًا.
14. `014_workplace_address.sql` — عمود `workplace_address` (نص حر لتفاصيل الموقع، مثل "بجانب مستشفى X") في `professional_profiles`، معامَل بنفس تفضيل `show_employer` في `directory_public`.
15. `015_facebook_field.sql` — عمود `facebook` في `contacts` وتفضيل خصوصية مستقل `show_facebook` في `publication_preferences`، بنفس نمط الهاتف/الواتساب/البريد.

## طريقة التنفيذ على Supabase

### عبر SQL Editor في لوحة Supabase
انسخ محتوى كل ملف بالترتيب أعلاه، والصقه في **SQL Editor** ثم شغّله، ملفًا تلو الآخر.

### عبر Supabase CLI (مفضّل للمشاريع الفعلية)

```bash
supabase link --project-ref <project-ref>
supabase db push
```

بعد وضع هذه الملفات داخل مجلد `supabase/migrations/` بأسماء تحمل طابعًا زمنيًا (مطلوب من Supabase CLI)، مثل:

```
supabase/migrations/20250101000001_schema.sql
supabase/migrations/20250101000002_rls_policies.sql
supabase/migrations/20250101000003_public_directory_view.sql
supabase/migrations/20250101000004_seed_reference_data.sql
```

## قرارات تصميمية مهمة يجب معرفتها

- **الفصل بين الهوية والعرض العام:** جدول `identities` معزول تمامًا عن `profiles`، ولا تسمح له أي سياسة RLS بالظهور لغير صاحبه أو فريق الإدارة (`reviewer`/`admin`) — تنفيذًا للقسم 14 من الوثيقة.
- **مصدر واحد للخصوصية:** جدول `publication_preferences` هو المكان الوحيد الذي يحدد ما يُعرض للعامة من الهاتف/الواتساب/البريد/الصورة/جهة العمل. لا تعرض `contacts` مباشرة للعامة أبدًا؛ العرض العام يمر حصرًا عبر `directory_public` (القسم 17).
- **حالة "منشور" هي الحارس الوحيد للظهور العام:** أي صف في `profiles`/`professional_profiles` لا يظهر في `directory_public` إلا إذا كانت `app_users.status = 'published'` — يطبّق الفصل بين "الاعتماد" و"النشر" (القسم 19).
- **لا تصعيد صلاحيات ذاتي:** سياسة RLS على `app_users` تمنع أي مستخدم من تغيير دوره (`role`) بنفسه حتى لو استطاع الوصول إلى صف حسابه.
- **سجل العمليات غير قابل للتعديل:** `audit_logs` لا تملك سياسة `update` أو `delete`، فيُرفض أي تعديل أو حذف بها تلقائيًا من قبل RLS (القسم 41).
- **البحث العربي:** فُهرس `profiles.display_name` بامتداد `pg_trgm` لدعم المطابقة الجزئية بدل التطابق الحرفي فقط (القسم 25). يُنصح بتوسيع هذا لاحقًا إلى Full-Text Search عربي مخصص إن زاد حجم البيانات.
- **`admin_reset_password` حساسة عمدًا:** تكتب مباشرة في `auth.users.encrypted_password` عبر `pgcrypto`، متجاوزةً آلية Supabase Auth القياسية (لأنها تعتمد على بريد حقيقي غير متوفر هنا). محمية داخليًا بالتحقق من أن المستدعي `admin` فعلاً، لكنها تبقى نقطة حساسة يجب مراجعتها عند أي تدقيق أمني مستقبلي، وأُنشئت بموافقة صريحة من مالك المشروع (القسم 36).

## آلية تسجيل الدخول برقم الهوية (منفَّذة)

- كل مستخدم يُنشأ له بريد داخلي عشوائي (مثل `<uuid>@users.natsheh-health.internal`) عند التسجيل، يُخزَّن في `identities.auth_email`، ويُستخدم فقط داخل Supabase Auth.
- **لا يُشتق هذا البريد من رقم الهوية نفسه** — لو كان مشتقًا منه لظهر رقم الهوية بصيغة نص صريح داخل `auth.users` وسجلات Supabase، وهذا يخالف القسم 14 (عدم تسجيل رقم الهوية في أي Log عام).
- دالة `public.resolve_login_email(id_number)` هي المسار الوحيد المسموح به لتحويل رقم الهوية المُدخل في شاشة الدخول إلى بريده الداخلي، وهي `security definer` بحيث تعمل حتى قبل تسجيل الدخول (تجاوز RLS لهذا الغرض الضيق فقط)، ولا تُعيد أي حقل آخر من `identities`.

## ما لم يُنفَّذ بعد (يُبنى في طبقة التطبيق وليس في القاعدة)

- منطق مطابقة التكرار التقريبي (الاسم/الهاتف المتشابه) — يُنفَّذ في كود التطبيق عند إنشاء الطلب (القسم 22)، وليس Constraint في القاعدة لأنه تقريبي وليس حتميًا.
- جدولة الحذف/الأرشفة التلقائية حسب مدد الاحتفاظ (القسم 38) — تُنفَّذ عبر Supabase Cron Job أو Edge Function مجدولة.
