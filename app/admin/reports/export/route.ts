import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SCOPE_STATUSES: Record<string, string[] | null> = {
  all: null,
  approved: ['approved', 'published'],
  published: ['published'],
};

function csvEscape(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// التصدير الكامل مقصور على admin فقط (القسم 32)، ويتضمن رقم الهوية لأنه
// تصدير إداري داخلي وليس بيانات عامة — يطابق صلاحية الاطلاع الممنوحة أصلاً
// للإدارة على شاشة مراجعة الطلبات (القسم 20).
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

  const scope = request.nextUrl.searchParams.get('scope') ?? 'all';
  const statuses = SCOPE_STATUSES[scope] ?? null;

  let query = supabase.from('app_users').select('id, status, created_at');
  if (statuses) query = query.in('status', statuses);
  const { data: appUsers } = await query;
  const ids = (appUsers ?? []).map((u) => u.id);

  if (ids.length === 0) {
    return new NextResponse('لا توجد بيانات ضمن هذا النطاق', { status: 200 });
  }

  const [{ data: identities }, { data: contacts }, { data: profiles }, { data: profs }] = await Promise.all([
    supabase.from('identities').select('user_id, full_name_legal, id_number').in('user_id', ids),
    supabase.from('contacts').select('user_id, phone, whatsapp, email, facebook').in('user_id', ids),
    supabase
      .from('profiles')
      .select('user_id, family_branches(name), countries(name_ar), cities(name_ar)')
      .in('user_id', ids),
    supabase
      .from('professional_profiles')
      .select(
        'user_id, qualification, employer, workplace_type, workplace_address, years_experience, specialty_category_id, specialty_id, work_country_id'
      )
      .in('user_id', ids),
  ]);

  const { data: categories } = await supabase.from('specialty_categories').select('id, name');
  const { data: specialties } = await supabase.from('specialties').select('id, name');
  const categoryName = Object.fromEntries((categories ?? []).map((c: any) => [c.id, c.name]));
  const specialtyName = Object.fromEntries((specialties ?? []).map((s: any) => [s.id, s.name]));

  const byId = (rows: any[] | null): Record<string, any> =>
    Object.fromEntries((rows ?? []).map((r) => [r.user_id, r]));

  const identityMap = byId(identities);
  const contactMap = byId(contacts);
  const profileMap = byId(profiles);
  const profMap = byId(profs);
  const statusMap = Object.fromEntries((appUsers ?? []).map((u) => [u.id, u.status]));

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

  for (const id of ids) {
    const identity = identityMap[id];
    const contact = contactMap[id];
    const profile: any = profileMap[id];
    const prof: any = profMap[id];

    lines.push(
      [
        identity?.full_name_legal,
        identity?.id_number,
        profile?.family_branches?.name,
        contact?.phone,
        contact?.whatsapp,
        contact?.email,
        contact?.facebook,
        profile?.countries?.name_ar,
        profile?.cities?.name_ar,
        prof?.specialty_category_id ? categoryName[prof.specialty_category_id] : '',
        prof?.specialty_id ? specialtyName[prof.specialty_id] : '',
        prof?.qualification,
        prof?.workplace_type,
        prof?.employer,
        prof?.workplace_address,
        prof?.years_experience,
        statusMap[id],
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  const csv = '﻿' + lines.join('\n'); // BOM لضمان ظهور العربية بشكل صحيح في Excel

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="natsheh-health-${scope}.csv"`,
    },
  });
}
