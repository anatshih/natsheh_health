// ثوابت آمنة للعميل (بلا أي استيراد لكود الخادم) يمكن استيرادها من مكوّنات
// 'use client' مباشرة — بخلاف lib/reports.ts الذي يستورد عميل Supabase الخاص
// بالخادم ولا يصلح للاستيراد من مكوّن عميل.
export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير نظام',
  reviewer: 'مراجع',
};
