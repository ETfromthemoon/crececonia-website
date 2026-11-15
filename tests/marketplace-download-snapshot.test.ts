import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const download = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: download }));

import { createMarketplaceDownloadToken } from "@/lib/marketplace-checkout";
import { GET } from "@/app/api/marketplace/checkout/download/route";

const itemId = "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const secret = "x".repeat(32);

describe("marketplace paid PDF snapshot", () => {
  beforeEach(() => {
    vi.stubEnv("MARKETPLACE_DOWNLOAD_SECRET", secret);
    database.mockReset();
    download.mockReset();
  });

  it("delivers the exact PDF asset captured in the paid order", async () => {
    const bytes = Buffer.from("%PDF-1.4\nverified book");
    database.mockResolvedValue([{ storage_key: "approved/book.pdf", title: "Libro", byte_size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex") }]);
    download.mockResolvedValue({ data: new Blob([bytes]), error: null });
    const token = createMarketplaceDownloadToken(itemId, Date.now() + 60_000, secret);
    const response = await GET(new Request(`https://example.cl/api/marketplace/checkout/download?token=${token}`));
    expect(response.status).toBe(200);
    expect(await response.arrayBuffer()).toEqual(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    expect(database.mock.calls[0][0]).toContain("a.id=i.pdf_asset_id");
    expect(database.mock.calls[0][0]).not.toContain("order by a.created_at");
    expect(download).toHaveBeenCalledWith("ebooks", "approved/book.pdf");
  });
});
