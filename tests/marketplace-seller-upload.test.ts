import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => vi.fn());
const allowed = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/private-storage", () => ({ uploadPrivateObject: upload }));
vi.mock("@/lib/marketplace-seller-auth", () => ({
  sellerIdentityFromRequest: () => "33333333-3333-4333-8333-333333333333",
  sellerMutationAllowed: allowed,
}));

import { POST } from "@/app/api/marketplace/seller/books/[id]/assets/route";

const bookId = "22222222-2222-4222-8222-222222222222";
const revisionId = "44444444-4444-4444-8444-444444444444";
const context = { params: Promise.resolve({ id: bookId }) };

function uploadRequest(file: File, kind = "ebook_pdf") {
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", file);
  return new Request(`https://www.crececonia.cl/api/marketplace/seller/books/${bookId}/assets`, {
    method: "POST", body: form,
  });
}

beforeEach(() => {
  database.mockReset();
  upload.mockReset().mockResolvedValue({ error: null });
  allowed.mockReset().mockReturnValue(true);
});

describe("subida privada del autor", () => {
  it("rechaza solicitudes ajenas antes de leer el archivo", async () => {
    allowed.mockReturnValue(false);
    const bytes = new Uint8Array(120);
    const response = await POST(uploadRequest(new File([bytes], "libro.pdf", { type: "application/pdf" })), context);
    expect(response.status).toBe(403);
    expect(database).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("rechaza archivos que exceden el máximo antes de consultar Storage", async () => {
    const bytes = new Uint8Array(4 * 1024 * 1024 + 1);
    const response = await POST(uploadRequest(new File([bytes], "libro.pdf", { type: "application/pdf" })), context);
    expect(response.status).toBe(400);
    expect(database).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("guarda un PDF válido en cuarentena privada y asocia la revisión actual", async () => {
    database.mockResolvedValueOnce([{ revision_id: revisionId }]);
    database.mockResolvedValueOnce([{ id: "55555555-5555-4555-8555-555555555555" }]);
    const bytes = new Uint8Array(120).fill(65);
    bytes.set(new TextEncoder().encode("%PDF-"), 0);
    bytes.set(new TextEncoder().encode("%%EOF"), bytes.length - 5);
    const response = await POST(uploadRequest(new File([bytes], "libro.pdf", { type: "application/pdf" })), context);
    expect(response.status).toBe(201);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0]).toBe("ebooks");
    expect(upload.mock.calls[0][1]).toMatch(new RegExp(`^marketplace/quarantine/${bookId}/${revisionId}/[a-f0-9-]+\\.pdf$`));
    expect(database.mock.calls[1][0]).toContain("'quarantined'");
    expect(database.mock.calls[1][1][1]).toBe(revisionId);
  });
});
