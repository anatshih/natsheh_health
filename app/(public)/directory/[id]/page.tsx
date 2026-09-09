import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DirectoryAvatar from '@/components/DirectoryAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import RevealField from '@/components/RevealField';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';

export default async function DirectoryProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from('directory_public')
    .select('*')
    .eq('profile_id', id)
    .single();

  if (!person) notFound();

  const { data: related } = person.specialty
    ? await supabase
        .from('directory_public')
        .select('profile_id, display_name, photo_url, specialty, residence_city, residence_country')
        .eq('specialty', person.specialty)
        .neq('profile_id', id)
        .limit(4)
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-primary">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-primary">
          دليل الكفاءات
        </Link>
        {person.specialty && (
          <>
            <span>/</span>
            <Link href={`/directory?q=${encodeURIComponent(person.specialty)}`} className="hover:text-primary">
              {person.specialty}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-700">{person.display_name}</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <DirectoryAvatar photoUrl={person.photo_url} name={person.display_name} size={80} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">{person.display_name}</h1>
              <VerifiedBadge />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {[person.specialty_category, person.specialty, person.sub_specialty]
                .filter(Boolean)
                .join(' — ')}
            </p>
            {(person.residence_city || person.residence_country) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <PinIcon />
                {[person.residence_city, person.residence_country].filter(Boolean).join('، ')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          {person.qualification && <InfoItem label="المؤهل العلمي" value={person.qualification} />}
          {person.job_title && <InfoItem label="المسمى الوظيفي" value={person.job_title} />}
          {person.workplace_type && <InfoItem label="نوع مكان العمل" value={person.workplace_type} />}
          {person.employer && <InfoItem label="اسم مكان العمل" value={person.employer} />}
          {person.workplace_address && <InfoItem label="الموقع" value={person.workplace_address} />}
          {(person.work_city || person.work_country) && (
            <InfoItem
              label="مكان العمل"
              value={[person.work_city, person.work_country].filter(Boolean).join('، ')}
            />
          )}
          {person.years_experience != null && (
            <InfoItem label="سنوات الخبرة" value={`${person.years_experience} سنة`} />
          )}
        </div>

        {(person.phone || person.whatsapp || person.email || person.facebook) && (
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
            {person.phone && <RevealField label="رقم الهاتف" value={person.phone} />}
            {person.whatsapp && <RevealField label="رقم الواتساب" value={person.whatsapp} />}
            {person.email && <RevealField label="البريد الإلكتروني" value={person.email} />}
            {person.facebook && <RevealField label="حساب فيسبوك" value={person.facebook} />}
          </div>
        )}

        {person.bio && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="mb-1 text-[11px] text-slate-500">نبذة مهنية</p>
            <p className="text-sm leading-7 text-slate-700">{person.bio}</p>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-5">
          <WhatsAppShareButton
            text={`تعرّف على ${person.display_name}${person.specialty ? ` — ${person.specialty}` : ''} ضمن دليل الكفاءات الصحية لعائلة النتشة:`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
          />
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-slate-700">
            كفاءات أخرى في {person.specialty}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r: any) => (
              <Link
                key={r.profile_id}
                href={`/directory/${r.profile_id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-primary"
              >
                <DirectoryAvatar photoUrl={r.photo_url} name={r.display_name} size={40} />
                <div>
                  <p className="text-sm font-semibold">{r.display_name}</p>
                  <p className="text-xs text-slate-500">
                    {[r.residence_city, r.residence_country].filter(Boolean).join('، ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href="/directory" className="mt-6 inline-block text-xs font-semibold text-primary">
        ‹ العودة إلى الدليل
      </Link>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
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
