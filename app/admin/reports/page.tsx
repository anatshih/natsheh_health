import { createClient } from '@/lib/supabase/server';
import { loadDetailedRecords, parseReportFilters, STATUS_LABELS, ALL_STATUSES } from '@/lib/reports';
import AdminSectionTabs from '@/components/AdminSectionTabs';

// "التقارير" — بيانات تفصيلية كاملة لكل شخص (بخلاف "الإحصائيات" المجمّعة)،
// قابلة للتصفية بمعايير متعددة الاختيار (الحالة، الفرع، المجال، الدولة)
// وتصدير النتيجة المصفّاة كما تظهر كملف CSV (القسم 32).
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseReportFilters(sp);

  const supabase = await createClient();
  const [{ data: branches }, { data: categories }, { data: countries }, records] = await Promise.all([
    supabase.from('family_branches').select('id, name').order('name'),
    supabase.from('specialty_categories').select('id, name').order('name'),
    supabase.from('countries').select('id, name_ar').order('name_ar'),
    loadDetailedRecords(filters),
  ]);

  const exportQuery = buildQueryString(filters);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminSectionTabs active="reports" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">التقارير</h2>
        <a
          href={`/admin/reports/export${exportQuery}`}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          تصدير CSV ({records.length} سجلًا)
        </a>
      </div>

      <form method="GET" className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-4">
          <FilterGroup
            title="الحالة"
            name="status"
            options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            selected={filters.statuses}
          />
          <FilterGroup
            title="الفرع العائلي"
            name="branch"
            options={(branches ?? []).map((b: any) => ({ value: b.id, label: b.name }))}
            selected={filters.branchIds}
          />
          <FilterGroup
            title="المجال الصحي"
            name="category"
            options={(categories ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            selected={filters.categoryIds}
          />
          <FilterGroup
            title="الدولة"
            name="country"
            options={(countries ?? []).map((c: any) => ({ value: c.id, label: c.name_ar }))}
            selected={filters.countryIds}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            تطبيق الفلاتر
          </button>
          <a
            href="/admin/reports"
            className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
          >
            مسح الفلاتر
          </a>
        </div>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        النتيجة: <strong>{records.length}</strong> سجلًا مطابقًا للفلاتر المحددة.
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-right text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <Th>الاسم</Th>
              <Th>رقم الهوية</Th>
              <Th>الفرع العائلي</Th>
              <Th>الهاتف</Th>
              <Th>الواتساب</Th>
              <Th>البريد الإلكتروني</Th>
              <Th>الدولة</Th>
              <Th>المدينة</Th>
              <Th>المجال الصحي</Th>
              <Th>التخصص</Th>
              <Th>المؤهل</Th>
              <Th>جهة العمل</Th>
              <Th>سنوات الخبرة</Th>
              <Th>الاستعداد للمساهمة المستقبلية</Th>
              <Th>مجالات المساهمة</Th>
              <Th>الحالة</Th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={16} className="p-6 text-center text-slate-400">
                  لا توجد سجلات مطابقة للفلاتر المحددة.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.userId} className="border-t border-slate-100">
                  <Td>{r.fullName}</Td>
                  <Td>{r.idNumber}</Td>
                  <Td>{r.branch}</Td>
                  <Td>{r.phone}</Td>
                  <Td>{r.whatsapp}</Td>
                  <Td>{r.email}</Td>
                  <Td>{r.country}</Td>
                  <Td>{r.city}</Td>
                  <Td>{r.category}</Td>
                  <Td>{r.specialty}</Td>
                  <Td>{r.qualification}</Td>
                  <Td>{r.employer}</Td>
                  <Td>{r.yearsExperience ?? ''}</Td>
                  <Td>{r.contributionWillingness}</Td>
                  <Td>{r.contributionAreas}</Td>
                  <Td>{STATUS_LABELS[r.status] ?? r.status}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildQueryString(filters: {
  statuses: string[];
  branchIds: string[];
  categoryIds: string[];
  countryIds: string[];
}): string {
  const params = new URLSearchParams();
  filters.statuses.forEach((s) => params.append('status', s));
  filters.branchIds.forEach((s) => params.append('branch', s));
  filters.categoryIds.forEach((s) => params.append('category', s));
  filters.countryIds.forEach((s) => params.append('country', s));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function FilterGroup({
  title,
  name,
  options,
  selected,
}: {
  title: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
        {options.length === 0 ? (
          <p className="text-xs text-slate-400">لا توجد خيارات.</p>
        ) : (
          options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                name={name}
                value={o.value}
                defaultChecked={selected.includes(o.value)}
                className="rounded border-slate-300"
              />
              {o.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2.5 font-bold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-2 text-slate-700">{children}</td>;
}
