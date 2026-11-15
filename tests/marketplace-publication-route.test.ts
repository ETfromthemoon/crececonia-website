import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const adminRequest = vi.hoisted(() => vi.fn());
const moderate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin-session", () => ({ isAdminRequest: adminRequest }));
vi.mock("@/lib/marketplace-review", () => ({ moderateMarketplaceBook: moderate }));

import { POST } from "@/app/api/admin/marketplace/route";

const url = "https://crececonia.cl/api/admin/marketplace";
function request(fields: Record<string, string>) {
  return new Request(url, { method: "POST", body: new URLSearchParams(fields) });
}

describe("verificación final de publicación", () => {
  beforeEach(() => {
    adminRequest.mockReset().mockReturnValue(true);
    moderate.mockReset().mockResolvedValue(true);
  });

  it("rechaza el formulario sin sesión administrativa", async () => {
    adminRequest.mockReturnValue(false);
    expect((await POST(request({ action: "verify_publication" }))).status).toBe(401);
    expect(moderate).not.toHaveBeenCalled();
  });

  it("entrega las cinco confirmaciones al control de dominio", async () => {
    const response = await POST(request({
      action: "verify_publication", book_id: "book", revision_id: "revision",
      reason: "Evidencia tributaria y archivos revisados",
      confirm_identity: "yes", confirm_tax: "yes", confirm_rights: "yes",
      confirm_pdf: "yes", confirm_cover: "yes",
    }));
    expect(response.status).toBe(303);
    expect(moderate).toHaveBeenCalledWith({
      action: "verify_publication", bookId: "book", revisionId: "revision",
      reason: "Evidencia tributaria y archivos revisados",
      publicationChecks: { identity: true, tax: true, rights: true, pdf: true, cover: true },
    });
  });

  it("no convierte un control omitido en confirmado", async () => {
    await POST(request({ action: "verify_publication", book_id: "book", revision_id: "revision",
      reason: "Evidencia tributaria y archivos revisados", confirm_identity: "yes",
      confirm_tax: "yes", confirm_rights: "yes", confirm_cover: "yes" }));
    expect(moderate.mock.calls[0][0].publicationChecks.pdf).toBe(false);
  });
});
