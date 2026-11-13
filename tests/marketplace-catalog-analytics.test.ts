import { describe, expect, it } from "vitest";
import { catalogResultBucket, searchLengthBucket } from "@/lib/marketplace/catalog-analytics";

describe("marketplace catalog analytics dimensions", () => {
  it("sends only a length bucket, never a search term", () => {
    expect(searchLengthBucket("  ")).toBeNull();
    expect(searchLengthBucket("IA")).toBe("1-3");
    expect(searchLengthBucket("Claude")).toBe("4-8");
    expect(searchLengthBucket("agentes de IA")).toBe("9-20");
    expect(searchLengthBucket("automatización para negocios")).toBe("21+");
  });

  it("uses bounded result dimensions", () => {
    expect([0, 1, 4, 25].map(catalogResultBucket)).toEqual(["0", "1", "2-5", "6+"]);
  });
});
