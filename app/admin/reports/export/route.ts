import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadDetailedRecords, parseReportFilters, STATUS_LABELS } from '@/lib/reports';

function csvEscape(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// تصدير نتيجة "التقارير" المصفّاة تحديدًا كما تظهر على الشاشة (القسم 32).
// مقصور على admin فقط لأنه يتضمن رقم الهوية (بيانات إدارية داخلية).
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

  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const searchParams: Record<string, string[]> = {};
  for (const key of ['status', 'branch', 'category', 'country']) {
    const values = request.nextUrl.searchParams.getAll(key);
    if (values.length) searchParams[key] = values;
  }
  const filters = parseReportFilters(searchParams);
  const records = await loadDetailedRecords(filters);

  if (records.length === 0) {
    return new NextResponse('لا توجد بيانات مطابقة لهذه الفلاتر', { status: 200 });
  }

  const header = [
    'الاسم',
    'رقم الهوية',
    'الفرع العائلي',
    'الهاتف',
    'الواتساب',
    'البريد الإلكتروني',
    'حساب فيسبوك',
    'الدولة',
    'المدينة',
    'المجال الصحي',
    'التخصص',
    'المؤهل',
    'نوع مكان العمل',
    'اسم مكان العمل',
    'الموقع',
    'سنوات الخبرة',
    'الحالة',
  ];

  const lines = [header.map(csvEscape).join(',')];

  for (const r of records) {
    lines.push(
      [
        r.fullName,
        r.idNumber,
        r.branch,
        r.phone,
        r.whatsapp,
        r.email,
        r.facebook,
        r.country,
        r.city,
        r.category,
        r.specialty,
        r.qualification,
        r.workplaceType,
        r.employer,
        r.workplaceAddress,
        r.yearsExperience,
        STATUS_LABELS[r.status] ?? r.status,
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  const csv = '﻿' + lines.join('\n'); // BOM لضمان ظهور العربية بشكل صحيح في Excel

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="natsheh-health-report.csv"`,
    },
  });
}
