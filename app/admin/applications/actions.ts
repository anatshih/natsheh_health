'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const STATUS_BY_ACTION: Record<string, string> = {
  approve: 'approved',
  approve_publish: 'published',
  approve_no_publish: 'approved',
  request_completion: 'needs_completion',
  reject: 'rejected',
};

const TERMINAL_ACTIONS = new Set(['approve', 'approve_publish', 'approve_no_publish', 'reject']);

// ينفّذ قرار المراجعة (القسم 21). الاعتماد النهائي وتغيير الحالة مقصوران على
// المدير عبر سياسة RLS على app_users؛ المراجع يمكنه الاطلاع فقط في هذا الإصدار.
export async function reviewApplication(formData: FormData) {
  const userId = formData.get('userId') as string;
  const action = formData.get('action') as string;
  const note = (formData.get('note') as string) || null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: reviewer } = await supabase
    .from('app_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!reviewer) redirect('/login');

  const newStatus = STATUS_BY_ACTION[action];
  if (!newStatus) throw new Error('إجراء غير معروف');

  const { data: application } = await supabase
    .from('applications')
    .select('id, first_reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!application) throw new Error('لم يُعثر على طلب مرتبط بهذا المستخدم');

  await supabase.from('reviews').insert({
    application_id: application.id,
    reviewer_id: reviewer.id,
    action,
    note,
  });

  const { error: statusError } = await supabase
    .from('app_users')
    .update({ status: newStatus })
    .eq('id', userId);

  if (statusError) {
    throw new Error('تعذّر تحديث حالة الطلب — تأكد أن الحساب الحالي مدير وليس مراجعًا فقط.');
  }

  const applicationUpdate: Record<string, string> = {};
  if (!application.first_reviewed_at) applicationUpdate.first_reviewed_at = new Date().toISOString();
  if (TERMINAL_ACTIONS.has(action)) applicationUpdate.decided_at = new Date().toISOString();
  if (action === 'approve_publish') applicationUpdate.published_at = new Date().toISOString();

  if (Object.keys(applicationUpdate).length > 0) {
    await supabase.from('applications').update(applicationUpdate).eq('id', application.id);
  }

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${userId}`);
  redirect('/admin/applications');
}
