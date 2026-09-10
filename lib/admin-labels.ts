// ثوابت آمنة للعميل (بلا أي استيراد لكود الخادم) يمكن استيرادها من مكوّنات
// 'use client' مباشرة — بخلاف lib/reports.ts الذي يستورد عميل Supabase الخاص
// بالخادم ولا يصلح للاستيراد من مكوّن عميل.
export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير نظام',
  reviewer: 'مراجع',
};

// مصدر وحيد لتسميات حالة الحساب — كانت مكرَّرة بنسخ منفصلة (بعضها ناقص) في
// خمسة ملفات على الأقل. lib/reports.ts يعيد تصديرها للتوافق مع مستورديها
// الحاليين.
export const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'طلب جديد',
  in_review: 'قيد المراجعة',
  needs_completion: 'بحاجة إلى استكمال',
  approved: 'معتمد',
  published: 'منشور',
  needs_update: 'يحتاج تحديثًا',
  suspended: 'موقوف',
  archived: 'مؤرشف',
  rejected: 'مرفوض',
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);
