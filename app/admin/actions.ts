'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

function randomLockPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 24; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();
  return me && me.role === 'admin' ? me : null;
}

// تعطيل ملف مباشرة من لوحة المؤشرات (إخفاء فوري من الدليل العام، قابل
// للتراجع) — يسدّ فجوة كانت موجودة في القسم 21 (لا شاشة فعلية لهذا الإجراء).
export async function suspendAccount(formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return { error: 'هذا الإجراء مقصور على المدير.' };

  const { error } = await supabase.from('app_users').update({ status: 'suspended' }).eq('id', userId);
  if (error) return { error: 'تعذّر تعطيل الحساب. حاول مرة أخرى.' };

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'suspend_account',
    target_table: 'app_users',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin');
  return { ok: true };
}

// إعادة تفعيل ملف موقوف سابقًا. يعيده إلى حالة "معتمد" (وليس "منشور"
// تلقائيًا) ليقرر المدير النشر من جديد بوعي عبر زر "نشر" أدناه.
export async function reactivateAccount(formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return { error: 'هذا الإجراء مقصور على المدير.' };

  const { error } = await supabase.from('app_users').update({ status: 'approved' }).eq('id', userId);
  if (error) return { error: 'تعذّر إعادة تفعيل الحساب. حاول مرة أخرى.' };

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'reactivate_account',
    target_table: 'app_users',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin');
  return { ok: true };
}

// نشر ملف "معتمد" في الدليل العام. يسدّ فجوة كانت موجودة: شاشة "طلبات
// الانضمام" تستبعد الحالة "معتمد" من استعلامها أصلاً، فلم يكن هناك أي
// مكان فعلي لنشر ملف اعتُمد دون نشر فوري (أو أُعيد تفعيله من "موقوف").
export async function publishAccount(formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return { error: 'هذا الإجراء مقصور على المدير.' };

  const { error } = await supabase.from('app_users').update({ status: 'published' }).eq('id', userId);
  if (error) return { error: 'تعذّر نشر الملف. حاول مرة أخرى.' };

  await supabase
    .from('applications')
    .update({ published_at: new Date().toISOString() })
    .eq('user_id', userId);

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'publish_account',
    target_table: 'app_users',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin');
  return { ok: true };
}

// حذف نهائي مباشر من لوحة المؤشرات — نفس منطق التأكيد النهائي في
// app/admin/deletion-requests/actions.ts، لكن يبدأه المدير مباشرة دون
// انتظار طلب حذف مسبق من صاحب الحساب.
export async function adminDeleteAccount(formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return { error: 'هذا الإجراء مقصور على المدير.' };

  await Promise.all([
    supabase.from('identities').delete().eq('user_id', userId),
    supabase.from('contacts').delete().eq('user_id', userId),
    supabase.from('profiles').delete().eq('user_id', userId),
    supabase.from('professional_profiles').delete().eq('user_id', userId),
    supabase.from('publication_preferences').delete().eq('user_id', userId),
  ]);

  const { error: statusError } = await supabase
    .from('app_users')
    .update({ status: 'archived' })
    .eq('id', userId);
  if (statusError) return { error: 'حُذفت البيانات لكن تعذّر أرشفة الحساب.' };

  const { error: rpcError } = await supabase.rpc('admin_reset_password', {
    p_user_id: userId,
    p_new_password: randomLockPassword(),
  });
  if (rpcError) return { error: 'حُذفت البيانات لكن تعذّر قفل تسجيل الدخول.' };

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'admin_direct_delete',
    target_table: 'app_users',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin');
  return { ok: true };
}
