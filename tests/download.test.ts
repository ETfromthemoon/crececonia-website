import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks deben declararse antes del import del módulo ──────────────────────
const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
vi.mock("fs", () => ({
  default: {
    existsSync: (...a: unknown[]) => mockExistsSync(...a),
    readFileSync: (...a: unknown[]) => mockReadFileSync(...a),
  },
  existsSync: (...a: unknown[]) => mockExistsSync(...a),
  readFileSync: (...a: unknown[]) => mockReadFileSync(...a),
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

// Helper: chain de Supabase
function dbChain(result: unknown) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "update", "single", "maybeSingle"].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  const p = Promise.resolve(result);
  (c as unknown as { then: typeof p.then }).then = p.then.bind(p);
  return c;
}

const FAKE_PDF = Buffer.from("%PDF-fake-content");

describe("GET /api/ebook/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(FAKE_PDF);
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

  // ── 8. PDF no existe aún ──────────────────────────────────────────────────
  it("503 cuando el PDF no está disponible en el servidor", async () => {
    mockFrom.mockReturnValue(dbChain({ data: { id: "uuid-3", email: "ok@test.com" } }));
    mockExistsSync.mockReturnValue(false);

    const res = await GET(req({ token: "tok_nopdf" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/preparad/i);
  });

  // ── 9. Flow API devuelve !ok ───────────────────────────────────────────────
  it("404 cuando Flow API devuelve status HTTP no-ok", async () => {
    mockFrom.mockReturnValue(dbChain({ data: null }));
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const res = await GET(req({ token: "tok_flow_500" }));
    expect(res.status).toBe(404);
  });
});
