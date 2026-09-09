-- ============================================================================
-- بيانات مرجعية أولية — قابلة للتعديل لاحقًا من لوحة الإدارة دون تعديل الكود
-- (القسم 7، 53، 54 من الوثيقة). هذه بيانات بذرة (Seed) للانطلاق فقط.
-- ============================================================================

-- الفروع العائلية — أمثلة، يجب استبدالها بالأفخاذ الفعلية لعائلة النتشة
insert into public.family_branches (name) values
  ('فخذ 1'), ('فخذ 2'), ('فخذ 3');

-- الدول
insert into public.countries (name_ar, name_en, iso_code) values
  ('فلسطين', 'Palestine', 'PS'),
  ('الأردن', 'Jordan', 'JO'),
  ('الإمارات', 'United Arab Emirates', 'AE'),
  ('السعودية', 'Saudi Arabia', 'SA'),
  ('ألمانيا', 'Germany', 'DE'),
  ('الولايات المتحدة', 'United States', 'US'),
  ('كندا', 'Canada', 'CA'),
  ('قطر', 'Qatar', 'QA');

-- مدن (أمثلة لفلسطين والأردن)
insert into public.cities (country_id, name_ar)
select id, city_name from public.countries, unnest(array['الخليل','رام الله','القدس','نابلس','بيت لحم','غزة']) as city_name
where iso_code = 'PS';

insert into public.cities (country_id, name_ar)
select id, city_name from public.countries, unnest(array['عمّان','الزرقاء','إربد']) as city_name
where iso_code = 'JO';

-- المجالات الصحية الرئيسية (القسم 7)
insert into public.specialty_categories (name, sort_order) values
  ('الطب البشري', 1),
  ('طب الأسنان', 2),
  ('الصيدلة', 3),
  ('التمريض', 4),
  ('القبالة', 5),
  ('المختبرات الطبية', 6),
  ('الأشعة والتصوير الطبي', 7),
  ('العلاج الطبيعي', 8),
  ('العلاج الوظيفي', 9),
  ('التغذية', 10),
  ('الصحة العامة', 11),
  ('الصحة النفسية', 12),
  ('التأهيل', 13),
  ('الإسعاف والطوارئ', 14),
  ('الإدارة الصحية', 15),
  ('المعلوماتية الصحية', 16),
  ('الأجهزة والمعدات الطبية', 17),
  ('التأمين الصحي', 18);

-- أمثلة تخصصات رئيسية ضمن "الطب البشري"
insert into public.specialties (category_id, name, sort_order)
select id, spec_name, row_number() over ()
from public.specialty_categories,
     unnest(array['الطب الباطني','طب الأطفال','الجراحة العامة','أمراض النساء والتوليد','طب الأسرة']) as spec_name
where name = 'الطب البشري';

-- مثال تخصص دقيق تابع لـ "الطب الباطني"
insert into public.specialties (category_id, parent_id, name)
select c.id, s.id, 'أمراض القلب'
from public.specialty_categories c
join public.specialties s on s.category_id = c.id and s.name = 'الطب الباطني'
where c.name = 'الطب البشري';
