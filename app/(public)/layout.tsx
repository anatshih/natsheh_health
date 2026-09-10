import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader />
      <TatreezStrip />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

// شريط زخرفي رفيع أسفل الهيدر مباشرة، مستوحى من غرزة التطريز الفلسطيني
// (شكل معيّن متكرر بخيط أزرق ونقطة حمراء) — إشارة هوية عائلية خفيفة في كل
// صفحة عامة دون مبالغة بصرية (شفافية منخفضة، ارتفاع 10px فقط).
function TatreezStrip() {
  return (
    <svg className="block h-[10px] w-full" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="tatreez-strip" width="20" height="14" patternUnits="userSpaceOnUse">
          <path d="M10 1 L19 7 L10 13 L1 7Z" fill="none" stroke="#005CB6" strokeWidth="1" opacity="0.45" />
          <circle cx="10" cy="7" r="1.3" fill="#A8324A" opacity="0.75" />
        </pattern>
      </defs>
      <rect width="400" height="14" fill="url(#tatreez-strip)" />
    </svg>
  );
}
