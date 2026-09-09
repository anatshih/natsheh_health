import { createClient } from '@/lib/supabase/server';

// إحصاءات مجمّعة من الدليل العام فقط (directory_public) — لا تكشف أي بيانات
// شخصية، مناسبة للعرض العام (القسم 31) ولشريط الإحصاءات في صفحة الدليل.
export async function loadDirectoryStats() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('directory_public')
    .select('specialty, residence_country');

  const totalCount = rows?.length ?? 0;
  const countryCount = new Set((rows ?? []).map((r) => r.residence_country).filter(Boolean)).size;

  const specialtyCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  let insideCount = 0;

  for (const r of rows ?? []) {
    if (r.specialty) {
      specialtyCounts.set(r.specialty, (specialtyCounts.get(r.specialty) ?? 0) + 1);
    }
    if (r.residence_country) {
      countryCounts.set(r.residence_country, (countryCounts.get(r.residence_country) ?? 0) + 1);
      if (r.residence_country === 'فلسطين') insideCount++;
    }
  }

  return {
    totalCount,
    countryCount,
    specialtyCount: specialtyCounts.size,
    insideCount,
    outsideCount: totalCount - insideCount,
    topSpecialties: [...specialtyCounts.entries()].sort((a, b) => b[1] - a[1]),
    topCountries: [...countryCounts.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export type DirectoryStats = Awaited<ReturnType<typeof loadDirectoryStats>>;
