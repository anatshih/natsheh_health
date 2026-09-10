'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type PendingCounts = {
  applications: number;
  changeRequests: number;
  deletionRequests: number;
  passwordResets: number;
};

const REQUEST_LINKS = [
  { href: '/admin/applications', label: 'طلبات الانضمام', key: 'applications' as const },
  { href: '/admin/change-requests', label: 'طلبات التعديل', key: 'changeRequests' as const },
  { href: '/admin/password-resets', label: 'استعادة الحسابات', key: 'passwordResets' as const },
  { href: '/admin/deletion-requests', label: 'طلبات الحذف', key: 'deletionRequests' as const },
];

const DASHBOARD_LINK = { href: '/admin', label: 'لوحة المؤشرات', exact: true };

// شريط تنقّل لوحة الإدارة: يجمع شاشات "الطلبات" الأربع (كانت متناثرة بلا
// تجميع) تحت قائمة منسدلة واحدة بشارة عدد إجمالية، ويوحّد "الإحصائيات"
// و"التقارير" في رابط واحد (كلاهما يعرض AdminSectionTabs للتبديل بينهما
// أصلاً)، مع تمييز الرابط النشط (aria-current) ودرج جوّال للشاشات الضيقة.
export default function AdminNav({ counts }: { counts: PendingCounts }) {
  const pathname = usePathname();
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const requestsRef = useRef<HTMLDivElement>(null);

  const requestsTotal =
    counts.applications + counts.changeRequests + counts.deletionRequests + counts.passwordResets;
  const isRequestsActive = REQUEST_LINKS.some((l) => pathname.startsWith(l.href));
  const isStatsActive = pathname.startsWith('/admin/statistics') || pathname.startsWith('/admin/reports');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (requestsRef.current && !requestsRef.current.contains(e.target as Node)) {
        setRequestsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function linkClass(active: boolean) {
    return `rounded-lg px-3 py-1.5 ${
      active ? 'bg-primary-soft font-bold text-primary' : 'text-slate-600 hover:text-primary'
    }`;
  }

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm font-semibold sm:flex">
        <Link
          href={DASHBOARD_LINK.href}
          aria-current={isActive(DASHBOARD_LINK.href, DASHBOARD_LINK.exact) ? 'page' : undefined}
          className={linkClass(isActive(DASHBOARD_LINK.href, DASHBOARD_LINK.exact))}
        >
          {DASHBOARD_LINK.label}
        </Link>

        <div ref={requestsRef} className="relative">
          <button
            type="button"
            onClick={() => setRequestsOpen((v) => !v)}
            aria-expanded={requestsOpen}
            className={`flex items-center gap-1.5 ${linkClass(isRequestsActive)}`}
          >
            الطلبات
            {requestsTotal > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                {requestsTotal}
              </span>
            )}
            <ChevronIcon />
          </button>
          {requestsOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
              {REQUEST_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setRequestsOpen(false)}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-semibold ${
                    isActive(l.href) ? 'bg-primary-soft text-primary' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                  {counts[l.key] > 0 && (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {counts[l.key]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/admin/settings" aria-current={isActive('/admin/settings') ? 'page' : undefined} className={linkClass(isActive('/admin/settings'))}>
          ثوابت النظام
        </Link>
        <Link href="/admin/statistics" aria-current={isStatsActive ? 'page' : undefined} className={linkClass(isStatsActive)}>
          التقارير
        </Link>
        <Link href="/admin/users" aria-current={isActive('/admin/users') ? 'page' : undefined} className={linkClass(isActive('/admin/users'))}>
          المستخدمون
        </Link>
      </nav>

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        {mobileOpen && (
          <div className="absolute inset-x-0 top-full z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-1 text-sm font-semibold">
              <Link
                href={DASHBOARD_LINK.href}
                onClick={() => setMobileOpen(false)}
                className={linkClass(isActive(DASHBOARD_LINK.href, DASHBOARD_LINK.exact))}
              >
                {DASHBOARD_LINK.label}
              </Link>
              <p className="mt-2 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">الطلبات</p>
              {REQUEST_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between ${linkClass(isActive(l.href))}`}
                >
                  {l.label}
                  {counts[l.key] > 0 && (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {counts[l.key]}
                    </span>
                  )}
                </Link>
              ))}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <Link href="/admin/settings" onClick={() => setMobileOpen(false)} className={linkClass(isActive('/admin/settings'))}>
                  ثوابت النظام
                </Link>
                <Link href="/admin/statistics" onClick={() => setMobileOpen(false)} className={linkClass(isStatsActive)}>
                  التقارير
                </Link>
                <Link href="/admin/users" onClick={() => setMobileOpen(false)} className={linkClass(isActive('/admin/users'))}>
                  المستخدمون
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
