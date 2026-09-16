import { randomInt } from "crypto";

/**
 * Generates anonymized public identifiers that mask corporate identity
 * during initial marketplace discovery (blueprint Module A).
 *
 *   Buy/Sell listings -> ASAR-MA-102
 *   Project Bank items -> ASAR-PB-047
 */
export function generateHashId(prefix: "MA" | "PB"): string {
  const n = randomInt(100, 999);
  return `ASAR-${prefix}-${n}`;
}

/** Retries generateHashId against a uniqueness-check function until a free id is found. */
export async function generateUniqueHashId(
  prefix: "MA" | "PB",
  isTaken: (hashId: string) => Promise<boolean>,
  maxAttempts = 20
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateHashId(prefix);
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Unable to generate a unique hash id after several attempts");
}
