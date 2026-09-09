import Link from 'next/link';

// تذييل موحّد بهوية الجهة المشرفة (القسم 2)، مع روابط سريعة وسياسة الخصوصية
// (القسم 38) وحساب فيسبوك الرسمي للمجلس.
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
          <Link href="/directory" className="hover:text-primary">
            دليل الكفاءات
          </Link>
          <Link href="/join" className="hover:text-primary">
            طلب انضمام
          </Link>
          <Link href="/stats" className="hover:text-primary">
            الإحصاءات
          </Link>
          <Link href="/about" className="hover:text-primary">
            عن الدليل
          </Link>
          <Link href="/login" className="hover:text-primary">
            تسجيل الدخول
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            سياسة الخصوصية والاستخدام
          </Link>
        </nav>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-6 w-auto opacity-90" />
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
