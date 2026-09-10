import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DirectoryAvatar from '@/components/DirectoryAvatar';
import AnimatedNumber from '@/components/AnimatedNumber';
import { loadDirectoryStats } from '@/lib/directoryStats';
import { specialtyColor } from '@/lib/specialtyColors';

type DirectoryRow = {
  profile_id: string;
  display_name: string;
  photo_url: string | null;
  residence_country: string | null;
  residence_city: string | null;
  specialty_category: string | null;
  specialty: string | null;
  sub_specialty: string | null;
  job_title: string | null;
  employer: string | null;
  years_experience: number | null;
  last_updated_at: string | null;
};

const NEW_WINDOW_DAYS = 30;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const q = (await searchParams).q?.trim();

  let query = supabase
    .from('directory_public')
    .select(
      'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, sub_specialty, job_title, employer, years_experience, last_updated_at'
    )
    .order('last_updated_at', { ascending: false })
    .limit(30);

  // بحث نصي جزئي على الاسم أو التخصص (متطلب معالجة النص العربي، القسم 25)
  if (q) {
    query = query.or(`display_name.ilike.%${q}%,specialty.ilike.%${q}%`);
  }

  const [{ data: results, error }, stats] = await Promise.all([query, loadDirectoryStats()]);

  const { totalCount, countryCount, specialtyCount, topSpecialties: allTopSpecialties } = stats;
  const topSpecialties = allTopSpecialties.slice(0, 6);
  const isDirectoryEmpty = totalCount === 0;

  const now = Date.now();
  const isNew = (dateStr: string | null) =>
    !!dateStr && now - new Date(dateStr).getTime() < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return (
    <main className="relative overflow-hidden">
      <DirectoryHeroBackground />
      <div className="relative mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 font-display text-2xl font-bold">دليل الكفاءات الصحية</h1>
      <p className="mb-6 text-sm text-slate-600">
        الكفاءات المعتمدة والمنشورة فقط من أبناء وبنات عائلة النتشة.
      </p>

      <div className="mb-2 grid grid-cols-3 gap-3 sm:max-w-md">
        <StatTile value={totalCount} label="كفاءة موثّقة" />
        <StatTile value={specialtyCount} label="تخصصًا" />
        <StatTile value={countryCount} label="دولة" />
      </div>
      <Link href="/stats" className="mb-6 inline-block text-xs font-semibold text-primary hover:underline">
        عرض كل الإحصاءات ›
      </Link>

      <form className="mb-5 flex max-w-md gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو التخصص… مثال: طبيب قلب"
          aria-label="ابحث بالاسم أو التخصص"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white"
        >
          بحث
        </button>
      </form>

      {topSpecialties.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {topSpecialties.map(([name, count]) => (
            <Link
              key={name}
              href={`/directory?q=${encodeURIComponent(name)}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                q === name
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
              }`}
            >
              {name} ({count})
            </Link>
          ))}
          {q && (
            <Link
              href="/directory"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-primary"
            >
              مسح التصفية ✕
            </Link>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          تعذّر تحميل النتائج حاليًا. تأكد من تنفيذ مخطط قاعدة البيانات في database/.
        </p>
      )}

      {!error && isDirectoryEmpty && <EmptyDirectoryState />}

      {!error && !isDirectoryEmpty && (!results || results.length === 0) && (
        <NoSearchResults query={q} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results?.map((row: DirectoryRow) => {
          const color = specialtyColor(row.specialty_category);
          return (
            <article
              key={row.profile_id}
              className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 pt-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: color.solid }} aria-hidden="true" />

              {isNew(row.last_updated_at) && (
                <span className="absolute left-4 top-4 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent">
                  انضم حديثًا
                </span>
              )}

              <div className="flex items-center gap-3">
                <DirectoryAvatar
                  photoUrl={row.photo_url}
                  name={row.display_name}
                  category={row.specialty_category}
                  size={52}
                />
                <div>
                  <h2 className="font-heading text-base font-bold">{row.display_name}</h2>
                  {(row.residence_city || row.residence_country) && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <PinIcon />
                      {[row.residence_city, row.residence_country].filter(Boolean).join('، ')}
                    </p>
                  )}
                </div>
              </div>

              {row.specialty && (
                <span
                  className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: color.soft, color: color.text }}
                >
                  {row.specialty}
                </span>
              )}

              {row.years_experience != null && (
                <p className="text-xs text-slate-500">خبرة {row.years_experience} سنة</p>
              )}

              <Link
                href={`/directory/${row.profile_id}`}
                className="mt-1 rounded-lg border border-primary py-2 text-center text-xs font-semibold text-primary hover:bg-primary-soft"
              >
                عرض الملف المهني
              </Link>
            </article>
          );
        })}
      </div>
      </div>
    </main>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white py-3 text-center">
      <p className="font-display text-2xl font-bold text-accent">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

// نسخة أقصر من خلفية الصفحة الرئيسية — تمنح رأس صفحة الدليل نفس الطابع
// البصري (توهّج وتطريز خفيف) بدل لون واحد مسطح، بلا مزاحمة لشبكة البطاقات.
function DirectoryHeroBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="tatreez-directory" width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M23 4 L42 23 L23 42 L4 23Z" fill="none" stroke="#A8324A" strokeWidth="1.1" />
          <path d="M23 13 L33 23 L23 33 L13 23Z" fill="none" stroke="#6E7B3D" strokeWidth="0.8" />
          <circle cx="23" cy="23" r="2.2" fill="#005CB6" />
        </pattern>
        <radialGradient id="directory-glow" cx="20%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#BEDCFA" />
          <stop offset="50%" stopColor="#EFCFC0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FAF6F0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#directory-glow)" />
      <rect width="100%" height="100%" fill="url(#tatreez-directory)" opacity="0.24" />
    </svg>
  );
}

// الدليل فارغ كليًا (لا علاقة بأي بحث) — دعوة ترحيبية للانضمام بدل رسالة
// "لا نتائج" التي توحي بخطأ من الزائر أو عطل في الموقع.
function EmptyDirectoryState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-olive/40 bg-olive-soft/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5z"
            stroke="#6E7B3D"
            strokeWidth="1.6"
          />
          <path d="M12 8v5M12 16v.5" stroke="#6E7B3D" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <h2 className="font-display text-lg font-bold text-slate-900">
        كن أول كفاءة تنضم إلى الدليل
      </h2>
      <p className="max-w-sm text-sm text-slate-600">
        الدليل ينطلق الآن. سجّل بياناتك وكن نواة هذه الشبكة من كفاءات عائلة النتشة الصحية.
      </p>
      <Link
        href="/join"
        className="rounded-lg bg-olive px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-dark"
      >
        انضمام كفاءة صحية جديدة
      </Link>
    </div>
  );
}

// يوجد أعضاء في الدليل، لكن هذا البحث/التصفية تحديدًا لم يطابق أحدًا.
function NoSearchResults({ query }: { query?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-slate-600">
        {query ? (
          <>لا توجد نتيجة لبحثك عن "{query}". جرّب اسمًا أو تخصصًا آخر.</>
        ) : (
          'لا توجد نتائج مطابقة لهذا التصفية.'
        )}
      </p>
      <Link href="/directory" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
        عرض كل الكفاءات ›
      </Link>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
