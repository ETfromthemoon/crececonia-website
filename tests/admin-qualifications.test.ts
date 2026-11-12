import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import { encodeQualificationCursor, loadQualificationInbox, parseQualificationCursor, qualificationSyncView, type QualificationSummary } from "@/lib/admin-qualifications";

const id = "964c3f74-192f-4b17-845a-7f7bf0b0c909";
const now = Date.parse("2026-11-12T18:00:00Z");
const row: QualificationSummary = {
  id, service: "mentoria", name: "Nombre", company: "Empresa", created_at: "2026-11-12T17:00:00.123456Z", status: "new",
  sync_status: null, attempts: null, lease_expires_at: null, next_attempt_at: null, reason_code: null,
};
beforeEach(() => { vi.resetAllMocks(); vi.mocked(requireAdminSession).mockResolvedValue(undefined); });

describe("authorized qualification queries", () => {
  it("authenticates before parsing or database access", async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
    await expect(loadQualificationInbox({ cursor: "bad" })).rejects.toThrow("redirect");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("keeps qualifications visible without the optional sync schema", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: false }]).mockResolvedValueOnce([row]);
    const data = await loadQualificationInbox({});
    expect(data.integrationInstalled).toBe(false);
    expect(data.rows).toEqual([row]);
    expect(vi.mocked(queryDatabase).mock.calls[1][0]).not.toContain("join commerce.nitido_sync_jobs");
  });
  it("uses LEFT JOIN and a small explicit projection when installed", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: true }]).mockResolvedValueOnce([row]);
    await loadQualificationInbox({});
    const sql = vi.mocked(queryDatabase).mock.calls[1][0];
    expect(sql).toContain("left join commerce.nitido_sync_jobs");
    expect(sql).not.toMatch(/select\s+\*|lease_token|worker_id|operation_id|q\.email|q\.payload\s*,/i);
  });
  it("never disguises a schema lookup or list failure as no leads", async () => {
    vi.mocked(queryDatabase).mockRejectedValueOnce(new Error("permission denied"));
    await expect(loadQualificationInbox({})).rejects.toThrow("permission denied");
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: true }]).mockRejectedValueOnce(new Error("connection lost"));
    await expect(loadQualificationInbox({})).rejects.toThrow("connection lost");
  });
  it("rejects invalid cursor and detail identifiers before DB reads", async () => {
    await expect(loadQualificationInbox({ cursor: "bad" })).rejects.toThrow();
    await expect(loadQualificationInbox({ id: "email@example.com" })).rejects.toThrow();
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("paginates with microseconds and UUID tie breaker, not offset", async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({ ...row, id: `964c3f74-192f-4b17-845a-${String(99 - i).padStart(12, "0")}` }));
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: true }]).mockResolvedValueOnce(rows);
    const data = await loadQualificationInbox({ cursor: encodeQualificationCursor(row) });
    expect(data.rows).toHaveLength(25);
    expect(parseQualificationCursor(data.nextCursor!)).toEqual({ time: row.created_at, id: rows[24].id });
    const [sql, values] = vi.mocked(queryDatabase).mock.calls[1];
    expect(sql).toContain("(q.created_at, q.id) < ($1::timestamptz, $2::uuid)");
    expect(sql).toContain("order by q.created_at desc, q.id desc limit 26");
    expect(sql).not.toMatch(/offset/i);
    expect(values).toEqual([row.created_at, id]);
  });
  it("loads private fields only for an explicit authorized detail", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: true }]).mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ ...row, email: "private@example.com", result: "Private response" }]);
    const data = await loadQualificationInbox({ id });
    expect(data.detail?.email).toBe("private@example.com");
    const [sql, values] = vi.mocked(queryDatabase).mock.calls[2];
    expect(sql).toContain("q.email");
    expect(sql).not.toMatch(/lease_token|worker_id|select\s+\*/i);
    expect(values).toEqual([id]);
  });
  it("returns an explicit missing detail without fabricating a lead", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: false }]).mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    expect(await loadQualificationInbox({ id })).toMatchObject({ detail: null, detailRequested: true, rows: [row] });
  });
});

describe("operational status, not a parallel CRM", () => {
  it("distinguishes absent integration and absent job", () => {
    expect(qualificationSyncView(row, false, now).label).toBe("Integración no instalada");
    expect(qualificationSyncView(row, true, now).label).toBe("Sin trabajo de sincronización");
  });
  it("does not equate synced with contact or a sale", () => {
    expect(qualificationSyncView({ ...row, sync_status: "synced" }, true, now).action).toContain("no acredita contacto ni venta");
  });
  it("distinguishes active, expired and final expired leases without a claim mutation", () => {
    const leased = { ...row, sync_status: "leased", attempts: 1, lease_expires_at: "2026-11-12T18:01:00Z" };
    expect(qualificationSyncView(leased, true, now).label).toBe("Reserva vigente");
    expect(qualificationSyncView(leased, true, now + 60_000).label).toBe("Reserva vencida");
    expect(qualificationSyncView({ ...leased, attempts: 8 }, true, now + 60_000).label).toContain("intentos agotados");
    expect(qualificationSyncView({ ...leased, lease_expires_at: null }, true, now).label).toBe("Reserva inconsistente");
  });
  it.each(["duplicate_candidate", "revision_conflict", "invalid_payload", "lease_exhausted"])("requires operational review for %s", reason_code => {
    expect(qualificationSyncView({ ...row, sync_status: "needs_review", reason_code }, true, now).label).toBe("Requiere revisión");
  });
  it("handles unknown and exhausted pending states visibly", () => {
    expect(qualificationSyncView({ ...row, sync_status: "future" }, true, now).label).toContain("no reconocido");
    expect(qualificationSyncView({ ...row, sync_status: "pending", attempts: 8 }, true, now).label).toContain("intentos agotados");
  });
});
