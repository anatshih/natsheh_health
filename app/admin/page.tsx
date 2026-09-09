import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import RegistrantsList from './RegistrantsList';

const STATUS_ORDER = [
  'draft',
  'submitted',
  'in_review',
  'needs_completion',
  'approved',
  'published',
  'needs_update',
  'suspended',
  'rejected',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
  approved: 'معتمد',
  published: 'منشور',
  needs_update: 'يحتاج تحديثًا',
  suspended: 'موقوف',
  rejected: 'مرفوض',
};

// حدود ملوّنة تعكس دلالة كل حالة، بنفس نظام ألوان شارات القائمة أسفلها
// (RegistrantsList.tsx) للاتساق البصري.
const STATUS_ACCENT: Record<string, string> = {
  draft: 'border-slate-300',
  submitted: 'border-amber-400',
  in_review: 'border-amber-400',
  needs_completion: 'border-amber-400',
  approved: 'border-sky-400',
  published: 'border-emerald-400',
  needs_update: 'border-amber-400',
  suspended: 'border-red-400',
  rejected: 'border-red-400',
};

// لوحة مؤشرات (القسم 29): صندوق لكل حالة ممكنة (بدل 3 فئات مجمّعة)، قابل
// للضغط لتصفية قائمة "جميع المسجَّلين" أسفله حسب تلك الحالة تحديدًا.
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const activeStatus = sp.status;

  const supabase = await createClient();
  const { data: rows } = await supabase.from('app_users').select('status').neq('status', 'archived');

  const counts: Record<string, number> = {};
  for (const s of STATUS_ORDER) counts[s] = 0;
  for (const r of rows ?? []) {
    if (counts[r.status] !== undefined) counts[r.status]++;
  }
  const total = (rows ?? []).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Link
          href="/admin"
          className={`rounded-xl border-r-4 border-y border-l bg-white p-4 text-center transition-shadow ${
            !activeStatus ? 'border-primary shadow-sm' : 'border-slate-300 hover:shadow-sm'
          }`}
        >
          <p className="text-xs text-slate-500">إجمالي المسجلين</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{total}</p>
        </Link>

        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={activeStatus === s ? '/admin' : `/admin?status=${s}`}
            className={`rounded-xl border-r-4 ${STATUS_ACCENT[s]} border-y border-l bg-white p-4 text-center transition-shadow ${
              activeStatus === s ? 'border-y-primary border-l-primary shadow-sm' : 'border-y-slate-200 border-l-slate-200 hover:shadow-sm'
            }`}
          >
            <p className="text-xs text-slate-500">{STATUS_LABELS[s]}</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{counts[s]}</p>
          </Link>
        ))}
      </div>

      <RegistrantsList />
    </div>
  );
}
