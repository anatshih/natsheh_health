'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

type CreateResult = { password: string; error?: undefined } | { error: string; password?: undefined };

// إنشاء حساب فريق (مدير/مراجع) — مقصور على admin. يستخدم عميل Supabase منفصل
// بمفتاح anon فقط (بلا تخزين جلسة) لإنشاء حساب Auth جديد دون المساس بجلسة
// المدير الحالي، ثم يربط الحساب بصلاحيته عبر جلسة المدير نفسها (تسمح بذلك
// سياسة "الإدارة تدير الحسابات" في RLS، القسم 61). لا حاجة لمفتاح service_role.
export async function createStaffAccount(formData: FormData): Promise<CreateResult> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const role = formData.get('role') as string;

  if (!name || !email) return { error: 'الاسم والبريد الإلكتروني إلزاميان.' };
  if (!['admin', 'reviewer'].includes(role)) return { error: 'صلاحية غير صالحة.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'يجب تسجيل الدخول.' };

  const { data: me } = await supabase
    .from('app_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return { error: 'إنشاء حسابات الفريق مقصور على المدير.' };
  }

  const password = generateTempPassword();

  const freshClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: signUpData, error: signUpError } = await freshClient.auth.signUp({ email, password });

  if (signUpError || !signUpData.user) {
    const isDuplicate = signUpError?.message?.toLowerCase().includes('already registered');
    return { error: isDuplicate ? 'البريد الإلكتروني مستخدم بالفعل.' : 'تعذّر إنشاء الحساب. حاول مرة أخرى.' };
  }

  const { error: insertError } = await supabase.from('app_users').insert({
    auth_user_id: signUpData.user.id,
    role,
    status: 'approved',
    staff_name: name,
    staff_email: email,
  });

  if (insertError) {
    return { error: 'تعذّر ربط الحساب بالصلاحية المطلوبة.' };
  }

  revalidatePath('/admin/users');
  return { password };
}

// تغيير صلاحية حساب فريق قائم، أو إلغاؤها (role: 'applicant' يزيل وصوله
// للوحة الإدارة تمامًا دون حذف الحساب). مقصور على admin عبر نفس سياسة RLS.
export async function updateStaffRole(formData: FormData) {
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!['admin', 'reviewer', 'applicant'].includes(role)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!me || me.role !== 'admin') return;
  if (me.id === userId) return; // لا يمكن للمدير إلغاء صلاحيته عن نفسه (تفاديًا لقفل الوصول)

  await supabase.from('app_users').update({ role }).eq('id', userId);
  revalidatePath('/admin/users');
}
