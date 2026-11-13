import { describe, expect, it } from "vitest";
import { marketplaceDemoAvailable } from "@/lib/marketplace-demo";

describe("marketplace preview demo gate", () => {
  it("is available only in Vercel Preview", () => {
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "preview" })).toBe(true);
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "production" })).toBe(false);
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "development" })).toBe(false);
    expect(marketplaceDemoAvailable({})).toBe(false);
  });
});
