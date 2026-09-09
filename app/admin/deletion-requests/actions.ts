'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

// حذف نهائي وفعلي بعد تأكيد الإدارة (القسم 38). غير قابل للتراجع: يحذف بيانات
// الهوية/الاتصال/الملف/البيانات المهنية، ويقفل تسجيل الدخول نهائيًا عبر كلمة
// مرور عشوائية غير معروفة لأحد (بدل حذف حساب Supabase Auth، لعدم توفر
// service role key)، ويُبقي فقط صفًا مجهول الهوية بحالة "مؤرشف" للإحصاءات.
export async function confirmAccountDeletion(formData: FormData) {
  const requestId = formData.get('requestId') as string;
  const userId = formData.get('userId') as string;

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return;

  await Promise.all([
    supabase.from('identities').delete().eq('user_id', userId),
    supabase.from('contacts').delete().eq('user_id', userId),
    supabase.from('profiles').delete().eq('user_id', userId),
    supabase.from('professional_profiles').delete().eq('user_id', userId),
    supabase.from('publication_preferences').delete().eq('user_id', userId),
  ]);

  await supabase.from('app_users').update({ status: 'archived' }).eq('id', userId);

  await supabase.rpc('admin_reset_password', {
    p_user_id: userId,
    p_new_password: randomLockPassword(),
  });

  await supabase
    .from('deletion_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', requestId);

  await supabase.from('audit_logs').insert({
    actor_id: me.id,
    action: 'confirm_account_deletion',
    target_table: 'app_users',
    target_id: userId,
    details: {},
  });

  revalidatePath('/admin/deletion-requests');
}

// رفض طلب حذف — يعيد الحساب إلى حالته السابقة (مثلاً عند الاشتباه بأن الطلب
// جاء من حساب مخترق وليس من صاحبه الفعلي).
export async function rejectAccountDeletion(formData: FormData) {
  const requestId = formData.get('requestId') as string;
  const userId = formData.get('userId') as string;
  const previousStatus = (formData.get('previousStatus') as string) || 'approved';

  const supabase = await createClient();
  const me = await requireAdmin(supabase);
  if (!me) return;

  await supabase.from('app_users').update({ status: previousStatus }).eq('id', userId);

  await supabase
    .from('deletion_requests')
    .update({ status: 'rejected', completed_at: new Date().toISOString() })
    .eq('id', requestId);

  revalidatePath('/admin/deletion-requests');
}
