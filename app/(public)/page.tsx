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

// خلفية زخرفية مستوحاة من التطريز الخليلي (الغرزة الصليبية بلونين) فوق توهّج
// متدرّج يمزج الأزرق الأساسي بلمسة دافئة من الأحمر التطريزي — بدل خلفية بيضاء
// مسطحة بالكامل أو تدرّج أحادي اللون خافت جدًا.
function TatreezBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="tatreez-home" width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M23 4 L42 23 L23 42 L4 23Z" fill="none" stroke="#A8324A" strokeWidth="1.1" />
          <path d="M23 13 L33 23 L23 33 L13 23Z" fill="none" stroke="#6E7B3D" strokeWidth="0.8" />
          <circle cx="23" cy="23" r="2.2" fill="#005CB6" />
        </pattern>
        <radialGradient id="hero-glow" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stopColor="#BEDCFA" />
          <stop offset="50%" stopColor="#EFCFC0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FAF6F0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-glow)" />
      <rect width="100%" height="100%" fill="url(#tatreez-home)" opacity="0.28" />
    </svg>
  );
}
