'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type Facet = {
  paramKey: 'category' | 'country' | 'branch';
  title: string;
  options: [string, number][];
};

// شريط تصفية تفاعلي: أول مجموعتين مفتوحتان افتراضيًا والباقي مطوي بعنوان
// مختصر يعرض عدد الخيارات المحددة، مع إمكانية الطي/الفرد لكل مجموعة محليًا
// (حالة العميل فقط) — التصفية نفسها تبقى عبر روابط عادية تُحدِّث الرابط
// فورًا بلا زر إضافي، مطابقةً لنمط بقية الموقع.
export default function DirectoryFilters({ facets }: { facets: Facet[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(facets.slice(0, 2).map((f) => f.paramKey))
  );

  function selectedFor(paramKey: string): string[] {
    return searchParams.getAll(paramKey);
  }

  function toggleOpen(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleHref(paramKey: string, value: string): string {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(paramKey);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    params.delete(paramKey);
    next.forEach((v) => params.append(paramKey, v));
    params.delete('page');
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const hasActive =
    Boolean(searchParams.get('q')) || facets.some((f) => selectedFor(f.paramKey).length > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">تصفية النتائج</h3>
        {hasActive && (
          <Link href={pathname} className="text-xs font-semibold text-slate-400 hover:text-primary">
            مسح الكل
          </Link>
        )}
      </div>

      {facets.map((facet) => {
        const selected = selectedFor(facet.paramKey);
        const isOpen = openKeys.has(facet.paramKey);
        return (
          <div key={facet.paramKey} className="border-b border-slate-100 py-3 last:border-0">
            <button
              type="button"
              onClick={() => toggleOpen(facet.paramKey)}
              className="flex w-full items-center justify-between gap-2 text-right"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                {facet.title}
                {selected.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {selected.length}
                  </span>
                )}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isOpen && (
              <div className="mt-2.5 space-y-1.5">
                {facet.options.map(([name, count]) => {
                  const checked = selected.includes(name);
                  return (
                    <Link
                      key={name}
                      href={toggleHref(facet.paramKey, name)}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary"
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                          checked ? 'border-primary bg-primary' : 'border-slate-300'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l2.5 2.5L10 3"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className={checked ? 'font-semibold text-primary' : ''}>{name}</span>
                      <span className="mr-auto text-[11px] text-slate-400">{count}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
