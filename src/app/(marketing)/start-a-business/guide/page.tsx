import type { Metadata } from "next";
import { InvestorGuide } from "@/components/start-a-business/investor-guide";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default function StartABusinessGuidePage() {
  return (
    <main className="flex-1">
      <div className="container-page max-w-2xl py-20 sm:py-28">
        <InvestorGuide />
      </div>
    </main>
  );
}
