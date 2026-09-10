import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader />
      <div className="h-[3px] w-full bg-gradient-to-l from-primary via-accent to-olive" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
