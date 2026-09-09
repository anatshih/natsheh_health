'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white"
    >
      طباعة / حفظ كـ PDF
    </button>
  );
}
