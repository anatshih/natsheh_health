'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewApplication } from '../actions';
import Toast, { type ToastState } from '@/components/Toast';

// نموذج قرار المراجعة كجزيرة عميل مستقلة داخل صفحة تفاصيل الطلب (Server
// Component ثقيلة بجلبات بيانات متعددة) — بدل تحويل الصفحة كاملة لمكوّن
// عميل، لعرض نتيجة القرار (نجاح/خطأ) عبر Toast بدل شاشة خطأ افتراضية.
export default function ReviewForm({
  userId,
  canDecide,
  fullName,
}: {
  userId: string;
  canDecide: boolean;
  fullName?: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const name = fullName ?? 'هذا الشخص';

  async function handleAction(action: string, confirmMessage?: string) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setBusyAction(action);
    const fd = new FormData();
    fd.set('userId', userId);
    fd.set('action', action);
    fd.set('note', note);
    const result = await reviewApplication(fd);
    setBusyAction(null);
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
    } else {
      setToast({ message: 'تم تسجيل القرار بنجاح.', type: 'success' });
      setTimeout(() => router.push('/admin/applications'), 700);
    }
  }

  const busy = busyAction !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700">ملاحظة (اختياري)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          label="اعتماد"
          disabled={!canDecide || busy}
          busy={busyAction === 'approve'}
          onClick={() => handleAction('approve', `هل تريد اعتماد طلب "${name}"؟`)}
        />
        <ActionButton
          label="اعتماد ونشر"
          primary
          disabled={!canDecide || busy}
          busy={busyAction === 'approve_publish'}
          onClick={() =>
            handleAction(
              'approve_publish',
              `هل تريد اعتماد ونشر طلب "${name}"؟ سيظهر ملفه فورًا في الدليل العام.`
            )
          }
        />
        <ActionButton
          label="طلب استكمال"
          disabled={!canDecide || busy}
          busy={busyAction === 'request_completion'}
          onClick={() => handleAction('request_completion')}
        />
        <ActionButton
          label="رفض"
          danger
          disabled={!canDecide || busy}
          busy={busyAction === 'reject'}
          onClick={() => handleAction('reject', `هل تريد رفض طلب "${name}"؟`)}
        />
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function ActionButton({
  label,
  primary,
  danger,
  disabled,
  busy,
  onClick,
}: {
  label: string;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  const className = `rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
    primary
      ? 'bg-primary text-white'
      : danger
        ? 'border border-red-300 text-red-700'
        : 'border border-slate-300 text-slate-700'
  }`;

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {busy ? 'جارٍ التنفيذ…' : label}
    </button>
  );
}
