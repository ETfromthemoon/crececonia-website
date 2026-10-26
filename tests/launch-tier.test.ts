import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: query }));
import { advanceLaunchTier } from "@/lib/launches";

describe("avance de tramos del centro de lanzamientos", () => {
  it("no registra un avance cuando no existe un tramo siguiente", async () => {
    query.mockReset().mockResolvedValueOnce([]);
    await expect(advanceLaunchTier("launch-1")).rejects.toThrow(/tramo siguiente/);
    expect(query).toHaveBeenCalledOnce();
    // La sentencia atómica debe condicionar también el retiro del vigente.
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toMatch(/status='retired'[\s\S]*?and exists \(select 1 from next\)/);
  });
  it("registra el avance una vez cuando el siguiente tramo se activó", async () => {
    query.mockReset().mockResolvedValueOnce([{ next_id: "tier-2" }]).mockResolvedValueOnce([]);
    await advanceLaunchTier("launch-1");
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toContain("price_tier_advanced");
  });
});
