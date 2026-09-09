import Link from 'next/link';
import { loadReportData, SCOPE_LABELS, type ReportScope } from '@/lib/reports';

const SCOPES: ReportScope[] = ['all', 'approved', 'published'];

export default async function ReportsPage({
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">التقارير والإحصاءات</h2>
        <div className="flex gap-2">
          <a
            href={`/admin/reports/export?format=csv&scope=${scope}`}
            className="rounded-lg border border-primary px-4 py-2 text-xs font-semibold text-primary"
          >
            تصدير CSV
          </a>
          <Link
            href={`/admin/reports/print?scope=${scope}`}
            target="_blank"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
          >
            تصدير PDF (طباعة)
          </Link>
        </div>
      </div>

      <div className="flex gap-2 text-xs font-semibold">
        {SCOPES.map((s) => (
          <Link
            key={s}
            href={`/admin/reports?scope=${s}`}
            className={`rounded-full px-3 py-1.5 ${
              scope === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {SCOPE_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="إجمالي المسجلين" value={data.overview.total} />
        <StatTile label="بانتظار المراجعة" value={data.overview.pending} />
        <StatTile label="معتمد" value={data.overview.approved} />
        <StatTile label="منشور" value={data.overview.published} />
        <StatTile label="مرفوض" value={data.overview.rejected} />
      </div>

      <p className="text-xs text-slate-500">
        الجداول التالية تعكس نطاق: <strong>{SCOPE_LABELS[scope]}</strong> ({data.countOfRecords} سجلًا)
      </p>

      <ReportTable
        title="التوزيع حسب المجال الصحي"
        rows={Object.entries(data.byCategory).sort((a, b) => b[1] - a[1])}
      />

      <ReportTable
        title="التوزيع الجغرافي حسب الدولة"
        rows={Object.entries(data.byCountry).sort((a, b) => b[1] - a[1])}
        footer={`داخل فلسطين: ${data.insidePalestine} · خارج فلسطين: ${data.outsidePalestine}`}
      />

      <ReportTable
        title="التوزيع حسب المؤهل العلمي"
        rows={Object.entries(data.byQualification).sort((a, b) => b[1] - a[1])}
      />

      <ReportTable
        title="التوزيع حسب سنوات الخبرة"
        rows={[
          ['أقل من 5 سنوات', data.byExperience.under5],
          ['5 – 15 سنة', data.byExperience.mid5to15],
          ['أكثر من 15 سنة', data.byExperience.over15],
          ['غير محدد', data.byExperience.unknown],
        ]}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

function ReportTable({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: [string, number][];
  footer?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">لا توجد بيانات ضمن هذا النطاق.</p>
      ) : (
        <div className="space-y-1">
          {rows.map(([label, count]) => (
            <div key={label} className="flex justify-between border-b border-slate-50 py-1.5 text-sm last:border-0">
              <span>{label}</span>
              <span className="font-semibold text-primary">{count}</span>
            </div>
          ))}
        </div>
      )}
      {footer && <p className="mt-3 text-xs text-slate-500">{footer}</p>}
    </div>
  );
}
