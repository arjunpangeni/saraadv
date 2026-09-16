import Script from "next/script";
import { ga4InitScript } from "@/lib/csp-inline-scripts";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

function isGa4Id(value: string) {
  return /^G-[A-Z0-9]+$/.test(value);
}

export function GoogleAnalytics() {
  if (!isGa4Id(MEASUREMENT_ID)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {ga4InitScript(MEASUREMENT_ID)}
      </Script>
    </>
  );
}
