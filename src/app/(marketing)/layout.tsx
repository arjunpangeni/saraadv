import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MobileBottomNav } from "@/components/marketing/mobile-bottom-nav";
import { MarketingScrollBlur } from "@/components/marketing/scroll-blur";
import { JsonLd } from "@/components/json-ld";
import { localBusinessJsonLd } from "@/lib/seo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />
      <MarketingScrollBlur />
      <SiteHeader />
      <div id="main-content" className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </>
  );
}
