import Link from 'next/link';

type Tab = { key: string; href: string; label: string };

// تبويب علوي مشترك — كان مكرَّرًا حرفيًا بين AdminSectionTabs وSettingsTabs
// بنفس الأنماط بالضبط، يختلف فقط عدد التبويبات ومساراتها.
export default function TabBar({ tabs, active }: { tabs: Tab[]; active: string }) {
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
