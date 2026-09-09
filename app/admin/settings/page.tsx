import { redirect } from 'next/navigation';

// "ثوابت النظام" تجمع التخصصات والفروع والدول/المدن تحت رابط واحد بالشريط
// العلوي؛ الدخول المباشر لهذا المسار يوجَّه لأول تبويب (التخصصات).
export default function SettingsIndexPage() {
  redirect('/admin/settings/specialties');
}
