/** Normalize Nepal mobile to 10 digits (97xxxxxxxx / 98xxxxxxxx). */
export function normalizeNepalMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^977(97|98)\d{8}$/.test(digits)) return digits.slice(3);
  if (/^(97|98)\d{8}$/.test(digits)) return digits;
  return null;
}

/** Normalize to digits-only international number (7–15 digits, E.164 body). */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

/** Keep phone inputs numeric: optional leading +, then digits only. */
export function sanitizePhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  const plus = trimmed.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (plus) return `+${digits.slice(0, 15)}`;
  return digits.slice(0, 15);
}

export function maskPhone(raw: string): string {
  const digits = normalizePhone(raw) ?? raw.replace(/\D/g, "");
  if (digits.length < 6) return raw;
  return `+${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone) ?? phone.replace(/\D/g, "");
  if (!digits) return phone;
  return `+${digits}`;
}

/** @deprecated Use formatPhoneDisplay */
export function formatNepalMobileDisplay(phone: string): string {
  return formatPhoneDisplay(phone);
}
