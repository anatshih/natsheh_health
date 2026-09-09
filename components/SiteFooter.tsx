import Link from 'next/link';

// تذييل احترافي متعدد الأعمدة (نمط شائع في المواقع العالمية): عمود هوية
// وتواصل، وعمود روابط سريعة، وعمود حساب وخصوصية، مع شريط سفلي لحقوق النشر.
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 text-center sm:grid-cols-3 sm:text-right">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-9 w-auto" />
              <span className="text-sm font-bold text-slate-800">دليل الكفاءات الصحية</span>
            </div>
            <p className="max-w-xs text-xs leading-6 text-slate-500">
              منصة إلكترونية يشرف عليها مجلس عائلة النتشة لحصر وتوثيق وعرض الكفاءات
              الصحية من أبناء وبنات العائلة في الوطن والمهجر.
            </p>
            <a
              href="https://www.facebook.com/natshehcouncil"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="صفحة المجلس العائلي على فيسبوك"
              className="text-slate-400 transition-colors hover:text-primary"
            >
              <FacebookIcon />
            </a>
          </div>

          <div className="flex flex-col items-center gap-2.5 sm:items-start">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              روابط سريعة
            </h3>
            <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-primary">
              الرئيسية
            </Link>
            <Link href="/directory" className="text-xs font-semibold text-slate-600 hover:text-primary">
              تصفّح دليل الكفاءات
            </Link>
            <Link href="/join" className="text-xs font-semibold text-slate-600 hover:text-primary">
              انضمام كفاءة صحية جديدة
            </Link>
            <Link href="/stats" className="text-xs font-semibold text-slate-600 hover:text-primary">
              الإحصاءات
            </Link>
            <Link href="/about" className="text-xs font-semibold text-slate-600 hover:text-primary">
              عن الدليل
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2.5 sm:items-start">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              الحساب والخصوصية
            </h3>
            <Link href="/login" className="text-xs font-semibold text-slate-600 hover:text-primary">
              تسجيل دخول الكادر الصحي
            </Link>
            <Link href="/privacy" className="text-xs font-semibold text-slate-600 hover:text-primary">
              سياسة الخصوصية والاستخدام
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-slate-100 pt-6 text-center">
          <p className="text-xs font-semibold text-slate-700">
            المجلس العائلي لعائلة النتشة — فلسطين، الخليل
          </p>
          <p className="text-[11px] text-slate-400">
            © {year} مجلس عائلة النتشة. جميع الحقوق محفوظة.
          </p>
          <p className="text-[11px] text-slate-400">تصميم وإعداد: د. أحمد عوني النتشة</p>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}
