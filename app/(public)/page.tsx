import Link from 'next/link';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import FacebookShareButton from '@/components/FacebookShareButton';
import AnimatedNumber from '@/components/AnimatedNumber';
import { loadDirectoryStats } from '@/lib/directoryStats';

// الصفحة الرئيسية: بوابة سريعة (قيمة + دعوة للفعل خلال ثوانٍ) — بخلاف صفحة
// "عن الدليل" التي تحمل الشرح الكامل. كانت الصفحتان تتطابقان في النص تقريبًا
// حرفيًا؛ نُقل كل الشرح المطوّل إلى about/page.tsx فقط لتفادي التكرار.
export default async function HomePage() {
  const stats = await loadDirectoryStats();

  return (
    <main className="relative overflow-hidden">
      <TatreezBackground />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-7 px-6 py-20 text-center">
        <p className="text-sm font-bold text-primary">مجلس عائلة النتشة — الخليل، فلسطين</p>

        <h1 className="text-balance font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          كفاءات نفتخر بها، في مكان واحد
        </h1>

        <p className="max-w-xl text-base leading-8 text-slate-600">
          تبحث عن طبيب أو ممرضة أو أي كفاءة صحية من عائلة النتشة؟ ستجدهم هنا موثّقين
          بتخصصاتهم. وإن كنت أنت الكفاءة الصحية، سجّل بياناتك لتكون في متناول أهلك.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/directory"
            className="rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            تصفّح دليل الكفاءات
          </Link>
          <Link
            href="/join"
            className="rounded-lg border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary"
          >
            انضمام كفاءة صحية جديدة
          </Link>
        </div>

        <div className="mt-2 flex gap-10">
          <Stat value={stats.totalCount} label="كفاءة موثّقة" />
          <Stat value={stats.specialtyCount} label="تخصصًا" />
          <Stat value={stats.countryCount} label="دولة" />
        </div>

        <Link href="/about" className="text-xs font-semibold text-primary hover:underline">
          اقرأ المزيد عن الدليل ›
        </Link>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <WhatsAppShareButton
            text="دليل الكفاءات الصحية لعائلة النتشة — تصفّح الكفاءات الصحية في العائلة:"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
          />
          <FacebookShareButton
            quote="دليل الكفاءات الصحية لعائلة النتشة — تصفّح الكفاءات الصحية في العائلة:"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
          />
        </div>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-bold text-accent">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

// نمط زخرفي خفيف مستوحى من التطريز الخليلي (الغرزة الصليبية) — بديل عن خلفية
// بيضاء مسطحة بالكامل، بشفافية منخفضة جدًا لئلا يزاحم النص.
function TatreezBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="tatreez-home" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22 3 L41 22 L22 41 L3 22 Z" fill="none" stroke="#A8324A" strokeWidth="1" />
          <circle cx="22" cy="22" r="2.5" fill="#005CB6" />
        </pattern>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF2FC" />
          <stop offset="100%" stopColor="#EAF2FC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-fade)" />
      <rect width="100%" height="100%" fill="url(#tatreez-home)" opacity="0.09" />
    </svg>
  );
}
