import Link from 'next/link';
import { loadDirectoryStats } from '@/lib/directoryStats';
import AnimatedNumber from '@/components/AnimatedNumber';

// صفحة عامة تعرض إحصاءات مجمّعة فقط دون أي بيانات شخصية (القسم 31 من الوثيقة).
export default async function StatsPage() {
  const stats = await loadDirectoryStats();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-semibold text-primary">مجلس عائلة النتشة — الخليل، فلسطين</p>
        <h1 className="mb-3 text-3xl font-extrabold">الكفاءات الصحية بالأرقام</h1>
        <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600">
          نظرة عامة على الكفاءات الصحية المعتمدة والمنشورة من أبناء وبنات عائلة النتشة
          في الوطن والمهجر. لا تعرض هذه الصفحة أي بيانات شخصية.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BigStat value={stats.totalCount} label="كفاءة موثّقة" />
        <BigStat value={stats.specialtyCount} label="تخصصًا صحيًا" />
        <BigStat value={stats.countryCount} label="دولة" />
        <BigStat value={stats.outsideCount} label="خارج فلسطين" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="التوزيع حسب التخصص">
          <BarList items={stats.topSpecialties} total={stats.totalCount} />
        </Section>

        <Section title="التوزيع الجغرافي">
          <BarList items={stats.topCountries} total={stats.totalCount} />
          <p className="mt-4 text-xs text-slate-500">
            داخل فلسطين: <strong className="text-slate-700">{stats.insideCount}</strong> · خارج
            فلسطين: <strong className="text-slate-700">{stats.outsideCount}</strong>
          </p>
        </Section>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/directory"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          تصفّح دليل الكفاءات
        </Link>
      </div>
    </main>
  );
}

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white py-6 text-center">
      <p className="font-heading text-3xl font-extrabold text-primary">
        <AnimatedNumber value={value} />
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-bold text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function BarList({ items, total }: { items: [string, number][]; total: number }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400">لا توجد بيانات كافية بعد.</p>;
  }
  const max = items[0][1];
  return (
    <div className="space-y-3">
      {items.slice(0, 8).map(([label, count]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-slate-700">{label}</span>
            <span className="text-slate-500">
              {count} {total > 0 && `(${Math.round((count / total) * 100)}%)`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max((count / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
