import TabBar from './TabBar';

// تبويب علوي يفصل بصريًا بين "الإحصائيات" (لوحة مؤشرات مجمّعة) و"التقارير"
// (بيانات تفصيلية قابلة للتصفية والتصدير) — بناءً على طلب الفصل بين القسمين.
export default function AdminSectionTabs({ active }: { active: 'statistics' | 'reports' }) {
  return (
    <TabBar
      active={active}
      tabs={[
        { key: 'statistics', href: '/admin/statistics', label: 'الإحصائيات' },
        { key: 'reports', href: '/admin/reports', label: 'التقارير' },
      ]}
    />
  );
}
