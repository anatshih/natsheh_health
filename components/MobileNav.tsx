'use client';

import { useState } from 'react';
import Link from 'next/link';

// قائمة همبرغر منسدلة لشاشات الهاتف — الشريط العلوي (SiteHeader) يخفي روابط
// التنقل الأفقية تحت sm، وهذا المكوّن يعوّضها بقائمة يمكن الوصول إليها فعليًا
// (القسم 50: معظم الزوار يصلون عبر واتساب على الهاتف).
export default function MobileNav({
  links,
  accountHref,
  accountLabel,
}: {
  links: { href: string; label: string }[];
  accountHref: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <nav className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 hover:bg-slate-50 hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-center text-white hover:bg-primary-dark"
            >
              {accountLabel}
            </Link>
          </nav>
        </div>
      )}
    </div>
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
