import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks deben declararse antes del import del módulo ──────────────────────
const mockFrom = vi.fn();
// El PDF ya no se lee del disco sino de Supabase Storage (ver
// lib/ebook-storage.ts): leerlo del disco solo funcionaba con deploys por CLI,
// porque /private está gitignoreado y la integración de Git de Vercel
// construye desde el repositorio.
const mockStorageDownload = vi.fn();
const mockStorageFrom = vi.fn(() => ({ download: mockStorageDownload }));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom, storage: { from: mockStorageFrom } }),
}));

// Mock global fetch para llamadas a Flow
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── import DESPUÉS de los mocks ──────────────────────────────────────────────
import { GET } from "@/app/api/ebook/download/route";

// Helper: construye un Request de Next.js
function req(params: Record<string, string>) {
  const url = new URL("https://test.com/api/ebook/download");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

// Helper: chain de Supabase.
//
// La búsqueda de la compra usa `.limit(1)`, que resuelve a un ARRAY de filas
// (no a un objeto como maybeSingle). `dbChain` acepta la forma cómoda
// `{ data: fila }` y la envuelve en array automáticamente, para que cada test
// siga leyéndose como "esta es la fila que hay en la base".
function dbChain(result: { data: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "update", "single", "maybeSingle", "limit"].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  const rows = result.data === null ? [] : [result.data];
  const p = Promise.resolve({ ...result, data: rows });
  (c as unknown as { then: typeof p.then }).then = p.then.bind(p);
  return c;
}

/** Chain que devuelve una lista cruda de filas (para el caso de 0 filas). */
function dbChainRows(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "update", "single", "maybeSingle", "limit"].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  const p = Promise.resolve({ data: rows });
  (c as unknown as { then: typeof p.then }).then = p.then.bind(p);
  return c;
}

const FAKE_PDF = Buffer.from("%PDF-fake-content");

/** Simula que el PDF existe en Storage. */
function storageConArchivo() {
  mockStorageDownload.mockResolvedValue({
    data: { arrayBuffer: async () => FAKE_PDF },
    error: null,
  });
}

/** Simula que el PDF NO está en Storage (bucket vacío o nombre distinto). */
function storageSinArchivo() {
  mockStorageDownload.mockResolvedValue({ data: null, error: { message: "Object not found" } });
}

describe("GET /api/ebook/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageConArchivo();
  });

  // ── 1. Sin parámetros ──────────────────────────────────────────────────────
  it("400 cuando no se pasan parámetros", async () => {
    const res = await GET(req({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/parámetros/i);
  });

  // ── 2. Token encontrado en DB ──────────────────────────────────────────────
  it("200 + PDF cuando el token está en ebook_purchases", async () => {
    mockFrom.mockReturnValue(dbChain({ data: { id: "uuid-1", email: "test@test.com" } }));

    const res = await GET(req({ token: "tok_valido" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
  });

  // ── 3. Email encontrado en DB ──────────────────────────────────────────────
  it("200 + PDF cuando el email está en ebook_purchases", async () => {
    mockFrom.mockReturnValue(dbChain({ data: { id: "uuid-2", email: "sergio@test.com" } }));

    const res = await GET(req({ email: "sergio@test.com" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  // ── 4. Token NO en DB pero Flow confirma pago (webhook delayed) ───────────
  it("200 + PDF cuando token no está en DB pero Flow confirma status=2", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 2 }),
    });

    const res = await GET(req({ token: "tok_flow_paid" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  // ── 5. Token NO en DB y Flow dice no pagado ────────────────────────────────
  it("404 cuando token no está en DB y Flow no confirma pago", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 1 }),  // pendiente
    });

    const res = await GET(req({ token: "tok_unpaid" }));
    expect(res.status).toBe(404);
  });

  // ── 6. Token NO en DB, Flow falla (network error) ─────────────────────────
  it("404 cuando token no está en DB y Flow API lanza error", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));
    mockFetch.mockRejectedValue(new Error("Network error"));

    const res = await GET(req({ token: "tok_network_err" }));
    expect(res.status).toBe(404);
  });

  // ── 7. Email NO en DB (sin fallback a Flow) ────────────────────────────────
  it("404 cuando se usa email y no hay compra registrada", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));

    const res = await GET(req({ email: "noexiste@test.com" }));
    expect(res.status).toBe(404);
  });

  // ── 8. PDF no está en Storage ─────────────────────────────────────────────
  it("503 cuando el PDF no está en Storage", async () => {
    mockFrom.mockReturnValue(dbChain({ data: { id: "uuid-3", email: "ok@test.com" } }));
    storageSinArchivo();

    const res = await GET(req({ token: "tok_nopdf" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/preparad/i);
  });

  // Regresión: una compra válida con el PDF en Storage tiene que entregar el
  // archivo. Este es el caso que estuvo roto en producción sin que ningún test
  // lo notara, porque el PDF se leía del disco y los tests mockeaban `fs`
  // devolviendo siempre `true` — o sea simulaban un disco que en el deploy real
  // no tenía los archivos.
  it("baja el PDF del bucket privado y lo entrega con el nombre correcto", async () => {
    mockFrom.mockReturnValue(dbChain({ data: { id: "uuid-9", email: "ok@test.com" } }));

    const res = await GET(req({ email: "ok@test.com", format: "a4" }));

    expect(res.status).toBe(200);
    expect(mockStorageFrom).toHaveBeenCalledWith("ebooks");
    expect(mockStorageDownload).toHaveBeenCalledWith("libro-a4.pdf");
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("De-cero-a-Claude-en-una-semana-A4.pdf");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(FAKE_PDF);
  });

  // ── 9. Flow API devuelve !ok ───────────────────────────────────────────────
  it("404 cuando Flow API devuelve status HTTP no-ok", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const res = await GET(req({ token: "tok_flow_500" }));
    expect(res.status).toBe(404);
  });

  // ── 10. resource param desambigua compras combo con el mismo flow_token ───
  it("filtra por resource además de flow_token (necesario para combos)", async () => {
    const chain = dbChain({ data: { id: "uuid-4", email: "combo@test.com" } });
    mockFrom.mockReturnValue(chain);

    await GET(req({ token: "tok_combo", resource: "ebook:agentes-de-ia" }));
    expect(chain.eq).toHaveBeenCalledWith("flow_token", "tok_combo");
    expect(chain.eq).toHaveBeenCalledWith("resource", "ebook:agentes-de-ia");
  });

  it("usa el libro por defecto cuando no viene ?resource= (compatibilidad)", async () => {
    const chain = dbChain({ data: { id: "uuid-5", email: "test@test.com" } });
    mockFrom.mockReturnValue(chain);

    const res = await GET(req({ token: "tok_valido" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("De-cero-a-Claude-en-una-semana");
  });

  // ── 11. Recuperación por email: SIEMPRE filtra por resource ───────────────
  //
  // Acá vivía un test que afirmaba lo contrario ("no filtra por resource
  // cuando la búsqueda es por email"), y por eso este bug llegó a producción
  // con la suite en verde: el test codificaba la suposición equivocada.
  //
  // El daño real, verificado en producción antes del fix: alguien que compró
  // SOLO "Claude a Nivel Experto" recuperaba con su email y recibía el PDF
  // del libro 1 (1.790.473 bytes) — ni recibía lo que pagó, ni debía recibir
  // gratis un libro que no compró.
  it("filtra por resource también cuando la búsqueda es por email", async () => {
    const chain = dbChain({ data: { id: "uuid-6", email: "sergio@test.com" } });
    mockFrom.mockReturnValue(chain);

    await GET(req({ email: "sergio@test.com", resource: "ebook:claude-nivel-experto" }));
    expect(chain.eq).toHaveBeenCalledWith("email", "sergio@test.com");
    expect(chain.eq).toHaveBeenCalledWith("resource", "ebook:claude-nivel-experto");
  });

  it("entrega el PDF del libro pedido por email, no el del libro 1", async () => {
    const chain = dbChain({ data: { id: "uuid-7", email: "sergio@test.com" } });
    mockFrom.mockReturnValue(chain);

    const res = await GET(
      req({ email: "sergio@test.com", resource: "ebook:claude-nivel-experto", format: "a4" })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("Claude-a-Nivel-Experto");
    expect(res.headers.get("Content-Disposition")).not.toContain("De-cero-a-Claude");
    expect(mockStorageDownload).toHaveBeenCalledWith("claude-nivel-experto-a4.pdf");
  });

  it("404 por email cuando esa persona no compró ESE libro (aunque haya comprado otro)", async () => {
    // La query filtra por (email, resource): si compró otro libro, esta
    // consulta no devuelve filas y no corresponde entregar nada.
    mockFrom.mockReturnValue(dbChainRows([]));

    const res = await GET(
      req({ email: "sergio@test.com", resource: "ebook:agentes-de-ia" })
    );
    expect(res.status).toBe(404);
  });

  it("no rompe cuando hay 2 filas del mismo libro y email (compró dos veces)", async () => {
    // Antes esto usaba maybeSingle(), que falla con más de una fila y
    // devolvía 404 a alguien que sí había pagado.
    mockFrom.mockReturnValue(
      dbChainRows([{ id: "uuid-8a", email: "dos@test.com" }])
    );

    const res = await GET(
      req({ email: "dos@test.com", resource: "ebook:claude-nivel-experto" })
    );
    expect(res.status).toBe(200);
  });
});
