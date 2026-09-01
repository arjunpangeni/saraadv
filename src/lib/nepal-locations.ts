import adminData from "@/lib/nepal-admin-data.json";

export const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
] as const;

export type NepalProvince = (typeof NEPAL_PROVINCES)[number];

const data = adminData as {
  districtsByProvince: Record<string, string[]>;
  localBodiesByDistrict: Record<string, string[]>;
};

export const NEPAL_DISTRICTS_BY_PROVINCE = data.districtsByProvince;

export const NEPAL_DISTRICTS = Object.values(data.districtsByProvince)
  .flat()
  .slice()
  .sort((a, b) => a.localeCompare(b));

export const OTHER_LOCAL_BODY = "Other / not listed";

export const REVENUE_THRESHOLD_OPTIONS = [
  { value: "", label: "Any revenue" },
  { value: "10000000", label: "Above Rs 1 Crore" },
  { value: "50000000", label: "Above Rs 5 Crore" },
  { value: "100000000", label: "Above Rs 10 Crore" },
  { value: "500000000", label: "Above Rs 50 Crore" },
] as const;

export function districtsInProvince(province: string): string[] {
  return data.districtsByProvince[province] ?? [];
}

export function provinceOfDistrict(district: string): string {
  if (!district) return "";
  for (const [province, districts] of Object.entries(data.districtsByProvince)) {
    if (districts.includes(district)) return province;
  }
  return "";
}

export function localBodiesInDistrict(district: string): string[] {
  return data.localBodiesByDistrict[district] ?? [];
}

export function isKnownDistrict(district: string): boolean {
  return NEPAL_DISTRICTS.includes(district);
}

export const NEPAL_MOBILE = /^(97|98)\d{8}$/;

export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function nonNegativeAmount(value: string): string {
  if (value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0";
  return value;
}

export function promoterCountValue(value: string, min: number): string {
  if (value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(min);
  return String(Math.max(min, Math.floor(n)));
}
