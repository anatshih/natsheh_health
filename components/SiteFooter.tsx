// تذييل موحّد بهوية الجهة المشرفة (القسم 2).
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-6 text-center">
        <img src="/logo.png" alt="شعار مجلس عائلة النتشة" className="h-8 w-auto opacity-90" />
        <p className="text-xs font-semibold text-slate-700">دليل الكفاءات الصحية لعائلة النتشة</p>
        <p className="text-xs text-slate-500">مجلس عائلة النتشة — الخليل، فلسطين</p>
      </div>
    </footer>
  );
}
