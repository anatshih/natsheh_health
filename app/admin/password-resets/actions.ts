'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// يولّد كلمة مرور مؤقتة ويفعّلها فورًا. يُستدعى فقط بعد أن يكون المدير قد تحقق
// هاتفيًا من هوية الشخص عبر رقمه المسجَّل مسبقًا (القسم 36) — هذا الاستدعاء لا
// يقوم بذلك التحقق نيابةً عنه، بل يفترض أنه تم فعلاً خارج النظام.
type ResolveResult = { password: string; error?: undefined } | { error: string; password?: undefined };

export async function resolvePasswordReset(
  requestId: string,
  userId: string
): Promise<ResolveResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'يجب تسجيل الدخول' };

  const { data: me } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return { error: 'هذا الإجراء مقصور على المدير' };
  }

  const newPassword = generateTempPassword();

  const { error: rpcError } = await supabase.rpc('admin_reset_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  });

  if (rpcError) {
    return { error: 'تعذّر إعادة تعيين كلمة المرور' };
  }

  // .eq('status','pending') يمنع معالجة نفس الطلب مرتين (نقر مزدوج، أو
  // مديران في تبويبين مختلفين) — كان غائبًا سابقًا.
  const { error: statusError } = await supabase
    .from('password_reset_requests')
    .update({ status: 'completed', verified_by: me.id, resolved_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending');

  if (statusError) {
    return { error: 'أُعيدت كلمة المرور لكن تعذّر تحديث حالة الطلب.' };
  }

  revalidatePath('/admin/password-resets');
  return { password: newPassword };
}

type RejectResult = { ok: true; error?: undefined } | { error: string; ok?: undefined };

export async function rejectPasswordReset(formData: FormData): Promise<RejectResult> {
  const requestId = formData.get('requestId') as string;
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

  if (!me || me.role !== 'admin') return { error: 'هذا الإجراء مقصور على المدير.' }; // نفس قيد resolvePasswordReset أعلاه — كان مفقودًا هنا فقط

  const { error } = await supabase
    .from('password_reset_requests')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) return { error: 'تعذّر رفض الطلب.' };

  revalidatePath('/admin/password-resets');
  return { ok: true };
}
