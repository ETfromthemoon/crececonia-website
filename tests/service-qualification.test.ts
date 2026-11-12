import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { queryDatabase } from "@/lib/database";
import { POST } from "@/app/api/public/qualification/route";
import { parseQualification, SERVICE_BUDGETS } from "@/lib/service-qualification";

const valid = {
  requestId: "964c3f74-192f-4b17-845a-7f7bf0b0c909", service: "mentoria", name: "Persona",
  email: "PERSONA@example.com", company: "Empresa", role: "Dueño", result: "Mejorar las respuestas",
  budget: SERVICE_BUDGETS.mentoria[1], availability: "2–4 horas", confirmed: true,
};
const request = (body: unknown, origin = "https://www.crececonia.cl") => new Request("https://www.crececonia.cl/api/public/qualification", {
  method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});

beforeEach(() => { vi.clearAllMocks(); vi.mocked(queryDatabase).mockResolvedValue([{ id: valid.requestId }]); });

describe("qualification persistence boundary", () => {
  it("acknowledges only after persistence and normalizes email", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, qualified: true, id: valid.requestId });
    const [sql, params] = vi.mocked(queryDatabase).mock.calls[0];
    expect(sql).toContain("where commerce.service_qualifications.payload_hash = excluded.payload_hash");
    expect(params?.[2]).toBe("persona@example.com");
    expect(JSON.parse(params?.[3] as string)).toMatchObject({ service: "mentoria", qualified: true });
  });
  it("keeps the same key and hash on identical retries", async () => {
    await POST(request(valid));
    await POST(request(valid));
    expect(vi.mocked(queryDatabase).mock.calls[0]).toEqual(vi.mocked(queryDatabase).mock.calls[1]);
  });
  it("rejects a reused key with different stored payload", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    const response = await POST(request(valid));
    expect(response.status).toBe(409);
    expect(await response.json()).not.toHaveProperty("ok");
  });
  it("does not report success when storage is unavailable", async () => {
    vi.mocked(queryDatabase).mockRejectedValue(new Error("private database details"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database details");
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining(valid.email));
    log.mockRestore();
  });
  it.each([
    { service: "other" }, { confirmed: false }, { budget: "arbitrary" }, { availability: "" },
    { requestId: "invalid" }, { email: "bad" }, { name: " " }, { result: "x".repeat(2001) },
  ])("rejects invalid input %j without writing", async (patch) => {
    expect((await POST(request({ ...valid, ...patch }))).status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("rejects cross-origin posts", async () => {
    expect((await POST(request(valid, "https://elsewhere.example"))).status).toBe(403);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("does not store unqualified submissions", async () => {
    const response = await POST(request({ ...valid, budget: SERVICE_BUDGETS.mentoria[0] }));
    expect(await response.json()).toEqual({ qualified: false });
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("enforces implementation qualification on the server", () => {
    const input = { ...valid, service: "implementacion", budget: SERVICE_BUDGETS.implementacion[1], context: "Un proceso suficientemente explicado", decision: "Yo tomo la decisión" };
    expect(parseQualification(input).qualified).toBe(true);
    expect(parseQualification({ ...input, context: "Corto" }).qualified).toBe(false);
    expect(parseQualification({ ...input, decision: "No sé quién decide todavía" }).qualified).toBe(false);
    expect(() => parseQualification({ ...input, decision: "inventado" })).toThrow();
  });
  it("rejects oversized bodies without writing", async () => {
    expect((await POST(request({ ...valid, extra: "x".repeat(16001) }))).status).toBe(413);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
});
