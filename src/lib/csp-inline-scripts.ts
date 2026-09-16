import { createHash } from "crypto";
import { THEME_INIT_SCRIPT } from "./theme-script";

/** Must stay identical to the GA inline script rendered in GoogleAnalytics. */
export function ga4InitScript(measurementId: string) {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`;
}

export function cspSha256(content: string) {
  return `'sha256-${createHash("sha256").update(content).digest("base64")}'`;
}

export function inlineScriptHashes(gaMeasurementId?: string | null) {
  const hashes = [cspSha256(THEME_INIT_SCRIPT)];
  const gaId = gaMeasurementId?.trim() ?? "";
  if (/^G-[A-Z0-9]+$/.test(gaId)) {
    hashes.push(cspSha256(ga4InitScript(gaId)));
  }
  return hashes;
}
