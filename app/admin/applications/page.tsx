import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
};

// قائمة الطلبات التي تحتاج مراجعة (القسم 28: "طلبات الانضمام" في لوحة الإدارة).
export default async function ApplicationsListPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('app_users')
    .select('id, status, created_at, profiles(display_name)')
    .in('status', ['submitted', 'in_review', 'needs_completion'])
    .order('created_at', { ascending: true });

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">طلبات الانضمام بانتظار المراجعة</h2>

      {(!rows || rows.length === 0) && (
        <p className="text-sm text-slate-500">لا توجد طلبات بانتظار المراجعة حاليًا.</p>
      )}

      <div className="flex flex-col gap-3">
        {rows?.map((row: any) => (
          <Link
            key={row.id}
            href={`/admin/applications/${row.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-primary"
          >
            <div>
              <p className="font-semibold">{row.profiles?.[0]?.display_name ?? row.profiles?.display_name ?? '—'}</p>
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
    </div>
  );
}
