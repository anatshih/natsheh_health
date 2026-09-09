import { createClient } from '@/lib/supabase/server';

// لوحة مؤشرات مبسطة (القسم 29). التوسع لاحقًا: طلبات الانضمام، التقارير، إلخ.
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: totalUsers }, { count: published }, { count: pending }] =
    await Promise.all([
      supabase.from('app_users').select('*', { count: 'exact', head: true }),
      supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'in_review', 'needs_completion']),
    ]);

  const cards = [
    { label: 'إجمالي المسجلين', value: totalUsers ?? 0 },
    { label: 'المنشورون', value: published ?? 0 },
    { label: 'بانتظار المراجعة', value: pending ?? 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-primary">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
