import Link from 'next/link';
import DirectoryAvatar from './DirectoryAvatar';
import { specialtyColor } from '@/lib/specialtyColors';

type Props = {
  profile_id: string;
  display_name: string;
  photo_url: string | null;
  residence_country: string | null;
  residence_city: string | null;
  specialty_category: string | null;
  specialty: string | null;
  years_experience: number | null;
};

// بطاقة عضو الدليل العام — مكوّن مشترك بين شبكة /directory الرئيسية
// وصفحة /directory/recent (كل من انضم حديثًا)، لضمان مظهر متطابق دون تكرار.
export default function DirectoryCard(row: Props) {
  const color = specialtyColor(row.specialty_category);

  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 pt-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color.solid }} aria-hidden="true" />

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
