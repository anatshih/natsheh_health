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

  const [{ data: profiles }, { data: profs }, { data: countries }, { data: categories }, { data: branches }] =
    await Promise.all([
      filteredIds.length
        ? supabase
            .from('profiles')
            .select(
              'user_id, residence_country_id, family_branch_id, future_contribution_willingness, future_contribution_areas'
            )
            .in('user_id', filteredIds)
        : Promise.resolve({ data: [] as any[] }),
      filteredIds.length
        ? supabase
            .from('professional_profiles')
            .select('user_id, specialty_category_id, qualification, years_experience, workplace_type')
            .in('user_id', filteredIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('countries').select('id, name_ar, iso_code'),
      supabase.from('specialty_categories').select('id, name'),
      supabase.from('family_branches').select('id, name'),
    ]);

  const countryName = Object.fromEntries((countries ?? []).map((c: any) => [c.id, c.name_ar]));
  const palestineId = (countries ?? []).find((c: any) => c.iso_code === 'PS')?.id;
  const categoryName = Object.fromEntries((categories ?? []).map((c: any) => [c.id, c.name]));
  const branchName = Object.fromEntries((branches ?? []).map((b: any) => [b.id, b.name]));

  const byCategory: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byQualification: Record<string, number> = {};
  const byExperience = { under5: 0, mid5to15: 0, over15: 0, unknown: 0 };
  const byFamilyBranch: Record<string, number> = {};
  const byWorkplaceType: Record<string, number> = {};
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

    const bName = p.family_branch_id ? branchName[p.family_branch_id] ?? 'غير محدد' : 'غير محدد';
    byFamilyBranch[bName] = (byFamilyBranch[bName] ?? 0) + 1;
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

    const wName = p.workplace_type?.trim() || 'غير محدد';
    byWorkplaceType[wName] = (byWorkplaceType[wName] ?? 0) + 1;
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
    byFamilyBranch,
    byWorkplaceType,
    countOfRecords: filteredIds.length,
  };
}

export type ReportData = Awaited<ReturnType<typeof loadReportData>>;

// ----------------------------------------------------------------------------
// "التقارير" (بيانات تفصيلية قابلة للتصفية بمعايير متعددة الاختيار)، بخلاف
// "الإحصائيات" أعلاه (أعداد مجمّعة فقط). راجع app/admin/reports/page.tsx.
// ----------------------------------------------------------------------------

export const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
  approved: 'معتمد',
  published: 'منشور',
  needs_update: 'يحتاج تحديثًا',
  suspended: 'موقوف',
  archived: 'مؤرشف',
  rejected: 'مرفوض',
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

export type ReportFilters = {
  statuses: string[];
  branchIds: string[];
  categoryIds: string[];
  countryIds: string[];
};

export type DetailedRecord = {
  userId: string;
  status: string;
  fullName: string;
  idNumber: string;
  branch: string;
  branchId: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebook: string;
  country: string;
  countryId: string;
  city: string;
  category: string;
  categoryId: string;
  specialty: string;
  qualification: string;
  workplaceType: string;
  employer: string;
  workplaceAddress: string;
  yearsExperience: number | null;
};

function byUserId(rows: any[] | null): Record<string, any> {
  return Object.fromEntries((rows ?? []).map((r) => [r.user_id, r]));
}

export async function loadDetailedRecords(filters: ReportFilters): Promise<DetailedRecord[]> {
  const supabase = await createClient();

  const { data: appUsers } = await supabase.from('app_users').select('id, status');
  let rows = appUsers ?? [];
  if (filters.statuses.length) rows = rows.filter((u) => filters.statuses.includes(u.status));
  const ids = rows.map((u) => u.id);
  if (ids.length === 0) return [];

  const [{ data: identities }, { data: contacts }, { data: profiles }, { data: profs }, { data: categories }, { data: specialties }] =
    await Promise.all([
      supabase.from('identities').select('user_id, full_name_legal, id_number').in('user_id', ids),
      supabase.from('contacts').select('user_id, phone, whatsapp, email, facebook').in('user_id', ids),
      supabase
        .from('profiles')
        .select(
          'user_id, family_branch_id, residence_country_id, family_branches(name), countries(name_ar), cities(name_ar)'
        )
        .in('user_id', ids),
      supabase
        .from('professional_profiles')
        .select(
          'user_id, specialty_category_id, specialty_id, qualification, employer, workplace_type, workplace_address, years_experience'
        )
        .in('user_id', ids),
      supabase.from('specialty_categories').select('id, name'),
      supabase.from('specialties').select('id, name'),
    ]);

  const categoryName = Object.fromEntries((categories ?? []).map((c: any) => [c.id, c.name]));
  const specialtyName = Object.fromEntries((specialties ?? []).map((s: any) => [s.id, s.name]));

  const identityMap = byUserId(identities);
  const contactMap = byUserId(contacts);
  const profileMap = byUserId(profiles);
  const profMap = byUserId(profs);
  const statusMap = Object.fromEntries(rows.map((u) => [u.id, u.status]));

  let result: DetailedRecord[] = ids.map((id) => {
    const identity: any = identityMap[id];
    const contact: any = contactMap[id];
    const profile: any = profileMap[id];
    const prof: any = profMap[id];

    return {
      userId: id,
      status: statusMap[id],
      fullName: identity?.full_name_legal ?? '',
      idNumber: identity?.id_number ?? '',
      branch: profile?.family_branches?.name ?? '',
      branchId: profile?.family_branch_id ?? '',
      phone: contact?.phone ?? '',
      whatsapp: contact?.whatsapp ?? '',
      email: contact?.email ?? '',
      facebook: contact?.facebook ?? '',
      country: profile?.countries?.name_ar ?? '',
      countryId: profile?.residence_country_id ?? '',
      city: profile?.cities?.name_ar ?? '',
      category: prof?.specialty_category_id ? categoryName[prof.specialty_category_id] ?? '' : '',
      categoryId: prof?.specialty_category_id ?? '',
      specialty: prof?.specialty_id ? specialtyName[prof.specialty_id] ?? '' : '',
      qualification: prof?.qualification ?? '',
      workplaceType: prof?.workplace_type ?? '',
      employer: prof?.employer ?? '',
      workplaceAddress: prof?.workplace_address ?? '',
      yearsExperience: prof?.years_experience ?? null,
    };
  });

  if (filters.branchIds.length) result = result.filter((r) => filters.branchIds.includes(r.branchId));
  if (filters.countryIds.length) result = result.filter((r) => filters.countryIds.includes(r.countryId));
  if (filters.categoryIds.length) result = result.filter((r) => filters.categoryIds.includes(r.categoryId));

  return result;
}

export function parseReportFilters(searchParams: Record<string, string | string[] | undefined>): ReportFilters {
  const asArray = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
  return {
    statuses: asArray(searchParams.status),
    branchIds: asArray(searchParams.branch),
    categoryIds: asArray(searchParams.category),
    countryIds: asArray(searchParams.country),
  };
}
