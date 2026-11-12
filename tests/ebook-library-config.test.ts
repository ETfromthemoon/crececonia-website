import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createOpaqueToken, hashLibraryValue, isEbookLibraryEnabled, libraryRateKey, normalizeLibraryEmail } from "@/lib/ebook-library-config";

describe("ebook library security primitives",()=>{
  const prior={ enabled:process.env.EBOOK_LIBRARY_ENABLED, secret:process.env.EBOOK_LIBRARY_RATE_SECRET };
  afterEach(()=>{ if(prior.enabled===undefined)delete process.env.EBOOK_LIBRARY_ENABLED;else process.env.EBOOK_LIBRARY_ENABLED=prior.enabled; if(prior.secret===undefined)delete process.env.EBOOK_LIBRARY_RATE_SECRET;else process.env.EBOOK_LIBRARY_RATE_SECRET=prior.secret; });
  it("stays disabled without the explicit flag and a strong secret",()=>{
    delete process.env.EBOOK_LIBRARY_ENABLED; process.env.EBOOK_LIBRARY_RATE_SECRET="x".repeat(40); expect(isEbookLibraryEnabled()).toBe(false);
    process.env.EBOOK_LIBRARY_ENABLED="true"; delete process.env.EBOOK_LIBRARY_RATE_SECRET; expect(isEbookLibraryEnabled()).toBe(false);
    process.env.EBOOK_LIBRARY_RATE_SECRET="x".repeat(31); expect(isEbookLibraryEnabled()).toBe(false);
    process.env.EBOOK_LIBRARY_RATE_SECRET="x".repeat(32); expect(isEbookLibraryEnabled()).toBe(true);
  });
  it("normalizes valid email and rejects malformed/coercible input",()=>{expect(normalizeLibraryEmail("  TEST@Example.com ")).toBe("test@example.com");expect(normalizeLibraryEmail(["x@y.com"])).toBeNull();expect(normalizeLibraryEmail("not mail")).toBeNull();});
  it("creates opaque 32-byte tokens and stable one-way hashes",async()=>{const token=createOpaqueToken();expect(Buffer.from(token,"base64url")).toHaveLength(32);expect(await hashLibraryValue(token)).toMatch(/^[a-f0-9]{64}$/);expect(await hashLibraryValue(token)).toBe(await hashLibraryValue(token));});
  it("separates HMAC namespaces",async()=>{process.env.EBOOK_LIBRARY_RATE_SECRET="s".repeat(32);expect(await libraryRateKey("email","same")).not.toBe(await libraryRateKey("ip","same"));});
});
