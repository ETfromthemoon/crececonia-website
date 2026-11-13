import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import { ebookDeliveryView, loadEbookDeliveryInbox, parseDeliveryCursor, type DeliverySummary } from "@/lib/admin-ebook-deliveries";
const id = "964c3f74-192f-4b17-845a-7f7bf0b0c909";
const now = Date.parse("2026-11-12T18:00:00Z");
const schema = { jobs: true, receipts: true, effects: true, now: new Date(now) };
const dbRow = { id, flow_order: "9007199254740993", created_at: "2026-11-12T17:00:00.123456Z", status: "pending", attempts: 0,
  first_attempt_at: null, lease_expires_at: null, next_attempt_at: new Date(now), provider_accepted_at: null, last_error_code: null,
  receipt_recorded: true, effects_applied: 1, effects_review: 1, incidents: [] };
const summary: DeliverySummary = { id, flowOrder: dbRow.flow_order, createdAt: dbRow.created_at, status: "pending", attempts: 0,
  firstAttemptAt: null, leaseExpiresAt: null, nextAttemptAt: new Date(now).toISOString(), providerAcceptedAt: null, reason: null,
  receiptRecorded: true, effectsApplied: 1, effectsReview: 1, incidents: [] };
const encode = (time = dbRow.created_at, key = id) => Buffer.from(JSON.stringify({ time, id: key })).toString("base64url");
beforeEach(() => { vi.resetAllMocks(); vi.mocked(requireAdminSession).mockResolvedValue(undefined); });

describe("authorized readonly projection", () => {
  it("authenticates before even validating the cursor", async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
    await expect(loadEbookDeliveryInbox({ cursor: "invalid" })).rejects.toThrow("redirect"); expect(queryDatabase).not.toHaveBeenCalled();
  });
  it.each([[false, false, false, "absent"], [false, true, false, "partial"]])("does not query missing jobs", async (jobs, receipts, effects, state) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...schema, jobs, receipts, effects }]);
    expect(await loadEbookDeliveryInbox({})).toMatchObject({ schema: state, rows: [], nextCursor: null }); expect(queryDatabase).toHaveBeenCalledTimes(1);
  });
  it.each([[false, false], [true, false], [false, true]])("avoids missing accounting relations %s %s", async (receipts, effects) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...schema, receipts, effects }]).mockResolvedValueOnce([dbRow]);
    const result = await loadEbookDeliveryInbox({}); expect(result.schema).toBe("partial"); expect(result.rows[0].receiptRecorded).toBeNull();
    const sql = vi.mocked(queryDatabase).mock.calls[1][0]; expect(sql).not.toContain("from commerce.ebook_payment");
  });
  it("uses safe SELECT projection, excludes delivery effects from accounting and discards extra DB fields", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ ...dbRow, payload: "private-payload", buyer_email: "private@email.test", grants: "token", lease_token: "private-lease", commerce_order: "private-order" }]);
    const result = await loadEbookDeliveryInbox({}); expect(result.rows).toEqual([summary]);
    const sql = vi.mocked(queryDatabase).mock.calls[1][0]; expect(sql).not.toMatch(/\b(payload|lease_token|buyer_email|grants|manifest|commerce_order)\b/);
    expect(sql).toContain("e.kind in ('cupo', 'discount')"); expect(sql).not.toMatch(/\b(update|insert|delete)\b/i); expect(JSON.stringify(result)).not.toContain("private");
  });
  it("keeps microseconds and bigint precision across 25-row keyset pages", async () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({ ...dbRow, id: `964c3f74-192f-4b17-845a-${String(index).padStart(12, "0")}` }));
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce(rows);
    const page = await loadEbookDeliveryInbox({ cursor: encode() }); expect(page.rows).toHaveLength(25);
    expect(parseDeliveryCursor(page.nextCursor!)).toEqual({ time: dbRow.created_at, id: rows[24].id });
    const [sql, args] = vi.mocked(queryDatabase).mock.calls[1]; expect(args).toEqual([dbRow.created_at, id]);
    expect(sql).toContain("(j.created_at, j.id) < ($1::timestamptz, $2::uuid)"); expect(sql).toContain("limit 26");
    expect(page.rows[0].flowOrder).toBe("9007199254740993");
  });
  it("exposes only safe incident descriptions and catalog resource names", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ ...dbRow, incidents: [
      { kind: "cupo", resource: "private@example.test", reason: "private-token" },
      { kind: "delivery", resource: "private-link", reason: "historical_delivery_unknown" },
    ] }]);
    const result = await loadEbookDeliveryInbox({}); expect(result.rows[0].incidents).toEqual([
      { kind: "cupo", resource: "Recurso no reconocido", reason: "unknown" },
      { kind: "delivery", resource: null, reason: "historical_delivery_unknown" },
    ]); expect(JSON.stringify(result)).not.toContain("private");
  });
  it.each([new Date("2026-11-12T18:00:00.900Z"), "2026-11-12T15:00:00.900-03:00"])("normalizes Date|string without expiring a live lease early", async (expiry) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ ...dbRow, status: "processing", attempts: 5, lease_expires_at: expiry }]);
    const result = await loadEbookDeliveryInbox({}); expect(result.rows[0].leaseExpiresAt).toBe("2026-11-12T18:00:00.900Z");
    expect(ebookDeliveryView(result.rows[0], now + 500).label).toBe("Reserva vigente");
    expect(ebookDeliveryView(result.rows[0], now + 900).label).toContain("intentos agotados");
  });
  it.each(["invalid", encode("2026-02-31T10:00:00.123456Z"), encode("2026-11-12T10:00:00.123Z"), encode(dbRow.created_at, "bad"), "x".repeat(201)])("rejects invalid cursor %s before DB", async (cursor) => {
    await expect(loadEbookDeliveryInbox({ cursor })).rejects.toThrow("Paginación"); expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("does not hide a database failure as an empty inbox", async () => {
    vi.mocked(queryDatabase).mockRejectedValue(new Error("DB failed")); await expect(loadEbookDeliveryInbox({})).rejects.toThrow("DB failed");
  });
  it("rejects malformed driver dates", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ ...dbRow, first_attempt_at: new Date(NaN) }]);
    await expect(loadEbookDeliveryInbox({})).rejects.toThrow("Invalid timestamp");
  });
});
describe("delivery semantics are distinct from accounting", () => {
  it("provider acceptance never asserts delivery/download despite financial incidents", () => {
    const view = ebookDeliveryView({ ...summary, status: "provider_accepted", effectsReview: 3, attempts: 5 }, now);
    expect(view.label).toBe("Aceptado por el proveedor"); expect(view.guidance).toContain("No acredita entrega");
  });
  it("unknown provider outcome is ambiguous, not a failed email", () => {
    expect(ebookDeliveryView({ ...summary, status: "retry", reason: "provider_unknown" }, now).label).toContain("incierto");
  });
  it("derives expiry and limits before worker has swept state", () => {
    expect(ebookDeliveryView({ ...summary, status: "processing", leaseExpiresAt: new Date(now - 1).toISOString() }, now).label).toBe("Reserva vencida");
    expect(ebookDeliveryView({ ...summary, attempts: 5 }, now).label).toContain("intentos agotados");
    expect(ebookDeliveryView({ ...summary, firstAttemptAt: new Date(now - 23 * 3600000).toISOString() }, now).label).toContain("ventana agotada");
  });
  it("does not promise execution or equate historic review to email failure", () => {
    expect(ebookDeliveryView(summary, now).guidance).toContain("No hay una hora");
    expect(ebookDeliveryView({ ...summary, status: "needs_review" }, now).guidance).toContain("no implica correo fallido");
  });
});
