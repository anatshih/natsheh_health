import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DirectoryAvatar from '@/components/DirectoryAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';

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
};

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
      'profile_id, display_name, photo_url, residence_country, residence_city, specialty_category, specialty, sub_specialty, job_title, employer, years_experience'
    )
    .order('last_updated_at', { ascending: false })
    .limit(30);

  // بحث نصي جزئي على الاسم أو التخصص (متطلب معالجة النص العربي، القسم 25)
  if (q) {
    query = query.or(`display_name.ilike.%${q}%,specialty.ilike.%${q}%`);
  }

  const { data: results, error } = await query;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-extrabold">دليل الكفاءات الصحية</h1>
      <p className="mb-6 text-sm text-slate-600">
        الكفاءات المعتمدة والمنشورة فقط من أبناء وبنات عائلة النتشة.
      </p>

      <form className="mb-8 flex max-w-md gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو التخصص… مثال: طبيب قلب"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white"
        >
          بحث
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          تعذّر تحميل النتائج حاليًا. تأكد من تنفيذ مخطط قاعدة البيانات في database/.
        </p>
      )}

      {!error && (!results || results.length === 0) && (
        <p className="text-sm text-slate-500">لا توجد نتائج مطابقة.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results?.map((row: DirectoryRow) => (
          <article
            key={row.profile_id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <DirectoryAvatar photoUrl={row.photo_url} name={row.display_name} size={52} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-heading text-base font-bold">{row.display_name}</h2>
                  <VerifiedBadge />
                </div>
                {(row.residence_city || row.residence_country) && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <PinIcon />
                    {[row.residence_city, row.residence_country].filter(Boolean).join('، ')}
                  </p>
                )}
              </div>
            </div>

            {row.specialty && (
              <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
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
        ))}
      </div>
    </main>
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
