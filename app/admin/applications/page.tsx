import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Pagination from '@/components/Pagination';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
};

const PAGE_SIZE = 20;

function displayName(row: any): string {
  return row.profiles?.[0]?.display_name ?? row.profiles?.display_name ?? '';
}

// قائمة الطلبات التي تحتاج مراجعة (القسم 28: "طلبات الانضمام" في لوحة الإدارة).
export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();

  const supabase = await createClient();

  const { data: allRows } = await supabase
    .from('app_users')
    .select('id, status, created_at, profiles(display_name)')
    .in('status', ['submitted', 'in_review', 'needs_completion'])
    .order('created_at', { ascending: true });

  const filteredRows = q
    ? (allRows ?? []).filter((row: any) => displayName(row).includes(q))
    : allRows ?? [];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(sp.page ?? '1', 10) || 1), totalPages);
  const rows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">طلبات الانضمام بانتظار المراجعة</h2>

      <form method="GET" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
        >
          بحث
        </button>
      </form>

      {filteredRows.length === 0 && (
        <p className="text-sm text-slate-500">
          {q ? 'لا توجد طلبات مطابقة لبحثك.' : 'لا توجد طلبات بانتظار المراجعة حاليًا.'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((row: any) => (
          <Link
            key={row.id}
            href={`/admin/applications/${row.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-primary"
          >
            <div>
              <p className="font-semibold">{displayName(row) || '—'}</p>
              <p className="text-xs text-slate-500">
                {new Date(row.created_at).toLocaleDateString('ar')}
              </p>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {STATUS_LABELS[row.status] ?? row.status}
            </span>
          </Link>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
