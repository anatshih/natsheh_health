import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DirectoryCard from '@/components/DirectoryCard';
import DirectoryFilters from '@/components/DirectoryFilters';
import AnimatedNumber from '@/components/AnimatedNumber';
import Pagination from '@/components/Pagination';
import DirectoryAvatar from '@/components/DirectoryAvatar';
import { loadDirectoryStats, loadRecentlyJoined, type RecentPerson } from '@/lib/directoryStats';

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
  last_updated_at: string | null;
};

type SearchParams = {
  q?: string;
  category?: string | string[];
  country?: string | string[];
  branch?: string | string[];
  page?: string;
};

const RECENT_LIMIT = 6;
const PAGE_SIZE = 12;

const asArray = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const q = sp.q?.trim();
  const selectedCategories = asArray(sp.category);
  const selectedCountries = asArray(sp.country);
  const selectedBranches = asArray(sp.branch);

  let query = supabase
    .from('directory_public')
    .select(
      'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, sub_specialty, job_title, employer, last_updated_at',
      { count: 'exact' }
    )
    .order('last_updated_at', { ascending: false });

  // بحث نصي جزئي على الاسم أو التخصص (متطلب معالجة النص العربي، القسم 25)
  if (q) query = query.or(`display_name.ilike.%${q}%,specialty.ilike.%${q}%`);
  if (selectedCategories.length) query = query.in('specialty_category', selectedCategories);
  if (selectedCountries.length) query = query.in('residence_country', selectedCountries);
  if (selectedBranches.length) query = query.in('family_branch', selectedBranches);

  const rawPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  // قسم "انضموا حديثًا" مستقل تمامًا عن فلاتر البحث الحالية — يُظهر دائمًا
  // آخر من انضم إلى الدليل بصرف النظر عمّا يصفّيه الزائر، بحد أقصى 6 أسماء
  // في الصندوق المصغَّر (القائمة الكاملة في /directory/recent).
  const [{ data: results, error, count }, stats, { people: recentlyJoined, totalCount: recentTotal }] =
    await Promise.all([
      query.range((rawPage - 1) * PAGE_SIZE, rawPage * PAGE_SIZE - 1),
      loadDirectoryStats(),
      loadRecentlyJoined(RECENT_LIMIT),
    ]);

  const { totalCount, countryCount, specialtyCount, topCategories, topCountries, topBranches } = stats;
  const isDirectoryEmpty = totalCount === 0;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages);

  const facets = [
    { paramKey: 'category' as const, title: 'المجال الصحي', options: topCategories },
    { paramKey: 'country' as const, title: 'الدولة', options: topCountries },
    { paramKey: 'branch' as const, title: 'الفرع العائلي', options: topBranches },
  ].filter((f) => f.options.length > 0);

  return (
    <main className="relative overflow-hidden">
      <DirectoryHeroBackground />
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-2 font-display text-2xl font-bold">دليل الكفاءات الصحية</h1>
        <p className="mb-6 text-sm text-slate-600">
          الكفاءات المعتمدة والمنشورة فقط من أبناء وبنات عائلة النتشة.
        </p>

        <DirectoryStatsBanner totalCount={totalCount} specialtyCount={specialtyCount} countryCount={countryCount} />

        <form className="mb-6 flex max-w-md gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو التخصص… مثال: طبيب قلب"
            aria-label="ابحث بالاسم أو التخصص"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
            بحث
          </button>
        </form>

        {!error && !isDirectoryEmpty && (
          <RecentlyJoinedSection people={recentlyJoined} hasMore={recentTotal > recentlyJoined.length} />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            تعذّر تحميل النتائج حاليًا. تأكد من تنفيذ مخطط قاعدة البيانات في database/.
          </p>
        )}

        {!error && isDirectoryEmpty && <EmptyDirectoryState />}

        {!error && !isDirectoryEmpty && (
          <div className="flex flex-col gap-6 md:flex-row">
            <aside className="w-full shrink-0 md:w-56">
              <DirectoryFilters facets={facets} />
            </aside>

            <div className="min-w-0 flex-1">
              {results && results.length > 0 && (
                <p className="mb-3 text-xs text-slate-500">
                  <strong className="text-slate-700">{count}</strong> نتيجة مطابقة
                </p>
              )}

              {(!results || results.length === 0) && <NoSearchResults query={q} />}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results?.map((row: DirectoryRow) => (
                  <DirectoryCard key={row.profile_id} {...row} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// شريط إحصاءات مختصر بأسلوب أكثر جاذبية — بديل مباشر عن ثلاث بطاقات بيضاء
// محايدة + رابط لصفحة إحصاءات منفصلة (حُذف الرابط والقسم التفصيلي بالكامل).
// يجمع الأرقام البارزة مع دعوة صريحة للانضمام في نفس المساحة بدل الاكتفاء
// بعرض بيانات جامدة.
function DirectoryStatsBanner({
  totalCount,
  specialtyCount,
  countryCount,
}: {
  totalCount: number;
  specialtyCount: number;
  countryCount: number;
}) {
  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-5 rounded-2xl border border-primary-soft bg-gradient-to-l from-primary-soft via-white to-accent-soft px-6 py-5 sm:flex-row">
      <div className="flex gap-6 sm:gap-8">
        <BannerStat value={totalCount} label="كفاءة موثّقة" />
        <BannerStat value={specialtyCount} label="تخصصًا" />
        <BannerStat value={countryCount} label="دولة" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
        <p className="text-xs font-semibold text-slate-700">هل أنت كفاءة صحية من عائلة النتشة؟</p>
        <Link
          href="/join"
          className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          انضم إلى هذه الشبكة المتنامية
        </Link>
      </div>
    </div>
  );
}

function BannerStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-bold text-accent sm:text-3xl">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

// صندوق مستقل يبرز آخر من انضم إلى الدليل، بدل شارة "انضم حديثًا" داخل كل
// بطاقة (كانت تتصادم مع الأسماء الطويلة). شبكة تلتف طبيعيًا بلا أي تمرير
// أفقي، ورابط "المزيد" أسفل الصندوق يظهر فقط إن كان هناك أكثر ممّا يُعرض
// هنا، ويقود لصفحة /directory/recent الكاملة. حدّ جانبي بلون accent مميّز
// (بدل لون التخصص) يُبقي معنى "جديد" واضحًا ومستقلاً عن نظام تلوين
// التخصصات، وبطاقات الشبكة الرئيسية أسفله تبقى نظيفة بلا أي شارات إطلاقًا.
function RecentlyJoinedSection({ people, hasMore }: { people: RecentPerson[]; hasMore: boolean }) {
  if (people.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">
          ✨
        </span>
        <h2 className="font-display text-base font-bold text-slate-900">انضموا حديثًا</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Link
            key={p.profile_id}
            href={`/directory/${p.profile_id}`}
            className="flex min-w-0 items-center gap-3 rounded-lg border-r-4 border-accent bg-slate-50 p-3 hover:bg-primary-soft/40"
          >
            <DirectoryAvatar
              photoUrl={p.photo_url}
              name={p.display_name}
              category={p.specialty_category}
              size={40}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{p.display_name}</p>
              {p.specialty && <p className="truncate text-xs text-slate-500">{p.specialty}</p>}
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <Link
          href="/directory/recent"
          className="mt-4 block text-center text-xs font-semibold text-primary hover:underline"
        >
          عرض كل من انضم حديثًا ›
        </Link>
      )}
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
    <div className="mb-4 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-slate-600">
        {query ? (
          <>لا توجد نتيجة لبحثك عن "{query}". جرّب اسمًا أو تخصصًا آخر.</>
        ) : (
          'لا توجد نتائج مطابقة لهذه التصفية.'
        )}
      </p>
      <Link href="/directory" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
        عرض كل الكفاءات ›
      </Link>
    </div>
  );
}
