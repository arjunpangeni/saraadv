import { describe, expect, it } from "vitest";
import { maskPhone, normalizeNepalMobile, normalizePhone, sanitizePhoneInput } from "@/lib/phone";

describe("normalizeNepalMobile", () => {
  it("accepts 10-digit Nepal mobiles", () => {
    expect(normalizeNepalMobile("9812345678")).toBe("9812345678");
    expect(normalizeNepalMobile("9712345678")).toBe("9712345678");
  });

  it("accepts +977 prefix", () => {
    expect(normalizeNepalMobile("+977 9812345678")).toBe("9812345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeNepalMobile("12345")).toBeNull();
    expect(normalizeNepalMobile("8812345678")).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("accepts international numbers", () => {
    expect(normalizePhone("+977 9812345678")).toBe("9779812345678");
    expect(normalizePhone("+1 (415) 555-0100")).toBe("14155550100");
  });

  it("rejects numbers that are too short or too long", () => {
    expect(normalizePhone("123456")).toBeNull();
    expect(normalizePhone("1".repeat(16))).toBeNull();
  });
});

describe("sanitizePhoneInput", () => {
  it("strips letters and limits local numbers to 15 digits", () => {
    expect(sanitizePhoneInput("98ab12cd3456")).toBe("98123456");
    expect(sanitizePhoneInput("14155550100")).toBe("14155550100");
  });

  it("allows an optional leading plus for country code", () => {
    expect(sanitizePhoneInput("+9779812345678")).toBe("+9779812345678");
    expect(sanitizePhoneInput("+1415555abc0100")).toBe("+14155550100");
  });
});

describe("maskPhone", () => {
  it("masks the middle digits", () => {
    expect(maskPhone("9812345678")).toBe("+981****678");
    expect(maskPhone("+14155550100")).toBe("+141****100");
  });
});
