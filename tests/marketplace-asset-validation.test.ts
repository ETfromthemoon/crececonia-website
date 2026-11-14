import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateMarketplaceCover, validateMarketplacePdf } from "@/lib/marketplace-asset-validation";

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

describe("marketplace cover review", () => {
  it("accepts a matching PNG and rejects a substituted or oversized image", () => {
    const bytes = new Uint8Array(120);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 600);
    view.setUint32(20, 900);
    const digest = createHash("sha256").update(bytes).digest("hex");
    expect(validateMarketplaceCover(bytes, "image/png", bytes.length, digest)).toBeNull();
    expect(validateMarketplaceCover(bytes, "image/png", bytes.length, "0".repeat(64))).toMatch(/SHA-256/);
    view.setUint32(16, 100000);
    expect(validateMarketplaceCover(bytes, "image/png", bytes.length, createHash("sha256").update(bytes).digest("hex"))).toMatch(/portada/i);
  });
});
