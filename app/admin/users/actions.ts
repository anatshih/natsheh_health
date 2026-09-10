'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

type CreateResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

// إنشاء حساب فريق (مدير/مراجع) — مقصور على admin. يستخدم عميل Supabase منفصل
// بمفتاح anon فقط (بلا تخزين جلسة) لإنشاء حساب Auth جديد دون المساس بجلسة
// المدير الحالي، ثم يربط الحساب بصلاحيته عبر جلسة المدير نفسها (تسمح بذلك
// سياسة "الإدارة تدير الحسابات" في RLS، القسم 61). لا حاجة لمفتاح service_role.
// اسم المستخدم وكلمة المرور يحددهما المدير نفسه يدويًا (بدل توليد تلقائي).
export async function createStaffAccount(formData: FormData): Promise<CreateResult> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string) ?? '';
  const role = formData.get('role') as string;

  if (!name || !email) return { error: 'الاسم واسم المستخدم إلزاميان.' };
  if (password.length < 8) return { error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف.' };
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
  return { ok: true };
}

// تغيير صلاحية حساب فريق قائم، أو إلغاؤها (role: 'applicant' يزيل وصوله
// للوحة الإدارة تمامًا دون حذف الحساب). مقصور على admin عبر نفس سياسة RLS.
export async function updateStaffRole(formData: FormData): Promise<CreateResult> {
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!['admin', 'reviewer', 'applicant'].includes(role)) return { error: 'صلاحية غير صالحة.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'يجب تسجيل الدخول.' };

  const { data: me } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!me || me.role !== 'admin') return { error: 'هذا الإجراء مقصور على المدير.' };
  if (me.id === userId) return { error: 'لا يمكنك إلغاء صلاحيتك عن نفسك.' }; // تفاديًا لقفل الوصول عن غير قصد

  const { error } = await supabase.from('app_users').update({ role }).eq('id', userId);
  if (error) return { error: 'تعذّر تحديث الصلاحية. حاول مرة أخرى.' };

  revalidatePath('/admin/users');
  return { ok: true };
}
