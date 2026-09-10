import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DirectoryAvatar from '@/components/DirectoryAvatar';
import AnimatedNumber from '@/components/AnimatedNumber';
import Pagination from '@/components/Pagination';
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

type RecentPerson = {
  profile_id: string;
  display_name: string;
  photo_url: string | null;
  residence_country: string | null;
  residence_city: string | null;
  specialty_category: string | null;
  specialty: string | null;
  years_experience: number | null;
  last_updated_at: string | null;
};

type SearchParams = {
  q?: string;
  category?: string | string[];
  country?: string | string[];
  exp?: string | string[];
  page?: string;
};

const NEW_WINDOW_DAYS = 30;
const RECENT_LIMIT = 6;
const PAGE_SIZE = 12;

const EXP_BUCKETS: { key: 'under5' | 'mid5to15' | 'over15'; label: string }[] = [
  { key: 'under5', label: 'أقل من 5 سنوات' },
  { key: 'mid5to15', label: '5 – 15 سنة' },
  { key: 'over15', label: 'أكثر من 15 سنة' },
];

const asArray = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const q = sp.q?.trim();
  const selectedCategories = asArray(sp.category);
  const selectedCountries = asArray(sp.country);
  const selectedExp = asArray(sp.exp);

  let query = supabase
    .from('directory_public')
    .select(
      'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, sub_specialty, job_title, employer, years_experience, last_updated_at',
      { count: 'exact' }
    )
    .order('last_updated_at', { ascending: false });

  // بحث نصي جزئي على الاسم أو التخصص (متطلب معالجة النص العربي، القسم 25)
  if (q) query = query.or(`display_name.ilike.%${q}%,specialty.ilike.%${q}%`);
  if (selectedCategories.length) query = query.in('specialty_category', selectedCategories);
  if (selectedCountries.length) query = query.in('residence_country', selectedCountries);
  if (selectedExp.length) {
    const clauses = selectedExp
      .map((bucket) => {
        if (bucket === 'under5') return 'years_experience.lt.5';
        if (bucket === 'mid5to15') return 'and(years_experience.gte.5,years_experience.lte.15)';
        if (bucket === 'over15') return 'years_experience.gt.15';
        return null;
      })
      .filter(Boolean);
    if (clauses.length) query = query.or(clauses.join(','));
  }

  const rawPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  // قسم "انضموا حديثًا" مستقل تمامًا عن فلاتر البحث الحالية — يُظهر دائمًا
  // آخر من انضم إلى الدليل بصرف النظر عمّا يصفّيه الزائر، بحد أقصى 6 أسماء
  // حتى لا يتحوّل لشبكة كاملة إن زاد عدد المنضمين حديثًا مع نمو الدليل.
  const recentCutoff = new Date(Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const recentQuery = supabase
    .from('directory_public')
    .select(
      'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, years_experience, last_updated_at'
    )
    .gte('last_updated_at', recentCutoff)
    .order('last_updated_at', { ascending: false })
    .limit(RECENT_LIMIT);

  const [{ data: results, error, count }, stats, { data: recentlyJoined }] = await Promise.all([
    query.range((rawPage - 1) * PAGE_SIZE, rawPage * PAGE_SIZE - 1),
    loadDirectoryStats(),
    recentQuery,
  ]);

  const { totalCount, countryCount, specialtyCount, topCategories, topCountries, experienceBuckets } = stats;
  const isDirectoryEmpty = totalCount === 0;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages);
  const hasActiveFilters = Boolean(q || selectedCategories.length || selectedCountries.length || selectedExp.length);

  // يبني رابط /directory مع تبديل قيمة واحدة ضمن فئة تصفية معيّنة (إضافة إن
  // كانت غائبة، إزالة إن كانت حاضرة)، مع الإبقاء على بقية الفلاتر كما هي
  // وإسقاط رقم الصفحة (يعود للصفحة الأولى تلقائيًا عند تغيير أي فلتر).
  function toggleHref(kind: 'category' | 'country' | 'exp', value: string): string {
    const current = { category: selectedCategories, country: selectedCountries, exp: selectedExp };
    const list = current[kind];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    (kind === 'category' ? next : selectedCategories).forEach((v) => params.append('category', v));
    (kind === 'country' ? next : selectedCountries).forEach((v) => params.append('country', v));
    (kind === 'exp' ? next : selectedExp).forEach((v) => params.append('exp', v));
    const qs = params.toString();
    return qs ? `/directory?${qs}` : '/directory';
  }

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

        {!error && !isDirectoryEmpty && <RecentlyJoinedSection people={recentlyJoined ?? []} />}

        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            تعذّر تحميل النتائج حاليًا. تأكد من تنفيذ مخطط قاعدة البيانات في database/.
          </p>
        )}

        {!error && isDirectoryEmpty && <EmptyDirectoryState />}

        {!error && !isDirectoryEmpty && (
          <div className="flex flex-col gap-6 md:flex-row">
            <aside className="w-full shrink-0 md:w-56">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">تصفية النتائج</h3>
                  {hasActiveFilters && (
                    <Link href="/directory" className="text-xs font-semibold text-slate-400 hover:text-primary">
                      مسح الكل
                    </Link>
                  )}
                </div>

                {topCategories.length > 0 && (
                  <FilterGroup title="المجال الصحي">
                    {topCategories.map(([name, count]) => (
                      <FilterOption
                        key={name}
                        href={toggleHref('category', name)}
                        checked={selectedCategories.includes(name)}
                        label={name}
                        count={count}
                      />
                    ))}
                  </FilterGroup>
                )}

                {topCountries.length > 0 && (
                  <FilterGroup title="الدولة">
                    {topCountries.map(([name, count]) => (
                      <FilterOption
                        key={name}
                        href={toggleHref('country', name)}
                        checked={selectedCountries.includes(name)}
                        label={name}
                        count={count}
                      />
                    ))}
                  </FilterGroup>
                )}

                <FilterGroup title="سنوات الخبرة" last>
                  {EXP_BUCKETS.map((b) => (
                    <FilterOption
                      key={b.key}
                      href={toggleHref('exp', b.key)}
                      checked={selectedExp.includes(b.key)}
                      label={b.label}
                      count={experienceBuckets[b.key]}
                    />
                  ))}
                </FilterGroup>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {results && results.length > 0 && (
                <p className="mb-3 text-xs text-slate-500">
                  <strong className="text-slate-700">{count}</strong> نتيجة مطابقة
                </p>
              )}

              {(!results || results.length === 0) && <NoSearchResults query={q} />}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results?.map((row: DirectoryRow) => {
                  const color = specialtyColor(row.specialty_category);
                  return (
                    <article
                      key={row.profile_id}
                      className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 pt-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <span
                        className="absolute inset-x-0 top-0 h-1"
                        style={{ background: color.solid }}
                        aria-hidden="true"
                      />

                      <div className="flex min-w-0 items-center gap-3">
                        <DirectoryAvatar
                          photoUrl={row.photo_url}
                          name={row.display_name}
                          category={row.specialty_category}
                          size={52}
                        />
                        <div className="min-w-0">
                          <h2 className="truncate font-heading text-base font-bold">{row.display_name}</h2>
                          {(row.residence_city || row.residence_country) && (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <PinIcon />
                              <span className="truncate">
                                {[row.residence_city, row.residence_country].filter(Boolean).join('، ')}
                              </span>
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

              <Pagination page={page} totalPages={totalPages} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function FilterGroup({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={last ? '' : 'mb-5 border-b border-slate-100 pb-5'}>
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterOption({
  href,
  checked,
  label,
  count,
}: {
  href: string;
  checked: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          checked ? 'border-primary bg-primary' : 'border-slate-300'
        }`}
        aria-hidden="true"
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={checked ? 'font-semibold text-primary' : ''}>{label}</span>
      <span className="mr-auto text-[11px] text-slate-400">{count}</span>
    </Link>
  );
}

// قسم مستقل يبرز آخر من انضم إلى الدليل (30 يومًا كحد أقصى، و6 أسماء
// كحد أعلى) بدل شارة "انضم حديثًا" داخل كل بطاقة — كانت الشارة تتصادم مع
// الأسماء الطويلة، بينما هذا القسم له مساحته الخاصة تمامًا فلا تصادم ممكن،
// وبطاقات الشبكة الرئيسية أسفله تبقى نظيفة بلا أي شارات إطلاقًا. حدّ جانبي
// بلون accent مميّز (بدل لون التخصص) يُبقي معنى "جديد" واضحًا ومستقلاً عن
// نظام تلوين التخصصات.
function RecentlyJoinedSection({ people }: { people: RecentPerson[] }) {
  if (people.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">
          ✨
        </span>
        <h2 className="font-display text-base font-bold text-slate-900">انضموا حديثًا</h2>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {people.map((p) => (
          <Link
            key={p.profile_id}
            href={`/directory/${p.profile_id}`}
            className="flex w-56 shrink-0 items-center gap-3 rounded-xl border-r-4 border-accent bg-white p-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
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
    </div>
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
