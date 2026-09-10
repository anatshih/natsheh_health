'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type Facet = {
  paramKey: 'category' | 'specialty' | 'country' | 'city';
  title: string;
  options: [string, number][];
};

type OpenPanel = { paramKey: string; top: number; left: number };

// شريط تصفية أفقي بشرائح منسدلة (بدل صندوق جانبي): كل مجموعة شريحة تحمل
// عنوانها وعدّاد الخيارات المحددة، وتُفتح كقائمة منبثقة عند الضغط عليها.
// التصفية نفسها تبقى عبر روابط عادية تُحدِّث النتائج فورًا بلا زر إضافي.
// صف واحد قابل للتمرير الأفقي (لا التفاف لعدة أسطر) ليعمل بشكل مريح على
// الجوال أيضًا. القائمة المنبثقة تُرسَم بموضع "fixed" محسوبًا من إحداثيات
// الشريحة نفسها (لا "absolute" داخل صف التمرير) لأن overflow-x-auto على
// الصف يفرض قصّ (clip) أي عنصر يفيض رأسيًا عنه أيضًا — قيد معروف في CSS.
export default function DirectoryFilters({ facets }: { facets: Facet[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<OpenPanel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: Event) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenPanel(null);
    }
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', () => setOpenPanel(null), true);
    window.addEventListener('resize', () => setOpenPanel(null));
    return () => {
      document.removeEventListener('mousedown', close);
    };
  }, []);

  function selectedFor(paramKey: string): string[] {
    return searchParams.getAll(paramKey);
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

  function toggleOpen(e: React.MouseEvent<HTMLButtonElement>, paramKey: string) {
    if (openPanel?.paramKey === paramKey) {
      setOpenPanel(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left, 12), window.innerWidth - 256 - 12);
    setOpenPanel({ paramKey, top: rect.bottom + 6, left });
  }

  const hasActive =
    Boolean(searchParams.get('q')) || facets.some((f) => selectedFor(f.paramKey).length > 0);
  const openFacet = facets.find((f) => f.paramKey === openPanel?.paramKey);

  return (
    <>
      <div ref={containerRef} className="mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        {facets.map((facet) => {
          const selected = selectedFor(facet.paramKey);
          const isOpen = openPanel?.paramKey === facet.paramKey;
          return (
            <button
              key={facet.paramKey}
              type="button"
              onClick={(e) => toggleOpen(e, facet.paramKey)}
              aria-expanded={isOpen}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                selected.length > 0
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-slate-300 text-slate-600 hover:border-primary hover:text-primary'
              }`}
            >
              {facet.title}
              {selected.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {selected.length}
                </span>
              )}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}

        {hasActive && (
          <Link
            href={pathname}
            className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:border-accent hover:text-accent"
          >
            ✕ مسح الكل
          </Link>
        )}
      </div>

      {openPanel && openFacet && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: openPanel.top, left: openPanel.left }}
          className="z-30 max-h-72 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {openFacet.options.length === 0 && (
            <p className="p-2 text-xs text-slate-400">لا خيارات ضمن التصفية الحالية.</p>
          )}
          {openFacet.options.map(([name, count]) => {
            const checked = selectedFor(openFacet.paramKey).includes(name);
            return (
              <Link
                key={name}
                href={toggleHref(openFacet.paramKey, name)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
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
                <span className={`flex-1 truncate ${checked ? 'font-semibold text-primary' : ''}`}>{name}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{count}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
