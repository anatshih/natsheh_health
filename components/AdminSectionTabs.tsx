import Link from 'next/link';

// تبويب علوي يفصل بصريًا بين "الإحصائيات" (لوحة مؤشرات مجمّعة) و"التقارير"
// (بيانات تفصيلية قابلة للتصفية والتصدير) — بناءً على طلب الفصل بين القسمين.
export default function AdminSectionTabs({ active }: { active: 'statistics' | 'reports' }) {
  const tabs = [
    { key: 'statistics', href: '/admin/statistics', label: 'الإحصائيات' },
    { key: 'reports', href: '/admin/reports', label: 'التقارير' },
  ] as const;

  return (
    <div className="mb-6 flex gap-2 border-b border-slate-200">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
            active === t.key
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-primary'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
