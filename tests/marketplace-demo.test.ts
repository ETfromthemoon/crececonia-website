import { describe, expect, it } from "vitest";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";

describe("marketplace preview demo gate", () => {
  it("is available only in Vercel Preview", () => {
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "preview" })).toBe(true);
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "production" })).toBe(false);
    expect(marketplaceDemoAvailable({ VERCEL_ENV: "development" })).toBe(false);
    expect(marketplaceDemoAvailable({})).toBe(false);
  });
  it("keeps the production marketplace closed until explicitly enabled", () => {
    expect(marketplacePublicAvailable({ VERCEL_ENV: "preview" })).toBe(true);
    expect(marketplacePublicAvailable({ VERCEL_ENV: "production" })).toBe(false);
    expect(marketplacePublicAvailable({ VERCEL_ENV: "production", MARKETPLACE_PUBLIC_ENABLED: "true" })).toBe(true);
    expect(marketplacePublicAvailable({ VERCEL_ENV: "production", MARKETPLACE_PUBLIC_ENABLED: "false" })).toBe(false);
  });
});
