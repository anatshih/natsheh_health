'use client';

import { useEffect } from 'react';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

// إشعار تأكيد/خطأ عائم بسيط — بديل موحّد لـ alert() المتصفحي وللفشل الصامت
// الذي كان يتجاهل قيمة { error } العائدة من كل Server Action تقريبًا.
export default function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90vw] rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${
        toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
      }`}
    >
      {toast.message}
    </div>
  );
}
