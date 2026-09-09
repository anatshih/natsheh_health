import { createClient } from '@/lib/supabase/server';

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
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 className="font-heading text-base font-bold">{row.display_name}</h2>
            <p className="text-sm text-slate-600">
              {[row.specialty_category, row.specialty, row.sub_specialty]
                .filter(Boolean)
                .join(' — ')}
            </p>
            <p className="text-xs text-slate-500">
              {[row.residence_city, row.residence_country].filter(Boolean).join('، ')}
            </p>
            {row.years_experience != null && (
              <p className="text-xs text-slate-500">خبرة {row.years_experience} سنة</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
