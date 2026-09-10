import TabBar from './TabBar';

// تبويب علوي داخل "ثوابت النظام" — يجمع التخصصات والفروع والدول/المدن تحت
// عنصر واحد في الشريط العلوي (كانت ثلاثة روابط منفصلة ومزدحمة).
export default function SettingsTabs({ active }: { active: 'specialties' | 'branches' | 'locations' }) {
  return (
    <TabBar
      active={active}
      tabs={[
        { key: 'specialties', href: '/admin/settings/specialties', label: 'التخصصات' },
        { key: 'branches', href: '/admin/settings/branches', label: 'الفروع' },
        { key: 'locations', href: '/admin/settings/locations', label: 'الدول والمدن' },
      ]}
    />
  );
}
