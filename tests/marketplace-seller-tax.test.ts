import { describe, expect, it } from "vitest";
import { normalizeChileanRut } from "@/lib/marketplace-seller-tax";

describe("seller RUT validation", () => {
  it("accepts valid RUTs and normalizes separators", () => {
    expect(normalizeChileanRut("12.345.678-5")).toBe("12345678-5");
    expect(normalizeChileanRut("76.543.210-3")).toBe("76543210-3");
  });
  it("rejects invalid check digits and malformed values", () => {
    expect(normalizeChileanRut("12.345.678-9")).toBeNull();
    expect(normalizeChileanRut("not-a-rut")).toBeNull();
    expect(normalizeChileanRut("1-9")).toBeNull();
  });
});
