import { loadReportData, SCOPE_LABELS, type ReportScope } from '@/lib/reports';
import PrintButton from '@/components/PrintButton';

// نسخة قابلة للطباعة/الحفظ كـ PDF عبر مربع طباعة المتصفح (بدون مكتبة PDF إضافية).
// شريط تنقّل لوحة الإدارة (من app/admin/layout.tsx) مخفي عند الطباعة عبر print:hidden.
export default async function ReportsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const sp = await searchParams;
  const scope: ReportScope = (['all', 'approved', 'published'] as string[]).includes(sp.scope ?? '')
    ? (sp.scope as ReportScope)
    : 'all';

  const data = await loadReportData(scope);
  const today = new Date().toLocaleDateString('ar');

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-slate-900">
      <div className="mb-6 flex justify-end">
        <PrintButton />
      </div>

      <h1 className="mb-1 text-xl font-extrabold">تقرير الكفاءات الصحية لعائلة النتشة</h1>
      <p className="mb-6 text-xs text-slate-500">
        النطاق: {SCOPE_LABELS[scope]} — تاريخ التقرير: {today}
      </p>

      <SimpleTable
        rows={[
          ['إجمالي المسجلين', data.overview.total],
          ['بانتظار المراجعة', data.overview.pending],
          ['معتمد', data.overview.approved],
          ['منشور', data.overview.published],
          ['مرفوض', data.overview.rejected],
        ]}
      />

      <Section title="التوزيع حسب المجال الصحي" rows={Object.entries(data.byCategory)} />
      <Section title="التوزيع الجغرافي حسب الدولة" rows={Object.entries(data.byCountry)} />
      <p className="-mt-4 mb-6 text-xs text-slate-500">
        داخل فلسطين: {data.insidePalestine} · خارج فلسطين: {data.outsidePalestine}
      </p>
      <Section title="التوزيع حسب المؤهل العلمي" rows={Object.entries(data.byQualification)} />
      <Section
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

function SimpleTable({ rows }: { rows: [string, number][] }) {
  return (
    <table className="mb-6 w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="border border-slate-200 px-3 py-1.5">{label}</td>
            <td className="border border-slate-200 px-3 py-1.5 font-bold">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, rows }: { title: string; rows: [string, number][] }) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      {sorted.length === 0 ? (
        <p className="mb-6 text-xs text-slate-400">لا توجد بيانات</p>
      ) : (
        <SimpleTable rows={sorted} />
      )}
    </>
  );
}
