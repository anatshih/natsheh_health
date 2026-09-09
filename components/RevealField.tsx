'use client';

import { useState } from 'react';

// إخفاء رقم الهاتف/الواتساب خلف زر إظهار بدل عرضه مباشرة كنص/رابط قابل للحصاد
// الآلي — القيمة نفسها لا تُرسَل أصلاً إن لم يسمح صاحبها بعرضها (تُصفَّى عند
// المصدر في View directory_public)، فهذا تحسين تجربة استخدام لا حماية إضافية.
export default function RevealField({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      {revealed ? (
        <p dir="ltr" className="text-left text-sm font-semibold text-slate-900">
          {value}
        </p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          اضغط لإظهار الرقم
        </button>
      )}
    </div>
  );
}
