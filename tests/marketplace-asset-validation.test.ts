import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateMarketplacePdf } from "@/lib/marketplace-asset-validation";

function pdfBytes() {
  return new TextEncoder().encode(`%PDF-1.7\n${"A".repeat(120)}\n%%EOF`);
}

describe("marketplace PDF review", () => {
  it("accepts a PDF whose bytes match the recorded size and digest", () => {
    const bytes = pdfBytes();
    const digest = createHash("sha256").update(bytes).digest("hex");
    expect(validateMarketplacePdf(bytes, bytes.length, digest)).toBeNull();
  });

  it("rejects a replaced or truncated private object", () => {
    const bytes = pdfBytes();
    const digest = createHash("sha256").update(bytes).digest("hex");
    expect(validateMarketplacePdf(bytes, bytes.length + 1, digest)).toMatch(/tamaño/i);
    expect(validateMarketplacePdf(bytes, bytes.length, "0".repeat(64))).toMatch(/SHA-256/);
    expect(validateMarketplacePdf(bytes.subarray(0, bytes.length - 6), bytes.length - 6, digest)).toMatch(/final/i);
  });

  it("rejects content that is not a PDF even with a matching digest", () => {
    const bytes = new TextEncoder().encode(`<html>${"A".repeat(120)}%%EOF`);
    const digest = createHash("sha256").update(bytes).digest("hex");
    expect(validateMarketplacePdf(bytes, bytes.length, digest)).toMatch(/PDF/);
  });
});
