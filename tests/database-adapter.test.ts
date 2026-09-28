import { describe, expect, it, vi } from "vitest";
import { DatabaseQuery } from "@/lib/supabase";

describe("adaptador PostgreSQL compatible", () => {
  it("guarda el manifiesto JSON de órdenes sin convertir otros arrays SQL", async () => {
    const run = vi.fn().mockResolvedValue([]);
    const resources = [{ resource: "ebook:uno", tier: "early", amount: 17900 }];
    await new DatabaseQuery(run, "ebook_pending_orders").insert({ resources });
    expect(JSON.parse(run.mock.calls[0][1][0])).toEqual(resources);

    await new DatabaseQuery(run, "ebook_pending_orders").update({ resources: [] }).eq("commerce_order", "test");
    expect(run.mock.calls[1][1]).toEqual(["[]", "test"]);

    await new DatabaseQuery(run, "launches").insert({ tags: ["uno", "dos"] });
    expect(run.mock.calls[2][1]).toEqual([["uno", "dos"]]);
  });

  it("parametriza filtros, orden y límite", async () => {
    const run = vi.fn().mockResolvedValue([{ resource: "ebook:uno" }]);
    const result = await new DatabaseQuery(run, "ebook_purchases")
      .select("resource")
      .eq("flow_token", "secreto")
      .order("purchased_at", { ascending: false })
      .limit(1);

    expect(result.error).toBeNull();
    expect(run).toHaveBeenCalledWith(
      'select "resource" from public."ebook_purchases" where "flow_token" = $1 order by "purchased_at" desc limit 1',
      ["secreto"]
    );
  });

  it("inserta lotes sin interpolar valores", async () => {
    const run = vi.fn().mockResolvedValue([]);
    await new DatabaseQuery(run, "discount_codes").insert([
      { code: "A", amount: 10 },
      { code: "B", amount: 20 },
    ]);

    expect(run).toHaveBeenCalledWith(
      'insert into public."discount_codes" ("code", "amount") values ($1, $2), ($3, $4) returning *',
      ["A", 10, "B", 20]
    );
  });

  it("mantiene separados valores de actualización y filtros", async () => {
    const run = vi.fn().mockResolvedValue([]);
    await new DatabaseQuery(run, "ebook_purchases")
      .update({ download_count: 3 })
      .eq("id", "purchase-id");

    expect(run).toHaveBeenCalledWith(
      'update public."ebook_purchases" set "download_count" = $1 where "id" = $2 returning *',
      [3, "purchase-id"]
    );
  });

  it("calcula count exact sin leer filas", async () => {
    const run = vi.fn().mockResolvedValue([{ count: 49 }]);
    const result = await new DatabaseQuery(run, "ebook_purchases")
      .select("id", { count: "exact", head: true });

    expect(result).toEqual({ data: null, error: null, count: 49 });
    expect(run).toHaveBeenCalledWith('select count(*)::int as count from public."ebook_purchases"', []);
  });

  it("rechaza identificadores no confiables", () => {
    expect(() => new DatabaseQuery(vi.fn(), 'ebook_purchases; drop table x')).toThrow("Identificador SQL inválido");
  });

  it("rechaza updates y deletes sin filtros", async () => {
    const run = vi.fn().mockResolvedValue([]);
    const update = await new DatabaseQuery(run, "ebook_purchases").update({ download_count: 0 });
    const deletion = await new DatabaseQuery(run, "ebook_pending_orders").delete();

    expect(update.error?.message).toBe("Se rechazó un UPDATE sin filtros.");
    expect(deletion.error?.message).toBe("Se rechazó un DELETE sin filtros.");
    expect(run).not.toHaveBeenCalled();
  });
});
