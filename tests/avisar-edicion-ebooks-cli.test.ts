import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sql = vi.hoisted(() => vi.fn());
vi.mock("@neondatabase/serverless", () => ({ neon: () => sql }));
import { runEdition } from "../scripts/avisar-edicion-ebooks";

const bytes = Buffer.from("known PDF bytes");
const digest = createHash("sha256").update(bytes).digest("hex");
const id = "2026-12-test";
let previous: string;
let tmp: string;

beforeEach(() => {
  previous = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ebook-edition-"));
  fs.mkdirSync(path.join(tmp, "editions"));
  fs.writeFileSync(path.join(tmp, "editions", `${id}.json`), JSON.stringify({ id, subjectSingular: "Tu libro", subjectPlural: "Tus libros", intro: "Edición nueva", books: [{ resource: "ebook:de-cero-a-claude-en-una-semana", change: "Capítulo nuevo", sha256: { a4: digest, movil: digest } }] }));
  process.chdir(tmp);
  process.env.DATABASE_URL = "postgres://synthetic";
  process.env.RESEND_API_KEY = "re_synthetic";
  vi.spyOn(console, "log").mockImplementation(() => {});
  sql.mockReset().mockImplementation((parts: TemplateStringsArray) => {
    const query = parts.join("?");
    if (query.includes("from commerce.ebook_purchases")) return Promise.resolve([{ email: "buyer@example.com", resource: "ebook:de-cero-a-claude-en-una-semana", flow_token: "token", purchased_at: "2026-10-01" }]);
    if (query.includes("from commerce.ebook_edition_notices")) return Promise.resolve([]);
    if (query.includes("insert into commerce.ebook_edition_notices")) return Promise.resolve([{ email: "buyer@example.com" }]);
    return Promise.resolve([]);
  });
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => String(input).includes("api.resend.com")
    ? { ok: true, status: 200, json: async () => ({ id: "re_1" }) }
    : { ok: true, status: 200, arrayBuffer: async () => bytes }));
});

afterEach(() => {
  process.chdir(previous);
  fs.rmSync(tmp, { recursive: true, force: true });
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("script de avisos", () => {
  it("verifica ambos PDFs y en preview no envía ni escribe registros", async () => {
    await runEdition([`editions/${id}.json`, "preview"]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sql.mock.calls.some(([parts]) => parts.join("?").includes("insert into commerce.ebook_edition_notices"))).toBe(false);
  });

  it("si Resend acepta, registra el envío; si falla, queda para revisión", async () => {
    await runEdition([`editions/${id}.json`, "send"]);
    expect(sql.mock.calls.some(([parts]) => parts.join("?").includes("status='accepted'"))).toBe(true);
    vi.mocked(fetch).mockImplementation(async (input: string | URL) => String(input).includes("api.resend.com")
      ? { ok: false, status: 500, json: async () => ({ message: "error" }) } as Response
      : { ok: true, status: 200, arrayBuffer: async () => bytes } as unknown as Response);
    await expect(runEdition([`editions/${id}.json`, "send"])).rejects.toThrow("revisar el estado");
    expect(sql.mock.calls.some(([parts]) => parts.join("?").includes("status='review'"))).toBe(true);
  });
});
