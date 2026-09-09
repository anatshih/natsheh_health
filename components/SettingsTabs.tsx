import Link from 'next/link';

// تبويب علوي داخل "ثوابت النظام" — يجمع التخصصات والفروع والدول/المدن تحت
// عنصر واحد في الشريط العلوي (كانت ثلاثة روابط منفصلة ومزدحمة).
export default function SettingsTabs({ active }: { active: 'specialties' | 'branches' | 'locations' }) {
  const tabs = [
    { key: 'specialties', href: '/admin/settings/specialties', label: 'التخصصات' },
    { key: 'branches', href: '/admin/settings/branches', label: 'الفروع' },
    { key: 'locations', href: '/admin/settings/locations', label: 'الدول والمدن' },
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
