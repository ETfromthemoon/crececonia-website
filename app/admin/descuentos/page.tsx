import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import DiscountCodeForm from "@/components/admin/DiscountCodeForm";

export const dynamic = "force-dynamic";

export default async function AdminDiscountCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    notFound();
  }

  const db = getSupabaseAdmin();
  const { data: codes } = await db
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = codes ?? [];

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "Sin vencimiento";

  const statusOf = (row: {
    used_count: number;
    max_uses: number | null;
    expires_at: string | null;
    active: boolean;
  }) => {
    if (!row.active) return { label: "Inactivo", color: "var(--smoke)" };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return { label: "Vencido", color: "var(--smoke)" };
    }
    if (row.max_uses !== null && row.used_count >= row.max_uses) {
      return { label: "Usado", color: "var(--smoke)" };
    }
    return { label: "Activo", color: "var(--champagne)" };
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
            marginBottom: 32,
          }}
        >
          Códigos de descuento — Ebook
        </h1>

        <DiscountCodeForm adminKey={key as string} />

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
          Todos los códigos
        </h2>

        {rows.length === 0 ? (
          <p style={{ color: "var(--smoke)", fontStyle: "italic" }}>Sin códigos aún.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--smoke)", textAlign: "left" }}>
                  {["Código", "Tipo", "Valor", "Usos", "Vence", "Estado"].map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const s = statusOf(row);
                  return (
                    <tr
                      key={row.code}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      }}
                    >
                      <td style={{ padding: "10px 12px", color: "var(--bone)", fontFamily: "var(--font-mono)" }}>
                        {row.code}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--smoke)" }}>
                        {row.type === "percent" ? "%" : "$"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--champagne)", fontFamily: "var(--font-mono)" }}>
                        {row.type === "percent" ? `${row.amount}%` : `$${row.amount.toLocaleString("es-CL")}`}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--smoke)", textAlign: "center" }}>
                        {row.used_count}/{row.max_uses ?? "∞"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--smoke)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {fmtDate(row.expires_at)}
                      </td>
                      <td style={{ padding: "10px 12px", color: s.color, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {s.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
