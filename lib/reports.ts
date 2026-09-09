import { createClient } from '@/lib/supabase/server';

export type ReportScope = 'all' | 'approved' | 'published';

const SCOPE_STATUSES: Record<ReportScope, string[] | null> = {
  all: null,
  approved: ['approved', 'published'],
  published: ['published'],
};

const PENDING_STATUSES = ['submitted', 'in_review', 'needs_completion'];

export const SCOPE_LABELS: Record<ReportScope, string> = {
  all: 'كل السجلات',
  approved: 'المعتمد فقط',
  published: 'المنشور فقط',
};

// يجمّع بيانات التقارير (القسم 30). البطاقات العلوية تعكس كل السجلات دائمًا؛
// نطاق "scope" يُطبَّق فقط على الجداول التفصيلية أدناه (مطابقة القسم 56).
export async function loadReportData(scope: ReportScope) {
  const supabase = await createClient();

  const { data: allAppUsers } = await supabase.from('app_users').select('id, status');
  const rows = allAppUsers ?? [];

  const overview = {
    total: rows.length,
    pending: rows.filter((u) => PENDING_STATUSES.includes(u.status)).length,
    approved: rows.filter((u) => u.status === 'approved').length,
    published: rows.filter((u) => u.status === 'published').length,
    rejected: rows.filter((u) => u.status === 'rejected').length,
  };

  const statuses = SCOPE_STATUSES[scope];
  const filteredIds = (statuses ? rows.filter((u) => statuses.includes(u.status)) : rows).map((u) => u.id);
  const idSet = new Set(filteredIds);

  const [{ data: profiles }, { data: profs }, { data: countries }, { data: categories }] = await Promise.all([
    filteredIds.length
      ? supabase
          .from('profiles')
          .select('user_id, residence_country_id, future_contribution_willingness, future_contribution_areas')
          .in('user_id', filteredIds)
      : Promise.resolve({ data: [] as any[] }),
    filteredIds.length
      ? supabase
          .from('professional_profiles')
          .select('user_id, specialty_category_id, qualification, years_experience')
          .in('user_id', filteredIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('countries').select('id, name_ar, iso_code'),
    supabase.from('specialty_categories').select('id, name'),
  ]);

  const countryName = Object.fromEntries((countries ?? []).map((c: any) => [c.id, c.name_ar]));
  const palestineId = (countries ?? []).find((c: any) => c.iso_code === 'PS')?.id;
  const categoryName = Object.fromEntries((categories ?? []).map((c: any) => [c.id, c.name]));

  const byCategory: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byQualification: Record<string, number> = {};
  const byExperience = { under5: 0, mid5to15: 0, over15: 0, unknown: 0 };
  let insidePalestine = 0;
  let outsidePalestine = 0;

  const WILLINGNESS_LABELS: Record<string, string> = {
    yes: 'نعم',
    depends: 'حسب طبيعة النشاط',
    not_available: 'غير متاح حاليًا',
  };
  const byContributionWillingness: Record<string, number> = {};
  const byContributionArea: Record<string, number> = {};

  for (const p of profiles ?? []) {
    if (!idSet.has(p.user_id)) continue;
    const cName = p.residence_country_id ? countryName[p.residence_country_id] ?? 'غير محدد' : 'غير محدد';
    byCountry[cName] = (byCountry[cName] ?? 0) + 1;
    if (p.residence_country_id && palestineId && p.residence_country_id === palestineId) insidePalestine++;
    else if (p.residence_country_id) outsidePalestine++;

    const willingnessKey = p.future_contribution_willingness
      ? WILLINGNESS_LABELS[p.future_contribution_willingness] ?? 'غير محدد'
      : 'غير محدد';
    byContributionWillingness[willingnessKey] = (byContributionWillingness[willingnessKey] ?? 0) + 1;

    for (const area of p.future_contribution_areas ?? []) {
      byContributionArea[area] = (byContributionArea[area] ?? 0) + 1;
    }
  }

  for (const p of profs ?? []) {
    if (!idSet.has(p.user_id)) continue;
    const catName = p.specialty_category_id ? categoryName[p.specialty_category_id] ?? 'غير محدد' : 'غير محدد';
    byCategory[catName] = (byCategory[catName] ?? 0) + 1;

    const qName = p.qualification?.trim() || 'غير محدد';
    byQualification[qName] = (byQualification[qName] ?? 0) + 1;

    if (p.years_experience == null) byExperience.unknown++;
    else if (p.years_experience < 5) byExperience.under5++;
    else if (p.years_experience <= 15) byExperience.mid5to15++;
    else byExperience.over15++;
  }

  return {
    scope,
    overview,
    byCategory,
    byCountry,
    insidePalestine,
    outsidePalestine,
    byQualification,
    byExperience,
    byContributionWillingness,
    byContributionArea,
    countOfRecords: filteredIds.length,
  };
}

export type ReportData = Awaited<ReturnType<typeof loadReportData>>;
