import { describe, it, expect } from "vitest";
import {
  checkFdiNegativeList,
  checkShareholderConditions,
  checkFdiCapitalRequirement,
  generateChecklist,
  type StartABusinessInput,
  type RegulatoryRuleRecord,
} from "@/lib/rules/startABusiness";
import startABusinessRegistration from "../prisma/data/startABusinessRegistration.json";
import fdiNegativeList from "../prisma/data/fdiNegativeList.json";

const baseInput: StartABusinessInput = {
  objective: "SERVICE",
  businessType: "PRIVATE_LIMITED",
  fdiRequested: false,
  sectorTags: [],
  shareholders: [{ category: "NEPALI_CITIZEN", promoterCount: 2, committedCapital: 5_000_000 }],
  investment: { equityInvestment: 5_000_000, loanInvestment: 0 },
};

describe("FDI negative list check", () => {
  it("flags a selected negative-list activity", () => {
    const issues = checkFdiNegativeList(
      { ...baseInput, fdiRequested: true, fdiNegativeCodes: ["FDI-A"] },
      fdiNegativeList
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe("BLOCKER");
    expect(issues[0].code).toBe("FDI-A");
  });

  it("does not flag when no negative-list activity is selected", () => {
    const issues = checkFdiNegativeList(
      { ...baseInput, fdiRequested: true, sizeCategory: "LARGE", fdiNegativeCodes: [] },
      fdiNegativeList
    );
    expect(issues.length).toBe(0);
  });

  it("blocks FDI for micro and cottage industry size", () => {
    for (const sizeCategory of ["MICRO", "COTTAGE"] as const) {
      const issues = checkFdiNegativeList(
        { ...baseInput, fdiRequested: true, sizeCategory, fdiNegativeCodes: [] },
        fdiNegativeList
      );
      expect(issues.some((i) => i.code === "FDI-B")).toBe(true);
    }
  });

  it("allows FDI for small industry size when no negative-list activity is selected", () => {
    const issues = checkFdiNegativeList(
      { ...baseInput, fdiRequested: true, sizeCategory: "SMALL", fdiNegativeCodes: [] },
      fdiNegativeList
    );
    expect(issues.some((i) => i.code === "FDI-B")).toBe(false);
  });
});

describe("shareholder conditions", () => {
  it("blocks proprietorship with more than 1 owner", () => {
    const input: StartABusinessInput = {
      ...baseInput,
      businessType: "PROPRIETORSHIP",
      shareholders: [{ category: "NEPALI_CITIZEN", promoterCount: 2, committedCapital: 1 }],
    };
    const issues = checkShareholderConditions(input);
    expect(issues.some((i) => i.code === "SHAREHOLDER-PROP-MAX")).toBe(true);
  });

  it("blocks public limited with fewer than 7 shareholders", () => {
    const input: StartABusinessInput = {
      ...baseInput,
      businessType: "PUBLIC_LIMITED",
      shareholders: [{ category: "NEPALI_CITIZEN", promoterCount: 3, committedCapital: 1 }],
    };
    const issues = checkShareholderConditions(input);
    expect(issues.some((i) => i.code === "SHAREHOLDER-PUB-MIN")).toBe(true);
  });

  it("allows a compliant private limited setup", () => {
    const issues = checkShareholderConditions(baseInput);
    expect(issues.length).toBe(0);
  });
});

describe("FDI capital requirement", () => {
  it("blocks FDI for proprietorship", () => {
    const input: StartABusinessInput = { ...baseInput, businessType: "PROPRIETORSHIP", fdiRequested: true };
    const issues = checkFdiCapitalRequirement(input);
    expect(issues.some((i) => i.code === "FDI-NOT-ALLOWED-BUSINESS-TYPE")).toBe(true);
  });

  it("blocks FDI for trading objective", () => {
    const input: StartABusinessInput = { ...baseInput, objective: "TRADING", fdiRequested: true };
    const issues = checkFdiCapitalRequirement(input);
    expect(issues.some((i) => i.code === "FDI-NOT-ALLOWED-TRADING")).toBe(true);
  });

  it("blocks when capital is below the minimum FDI threshold", () => {
    const input: StartABusinessInput = {
      ...baseInput,
      fdiRequested: true,
      investment: { equityInvestment: 1_000_000, loanInvestment: 0 },
    };
    const issues = checkFdiCapitalRequirement(input);
    expect(issues.some((i) => i.code === "FDI-MIN-CAPITAL")).toBe(true);
  });

  it("allows FDI below Rs 2 crore when industry objective category is ICT", () => {
    const input: StartABusinessInput = {
      ...baseInput,
      fdiRequested: true,
      objectiveCategory: "ICT",
      investment: { equityInvestment: 500_000, loanInvestment: 0 },
    };
    const issues = checkFdiCapitalRequirement(input);
    expect(issues.some((i) => i.code === "FDI-MIN-CAPITAL")).toBe(false);
  });

  it("passes when capital meets the minimum and business type/objective allow FDI", () => {
    const input: StartABusinessInput = {
      ...baseInput,
      fdiRequested: true,
      investment: { equityInvestment: 25_000_000, loanInvestment: 0 },
    };
    const issues = checkFdiCapitalRequirement(input);
    expect(issues.length).toBe(0);
  });
});

describe("checklist generation", () => {
  const rules = startABusinessRegistration as RegulatoryRuleRecord[];

  it("always includes core incorporation steps", () => {
    const checklist = generateChecklist(rules, baseInput, false);
    const codes = checklist.map((c) => c.code);
    expect(codes).toContain("REG-02"); // OCR registration
    expect(codes).toContain("REG-03"); // IRD registration
    expect(codes).toContain("REG-26"); // SSF registration
  });

  it("excludes FDI-only steps when FDI is not requested", () => {
    const checklist = generateChecklist(rules, baseInput, false);
    expect(checklist.some((c) => c.code === "REG-01")).toBe(false);
    expect(checklist.some((c) => c.code === "REG-21")).toBe(false);
  });

  it("includes FDI steps when FDI is requested and allowed", () => {
    const input: StartABusinessInput = { ...baseInput, fdiRequested: true };
    const checklist = generateChecklist(rules, input, false);
    expect(checklist.some((c) => c.code === "REG-01")).toBe(true);
    expect(checklist.some((c) => c.code === "REG-21")).toBe(true);
  });

  it("includes IEE/EIA task only when required", () => {
    const withEnv = generateChecklist(rules, baseInput, true);
    const withoutEnv = generateChecklist(rules, baseInput, false);
    expect(withEnv.some((c) => c.code === "REG-19")).toBe(true);
    expect(withoutEnv.some((c) => c.code === "REG-19")).toBe(false);
  });

  it("returns a sorted, non-empty checklist", () => {
    const checklist = generateChecklist(rules, baseInput, false);
    expect(checklist.length).toBeGreaterThan(0);
    const sortOrders = checklist.map((c) => rules.find((r) => r.code === c.code)!.sortOrder);
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b));
  });
});
