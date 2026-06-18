import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminEbookPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    notFound();
  }

  const db = getSupabaseAdmin();

  const [{ data: purchases }, { data: cupos }] = await Promise.all([
    db
      .from("ebook_purchases")
      .select("id, email, amount, tier, purchased_at, download_count")
      .order("purchased_at", { ascending: false }),
    db.from("ebook_cupos").select("*"),
  ]);

  const rows = purchases ?? [];
  const totalVentas = rows.length;
  const totalCLP = rows.reduce((s, p) => s + p.amount, 0);
  const porTier = {
    "super-early": rows.filter((p) => p.tier === "super-early").length,
    early: rows.filter((p) => p.tier === "early").length,
    regular: rows.filter((p) => p.tier === "regular").length,
  };

  const cuposMap = Object.fromEntries(
    (cupos ?? []).map((c) => [c.tier, c as { total: number; used: number }])
  );

  const fmtCLP = (n: number) =>
    "$" + n.toLocaleString("es-CL") + " CLP";

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    });

  const tierLabel: Record<string, string> = {
    "super-early": "Super Early",
    early: "Early",
    regular: "Regular",
  };

  return (
    <main
      style={{
        background: "var(--obsidian)",
        color: "var(--bone)",
        minHeight: "100vh",
        padding: "48px 24px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            color: "var(--champagne)",
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
            marginBottom: 8,
          }}
        >
          Admin · CrececonIA
        </p>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 300,
            fontFamily: "var(--font-display)",
            marginBottom: 40,
          }}
        >
          Dashboard — Ebook
        </h1>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { label: "Total ventas", value: String(totalVentas) },
            { label: "Total recaudado", value: fmtCLP(totalCLP) },
            { label: "Super Early vendidos", value: `${porTier["super-early"]} / ${cuposMap["super-early"]?.total ?? 10}` },
            { label: "Super Early restantes", value: String((cuposMap["super-early"]?.total ?? 10) - (cuposMap["super-early"]?.used ?? 0)) },
            { label: "Early Adopters vendidos", value: `${porTier.early} / ${cuposMap["early"]?.total ?? 40}` },
            { label: "Early Adopters restantes", value: String((cuposMap["early"]?.total ?? 40) - (cuposMap["early"]?.used ?? 0)) },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "var(--carbon)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "20px 24px",
              }}
            >
              <p
                style={{
                  color: "var(--smoke)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  marginBottom: 8,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {kpi.label}
              </p>
              <p
                style={{
                  color: "var(--champagne)",
                  fontSize: 22,
                  fontWeight: 400,
                }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabla de compras */}
        <h2
          style={{
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: "0.12em",
            color: "var(--ash)",
            marginBottom: 16,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
          }}
        >
          Últimas compras
        </h2>

        {rows.length === 0 ? (
          <p style={{ color: "var(--smoke)", fontStyle: "italic" }}>
            Sin compras aún.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    color: "var(--smoke)",
                    textAlign: "left",
                  }}
                >
                  {["Email", "Monto", "Tier", "Descargas", "Fecha"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          fontWeight: 400,
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    }}
                  >
                    <td style={{ padding: "10px 12px", color: "var(--bone)" }}>
                      {p.email}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--champagne)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {fmtCLP(p.amount)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: "rgba(217,179,106,0.1)",
                          color: "var(--champagne)",
                          padding: "2px 8px",
                          borderRadius: 2,
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {tierLabel[p.tier] ?? p.tier}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--smoke)",
                        textAlign: "center",
                      }}
                    >
                      {p.download_count ?? 0}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--smoke)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                      }}
                    >
                      {fmtDate(p.purchased_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
