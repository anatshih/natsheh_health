'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type PaginationProps = {
  page: number;
  totalPages: number;
  // عند توفره: أزرار تستدعي onPageChange (لمكوّنات العميل التي تحتفظ برقم
  // الصفحة في حالة محلية، مثل قائمة المسجَّلين). بدونه: روابط تعتمد على
  // searchParams الحالية في الرابط (للصفحات التي تُحمَّل من الخادم حسب رقم
  // الصفحة في الرابط، مثل التقارير وطلبات الانضمام).
  onPageChange?: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const btnClass = (disabled: boolean) =>
    `rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold ${
      disabled ? 'pointer-events-none opacity-40' : 'text-slate-700 hover:border-primary hover:text-primary'
    }`;

  if (onPageChange) {
    return (
      <div className="mt-4 flex items-center justify-center gap-3 text-xs">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={prevDisabled} className={btnClass(prevDisabled)}>
          السابق
        </button>
        <span className="text-slate-500">
          صفحة {page} من {totalPages}
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={nextDisabled} className={btnClass(nextDisabled)}>
          التالي
        </button>
      </div>
    );
  }

  function hrefFor(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(clamped));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-xs">
      <Link href={hrefFor(page - 1)} aria-disabled={prevDisabled} className={btnClass(prevDisabled)}>
        السابق
      </Link>
      <span className="text-slate-500">
        صفحة {page} من {totalPages}
      </span>
      <Link href={hrefFor(page + 1)} aria-disabled={nextDisabled} className={btnClass(nextDisabled)}>
        التالي
      </Link>
    </div>
  );
}
