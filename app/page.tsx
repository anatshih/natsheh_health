import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-semibold text-primary">
        مجلس عائلة النتشة — الخليل، فلسطين
      </p>
      <h1 className="text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
        دليل الكفاءات الصحية لعائلة النتشة
      </h1>
      <p className="max-w-2xl text-base leading-8 text-slate-600">
        منصة إلكترونية لحصر وتوثيق وتنظيم وعرض الكفاءات الصحية من أبناء وبنات
        العائلة في الوطن والمهجر، وبناء قاعدة بيانات موثوقة يمكن الاستفادة
        منها في البحث والإحصاءات والتقارير.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/directory"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          استعرض الدليل
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          طلب انضمام
        </Link>
      </div>
    </main>
  );
}
