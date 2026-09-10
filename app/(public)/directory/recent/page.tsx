import Link from 'next/link';
import DirectoryCard from '@/components/DirectoryCard';
import { loadRecentlyJoined, NEW_WINDOW_DAYS } from '@/lib/directoryStats';

export const metadata = {
  title: 'انضموا حديثًا | دليل الكفاءات الصحية لعائلة النتشة',
};

// القائمة الكاملة (بلا حد أقصى) لمن انضم خلال آخر NEW_WINDOW_DAYS يومًا —
// الوجهة التي يقود إليها رابط "المزيد" أسفل صندوق "انضموا حديثًا" المصغَّر
// في /directory.
export default async function RecentlyJoinedPage() {
  const { people, totalCount } = await loadRecentlyJoined();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/directory" className="hover:text-primary">
          دليل الكفاءات
        </Link>
        <span>/</span>
        <span className="text-slate-700">انضموا حديثًا</span>
      </nav>

      <h1 className="mb-2 font-display text-2xl font-bold">من انضم حديثًا إلى الدليل</h1>
      <p className="mb-8 text-sm text-slate-600">
        كل من انضم أو حدّث ملفه خلال آخر {NEW_WINDOW_DAYS} يومًا ({totalCount}{' '}
        {totalCount === 1 ? 'شخص' : 'أشخاص'}).
      </p>

      {people.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          لا يوجد حاليًا من انضم خلال آخر {NEW_WINDOW_DAYS} يومًا.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((row) => (
            <DirectoryCard key={row.profile_id} {...row} />
          ))}
        </div>
      )}

      <Link href="/directory" className="mt-6 inline-block text-xs font-semibold text-primary hover:underline">
        ‹ العودة إلى الدليل
      </Link>
    </main>
  );
}
