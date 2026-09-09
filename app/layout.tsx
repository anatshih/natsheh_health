import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['600', '700', '800'],
  variable: '--font-cairo',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
});

// metadataBase ضروري لبناء روابط Open Graph مطلقة صحيحة (og:url، og:image) لكل
// صفحة على حدة — بدونه تعتمد بعض منصات المشاركة (مثل فيسبوك) على الرابط
// الرئيسي للنطاق بدل الرابط الفرعي الفعلي المشارَك (صفحة الطبيب مثلًا).
export const metadata: Metadata = {
  metadataBase: new URL('https://natsheh-health.vercel.app'),
  title: 'دليل الكفاءات الصحية لعائلة النتشة',
  description:
    'منصة إلكترونية يشرف عليها مجلس عائلة النتشة – الخليل، فلسطين، لحصر وتوثيق وعرض الكفاءات الصحية من أبناء وبنات العائلة في الوطن والمهجر.',
  openGraph: {
    title: 'دليل الكفاءات الصحية لعائلة النتشة',
    description:
      'منصة إلكترونية يشرف عليها مجلس عائلة النتشة – الخليل، فلسطين، لحصر وتوثيق وعرض الكفاءات الصحية من أبناء وبنات العائلة في الوطن والمهجر.',
    url: '/',
    images: [{ url: '/logo.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${plexArabic.variable}`}>
      <body className="min-h-screen bg-slate-50 font-body text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
