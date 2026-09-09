import Link from 'next/link';
import { loadReportData, SCOPE_LABELS, type ReportScope } from '@/lib/reports';
import AdminSectionTabs from '@/components/AdminSectionTabs';

const SCOPES: ReportScope[] = ['all', 'approved', 'published'];

// لوحة "الإحصائيات" — عرض مجمّع وجذاب لكل التوزيعات (القسم 30)، منفصلة عن
// "التقارير" التفصيلية القابلة للتصفية (app/admin/reports).
export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const sp = await searchParams;
  const scope: ReportScope = (['all', 'approved', 'published'] as string[]).includes(sp.scope ?? '')
    ? (sp.scope as ReportScope)
    : 'all';

  const data = await loadReportData(scope);

  return (
    <div className="mx-auto max-w-5xl">
      <AdminSectionTabs active="statistics" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">الإحصائيات</h2>
        <a
          href={`/admin/statistics/export?scope=${scope}`}
          className="rounded-lg border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-soft"
        >
          تنزيل الإحصائيات (CSV)
        </a>
      </div>

      <div className="mt-3 flex gap-2 text-xs font-semibold">
        {SCOPES.map((s) => (
          <Link
            key={s}
            href={`/admin/statistics?scope=${s}`}
            className={`rounded-full px-3 py-1.5 ${
              scope === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {SCOPE_LABELS[s]}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        التوزيعات أدناه تعكس نطاق: <strong>{SCOPE_LABELS[scope]}</strong> ({data.countOfRecords} سجلًا)
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="إجمالي المسجلين" value={data.overview.total} accent="border-slate-400" />
        <StatCard label="بانتظار المراجعة" value={data.overview.pending} accent="border-amber-400" />
        <StatCard label="معتمد" value={data.overview.approved} accent="border-sky-400" />
        <StatCard label="منشور" value={data.overview.published} accent="border-emerald-400" />
        <StatCard label="مرفوض" value={data.overview.rejected} accent="border-rose-400" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <BarPanel title="التوزيع حسب المجال الصحي" data={data.byCategory} />
        <BarPanel
          title="التوزيع الجغرافي حسب الدولة"
          data={data.byCountry}
          footer={`داخل فلسطين: ${data.insidePalestine} · خارج فلسطين: ${data.outsidePalestine}`}
        />
        <BarPanel title="التوزيع حسب المؤهل العلمي" data={data.byQualification} />
        <BarPanel
          title="التوزيع حسب سنوات الخبرة"
          data={{
            'أقل من 5 سنوات': data.byExperience.under5,
            '5 – 15 سنة': data.byExperience.mid5to15,
            'أكثر من 15 سنة': data.byExperience.over15,
            'غير محدد': data.byExperience.unknown,
          }}
        />
        <BarPanel title="التوزيع حسب الفرع العائلي" data={data.byFamilyBranch} />
        <BarPanel title="التوزيع حسب نوع مكان العمل" data={data.byWorkplaceType} />
        <BarPanel title="المتاحون للمساهمة الصحية المستقبلية" data={data.byContributionWillingness} />
        <BarPanel title="مجالات المساهمة الأكثر طلبًا" data={data.byContributionArea} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-xl border-r-4 ${accent} border-y border-l border-slate-200 bg-white p-4 text-center`}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function BarPanel({
  title,
  data,
  footer,
}: {
  title: string;
  data: Record<string, number>;
  footer?: string;
}) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, v]) => v));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">لا توجد بيانات ضمن هذا النطاق.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map(([label, count]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="font-bold text-primary">{count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {footer && <p className="mt-3 text-xs text-slate-500">{footer}</p>}
    </div>
  );
}
