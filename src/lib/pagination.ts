export const PAGE_SIZE = 10;

export function parsePage(raw?: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function pageSkip(page: number, size = PAGE_SIZE) {
  return (page - 1) * size;
}

export function pageCount(total: number, size = PAGE_SIZE) {
  if (total <= 0) return 0;
  return Math.ceil(total / size);
}
