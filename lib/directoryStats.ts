import { createClient } from '@/lib/supabase/server';

export const NEW_WINDOW_DAYS = 30;

const RECENT_COLUMNS =
  'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, last_updated_at';

// من انضم/تحدّث خلال آخر NEW_WINDOW_DAYS يومًا — يُستخدم في صندوق "انضموا
// حديثًا" (بحد أقصى limit) وفي صفحة "/directory/recent" (بلا حد، limit
// غير مُمرَّر). totalCount يحدّد إظهار رابط "المزيد" في الصندوق المصغَّر.
export async function loadRecentlyJoined(limit?: number) {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('directory_public')
    .select(RECENT_COLUMNS, { count: 'exact' })
    .gte('last_updated_at', cutoff)
    .order('last_updated_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, count } = await query;
  return { people: data ?? [], totalCount: count ?? 0 };
}

export type RecentPerson = Awaited<ReturnType<typeof loadRecentlyJoined>>['people'][number];

export type ActiveDirectoryFilters = {
  category?: string[];
  specialty?: string[];
  country?: string[];
  city?: string[];
};

type StatsRow = {
  specialty: string | null;
  specialty_category: string | null;
  residence_country: string | null;
  residence_city: string | null;
};

// فلترة متتالية (cascading): يحسب توزيع "field" فقط من السجلات المطابقة
// لبقية الفلاتر المفعّلة حاليًا (باستثناء فلتر "field" نفسه) — بحيث تعكس
// خيارات وأعداد كل مجموعة تصفية أثر بقية المجموعات المختارة، لا الإجمالي
// العام دائمًا.
function countByExcluding(
  rows: StatsRow[],
  field: keyof StatsRow,
  filters: ActiveDirectoryFilters,
  excludeKey: keyof ActiveDirectoryFilters
): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (excludeKey !== 'category' && filters.category?.length && !filters.category.includes(r.specialty_category ?? ''))
      continue;
    if (excludeKey !== 'specialty' && filters.specialty?.length && !filters.specialty.includes(r.specialty ?? ''))
      continue;
    if (excludeKey !== 'country' && filters.country?.length && !filters.country.includes(r.residence_country ?? ''))
      continue;
    if (excludeKey !== 'city' && filters.city?.length && !filters.city.includes(r.residence_city ?? '')) continue;

    const value = r[field];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// إحصاءات مجمّعة من الدليل العام فقط (directory_public) — لا تكشف أي بيانات
// شخصية، مناسبة للعرض العام (القسم 31) ولشريط الإحصاءات في صفحة الدليل.
// الأرقام الإجمالية (totalCount وما شابه) تبقى عامة دائمًا بصرف النظر عن
// activeFilters — فقط قوائم التصفية (topCategories وما شابه) تتفاعل معها.
export async function loadDirectoryStats(activeFilters: ActiveDirectoryFilters = {}) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('directory_public')
    .select('specialty, specialty_category, residence_country, residence_city');

  const allRows = rows ?? [];
  const totalCount = allRows.length;
  const countryCount = new Set(allRows.map((r) => r.residence_country).filter(Boolean)).size;
  const specialtyCount = new Set(allRows.map((r) => r.specialty).filter(Boolean)).size;
  const insideCount = allRows.filter((r) => r.residence_country === 'فلسطين').length;

  return {
    totalCount,
    countryCount,
    specialtyCount,
    insideCount,
    outsideCount: totalCount - insideCount,
    topSpecialties: countByExcluding(allRows, 'specialty', activeFilters, 'specialty'),
    topCategories: countByExcluding(allRows, 'specialty_category', activeFilters, 'category'),
    topCountries: countByExcluding(allRows, 'residence_country', activeFilters, 'country'),
    topCities: countByExcluding(allRows, 'residence_city', activeFilters, 'city'),
  };
}

export type DirectoryStats = Awaited<ReturnType<typeof loadDirectoryStats>>;
