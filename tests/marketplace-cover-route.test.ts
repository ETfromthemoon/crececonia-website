import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/marketplace-demo", () => ({
  marketplaceDemoAvailable: vi.fn(),
  marketplacePublicAvailable: vi.fn(),
}));
vi.mock("@/lib/marketplace-review", () => ({
  getPublishedMarketplaceCover: vi.fn(),
  readMarketplaceReviewAsset: vi.fn(),
}));

import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";
import { getPublishedMarketplaceCover, readMarketplaceReviewAsset } from "@/lib/marketplace-review";
import { GET } from "@/app/api/marketplace/covers/[bookId]/route";

const id = "11111111-1111-4111-8111-111111111111";
const request = new Request(`https://crececonia.cl/api/marketplace/covers/${id}`);
const context = { params: Promise.resolve({ bookId: id }) };

beforeEach(() => {
  vi.mocked(marketplaceDemoAvailable).mockReset().mockReturnValue(false);
  vi.mocked(marketplacePublicAvailable).mockReset().mockReturnValue(true);
  vi.mocked(getPublishedMarketplaceCover).mockReset().mockResolvedValue(null);
  vi.mocked(readMarketplaceReviewAsset).mockReset();
});

describe("public marketplace cover", () => {
  it("never consults storage in preview or while public launch is disabled", async () => {
    vi.mocked(marketplaceDemoAvailable).mockReturnValue(true);
    expect((await GET(request, context)).status).toBe(404);
    vi.mocked(marketplaceDemoAvailable).mockReturnValue(false);
    vi.mocked(marketplacePublicAvailable).mockReturnValue(false);
    expect((await GET(request, context)).status).toBe(404);
    expect(getPublishedMarketplaceCover).not.toHaveBeenCalled();
  });

  it("returns only an approved cover with no-store and image-only headers", async () => {
    vi.mocked(getPublishedMarketplaceCover).mockResolvedValue({
      id, book_id: id, revision_id: id, asset_kind: "cover", storage_key: "private",
      content_type: "image/png", byte_size: "120", sha256: "0".repeat(64), scan_status: "ready",
    });
    vi.mocked(readMarketplaceReviewAsset).mockResolvedValue(new Blob([new Uint8Array(120)]));
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(getPublishedMarketplaceCover).toHaveBeenCalledWith(id);
  });
});
