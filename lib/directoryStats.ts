import { createClient } from '@/lib/supabase/server';

// إحصاءات مجمّعة من الدليل العام فقط (directory_public) — لا تكشف أي بيانات
// شخصية، مناسبة للعرض العام (القسم 31) ولشريط الإحصاءات في صفحة الدليل.
export async function loadDirectoryStats() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('directory_public')
    .select('specialty, specialty_category, residence_country, years_experience');

  const totalCount = rows?.length ?? 0;
  const countryCount = new Set((rows ?? []).map((r) => r.residence_country).filter(Boolean)).size;

  const specialtyCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const experienceBuckets = { under5: 0, mid5to15: 0, over15: 0 };
  let insideCount = 0;

  for (const r of rows ?? []) {
    if (r.specialty) {
      specialtyCounts.set(r.specialty, (specialtyCounts.get(r.specialty) ?? 0) + 1);
    }
    if (r.specialty_category) {
      categoryCounts.set(r.specialty_category, (categoryCounts.get(r.specialty_category) ?? 0) + 1);
    }
    if (r.residence_country) {
      countryCounts.set(r.residence_country, (countryCounts.get(r.residence_country) ?? 0) + 1);
      if (r.residence_country === 'فلسطين') insideCount++;
    }
    if (r.years_experience != null) {
      if (r.years_experience < 5) experienceBuckets.under5++;
      else if (r.years_experience <= 15) experienceBuckets.mid5to15++;
      else experienceBuckets.over15++;
    }
  }

  return {
    totalCount,
    countryCount,
    specialtyCount: specialtyCounts.size,
    insideCount,
    outsideCount: totalCount - insideCount,
    topSpecialties: [...specialtyCounts.entries()].sort((a, b) => b[1] - a[1]),
    topCategories: [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]),
    topCountries: [...countryCounts.entries()].sort((a, b) => b[1] - a[1]),
    experienceBuckets,
  };
}

export type DirectoryStats = Awaited<ReturnType<typeof loadDirectoryStats>>;
