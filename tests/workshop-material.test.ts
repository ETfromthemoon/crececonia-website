import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockDownload, mockVerify } = vi.hoisted(() => ({ mockRpc: vi.fn(), mockDownload: vi.fn(), mockVerify: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: mockDownload }));
vi.mock("@/lib/workshop-access", () => ({ verifyWorkshopAccessToken: mockVerify }));

import { GET } from "@/app/api/workshop/material/route";

describe("GET /api/workshop/material", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerify.mockReturnValue("workshop-123-abcdef");
    mockRpc.mockResolvedValue({ data: [{ flow_token: "flow-1" }], error: null });
    mockDownload.mockResolvedValue({ data: new Blob(["resource"]), error: null });
  });

  it("sirve únicamente recursos permitidos a una compra pagada", async () => {
    const response = await GET(new Request("https://crececonia.cl/api/workshop/material?token=signed&asset=slides"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mockDownload).toHaveBeenCalledWith("workshop-assets", "workshop-2026-09-06/slides-taller-claude-desktop.html");
  });

  it("rechaza claves de archivo fuera del allowlist", async () => {
    const response = await GET(new Request("https://crececonia.cl/api/workshop/material?token=signed&asset=../../secret"));
    expect(response.status).toBe(404);
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("rechaza accesos sin firma válida", async () => {
    mockVerify.mockReturnValue(null);
    const response = await GET(new Request("https://crececonia.cl/api/workshop/material?asset=skills"));
    expect(response.status).toBe(401);
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
