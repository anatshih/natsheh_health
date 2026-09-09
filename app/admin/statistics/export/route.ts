import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadReportData, SCOPE_LABELS, type ReportScope } from '@/lib/reports';

function csvEscape(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// تصدير كل جداول "الإحصائيات" دفعة واحدة كملف CSV واحد (عمود "القسم" يفصل
// بين المجموعات)، مقصور على admin/reviewer فقط مثل بقية شاشات لوحة الإدارة.
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  if (!me || !['admin', 'reviewer'].includes(me.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const scopeParam = request.nextUrl.searchParams.get('scope') ?? 'all';
  const scope: ReportScope = (['all', 'approved', 'published'] as string[]).includes(scopeParam)
    ? (scopeParam as ReportScope)
    : 'all';

  const data = await loadReportData(scope);

  const lines = [['القسم', 'التصنيف', 'العدد'].map(csvEscape).join(',')];

  const addSection = (title: string, rows: Record<string, number>) => {
    for (const [label, count] of Object.entries(rows)) {
      lines.push([title, label, count].map(csvEscape).join(','));
    }
  };

  addSection('نظرة عامة', {
    'إجمالي المسجلين': data.overview.total,
    'بانتظار المراجعة': data.overview.pending,
    معتمد: data.overview.approved,
    منشور: data.overview.published,
    مرفوض: data.overview.rejected,
  });
  addSection('التوزيع حسب المجال الصحي', data.byCategory);
  addSection('التوزيع الجغرافي حسب الدولة', data.byCountry);
  addSection('التوزيع حسب المؤهل العلمي', data.byQualification);
  addSection('التوزيع حسب سنوات الخبرة', {
    'أقل من 5 سنوات': data.byExperience.under5,
    '5 – 15 سنة': data.byExperience.mid5to15,
    'أكثر من 15 سنة': data.byExperience.over15,
    'غير محدد': data.byExperience.unknown,
  });
  addSection('التوزيع حسب الفرع العائلي', data.byFamilyBranch);
  addSection('التوزيع حسب نوع مكان العمل', data.byWorkplaceType);
  addSection('المتاحون للمساهمة الصحية المستقبلية', data.byContributionWillingness);
  addSection('مجالات المساهمة الأكثر طلبًا', data.byContributionArea);

  const csv = '﻿' + lines.join('\n'); // BOM لضمان ظهور العربية بشكل صحيح في Excel

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="natsheh-health-statistics-${scope}.csv"`,
    },
  });
}
