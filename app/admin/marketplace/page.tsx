import { requireAdminSession } from "@/lib/admin-auth";
import { listMarketplaceReviewAssets, listMarketplaceReviews, listSellerReviews } from "@/lib/marketplace-review";

export const dynamic = "force-dynamic";

const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  await requireAdminSession();
  const [rows, sellers, assets] = await Promise.all([
    listMarketplaceReviews(), listSellerReviews(), listMarketplaceReviewAssets(),
  ]);
  const { resultado } = await searchParams;
  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px", color: "var(--bone)" }}>
    <p className="eyebrow">Administración</p>
    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: 12 }}>Revisión del marketplace</h1>
    <p>La aprobación editorial y la publicación son pasos separados. Un cambio de versión vuelve a requerir revisión.</p>
    {resultado === "guardado" && <p role="status" style={{ color: "var(--champagne)" }}>Cambio guardado.</p>}
    <section aria-labelledby="seller-review-title" style={{ marginTop: 48 }}>
      <h2 id="seller-review-title" style={{ fontSize: "2rem" }}>Autores</h2>
      <p>Verifica identidad, contenido y condiciones del piloto antes de activar una cuenta. Activar un autor no habilita cobros en producción.</p>
      {sellers.length === 0 && <p>No hay autores en revisión.</p>}
      <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
        {sellers.map((seller) => <article key={seller.id} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontSize: "1.35rem" }}>{seller.display_name}</h3>
          <p>/{seller.public_slug} · {seller.status} · Términos {seller.terms_version ?? "pendientes"}</p>
          <p>{seller.bio}</p>
          <p>Perfil tributario: {seller.tax_review_status ?? "incompleto"} · RUT: {seller.rut ?? "pendiente"} · Razón social: {seller.legal_name ?? "pendiente"} · Declaración IVA: {seller.declared_vat_status ?? "pendiente"}</p>
          {seller.tax_review_status === "pending" && <form action="/api/admin/marketplace/tax" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="seller_id" value={seller.id} />
            <label htmlFor={`tax-reason-${seller.id}`}>Resultado de la verificación en SII</label>
            <textarea id={`tax-reason-${seller.id}`} name="reason" minLength={10} maxLength={2000} required
              style={{ display: "block", width: "100%", minHeight: 75, margin: "8px 0 12px", color: "#111" }} />
            <button name="action" value="verify" style={{ marginRight: 12 }}
              disabled={!seller.rut || !seller.legal_name || seller.declared_vat_status === "unsure"}>
              Verificación confirmada
            </button>
            <button name="action" value="reject">Rechazar perfil tributario</button>
          </form>}
          {(seller.status === "pending_verification" || seller.status === "active") &&
            <form action="/api/admin/marketplace/sellers" method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="seller_id" value={seller.id} />
              <label htmlFor={`seller-reason-${seller.id}`}>Motivo de la decisión</label>
              <textarea id={`seller-reason-${seller.id}`} name="reason" minLength={10} maxLength={2000} required
                style={{ display: "block", width: "100%", minHeight: 75, margin: "8px 0 12px", color: "#111" }} />
              <button name="action" value={seller.status === "pending_verification" ? "activate" : "suspend"}
                disabled={seller.status === "pending_verification" && (!seller.terms_accepted_at || seller.tax_review_status !== "verified")}>
                {seller.status === "pending_verification" ? "Activar autor" : "Suspender autor"}
              </button>
            </form>}
        </article>)}
      </div>
    </section>
    <h2 style={{ fontSize: "2rem", marginTop: 60 }}>Libros</h2>
    {rows.length === 0 && <p style={{ marginTop: 40 }}>No hay libros pendientes de revisión.</p>}
    <div style={{ display: "grid", gap: 24, marginTop: 40 }}>
      {rows.map((row) => {
        const ready = Boolean(row.rights_declared_at && row.ready_pdf && row.price_tax_mode !== "pending_review");
        return <article key={row.book_id} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <p className="eyebrow">{row.seller_name} · {row.seller_status}</p>
          <h2 style={{ fontSize: "1.5rem", margin: "10px 0" }}>{row.title}</h2>
          {row.subtitle && <p>{row.subtitle}</p>}
          <p>/{row.slug} · {row.category} · Autor: {row.author_display_name} · {formatCLP(row.price_minor)} · Libro: {row.book_status} · Revisión: {row.moderation_status}</p>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{row.description}</p>
          <ul style={{ marginTop: 16, paddingLeft: 20 }}>
            <li>Derechos declarados: {row.rights_declared_at ? row.rights_declaration_version ?? "sí" : "pendiente"}</li>
            <li>PDF validado: {row.ready_pdf ? "sí" : "pendiente"}</li>
            <li>Tratamiento tributario: {row.price_tax_mode}</li>
          </ul>
          {assets.filter((asset) => asset.revision_id === row.revision_id).map((asset) =>
            <div key={asset.id} style={{ padding: 16, margin: "16px 0", border: "1px solid var(--border)", borderRadius: 8 }}>
              <p>Archivo: {asset.asset_kind} · {asset.scan_status} · {asset.byte_size} bytes</p>
              {asset.asset_kind === "ebook_pdf" && <a href={`/api/admin/marketplace/assets/${asset.id}`}>Descargar PDF para revisión</a>}
              {asset.scan_status === "quarantined" && asset.asset_kind === "ebook_pdf" &&
                <form action="/api/admin/marketplace/assets" method="post" style={{ marginTop: 14 }}>
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <label htmlFor={`asset-reason-${asset.id}`}>Resultado de revisión del archivo</label>
                  <textarea id={`asset-reason-${asset.id}`} name="reason" minLength={10} maxLength={2000} required
                    style={{ display: "block", width: "100%", minHeight: 75, margin: "8px 0 12px", color: "#111" }} />
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <input name="manual_review_confirmed" value="yes" type="checkbox" /> Revisé el PDF y confirmo que corresponde al contenido declarado.
                  </label>
                  <button name="action" value="accept" style={{ marginRight: 12 }}>Aprobar archivo</button>
                  <button name="action" value="reject">Rechazar archivo</button>
                </form>}
            </div>)}
          {row.book_status === "in_review" && row.price_tax_mode === "pending_review" &&
            <form action="/api/admin/marketplace/books/tax-mode" method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="book_id" value={row.book_id} />
              <input type="hidden" name="revision_id" value={row.revision_id} />
              <label htmlFor={`book-tax-reason-${row.book_id}`}>Fundamento tributario del precio, tras revisar el perfil del vendedor</label>
              <textarea id={`book-tax-reason-${row.book_id}`} name="reason" minLength={10} maxLength={2000} required
                style={{ display: "block", width: "100%", minHeight: 75, margin: "8px 0 12px", color: "#111" }} />
              <button name="tax_mode" value="tax_inclusive" style={{ marginRight: 12 }}>Precio incluye IVA</button>
              <button name="tax_mode" value="exempt">Exento verificado</button>
            </form>}
          {row.moderation_reason && <p>Última observación: {row.moderation_reason}</p>}
          {row.book_status === "in_review" && <>
            <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
              <input type="hidden" name="book_id" value={row.book_id} />
              <input type="hidden" name="revision_id" value={row.revision_id} />
              <button name="action" value="approve" disabled={!ready} style={{ marginRight: 12 }}>Aprobar revisión</button>
            </form>
            <form action="/api/admin/marketplace" method="post" style={{ marginTop: 16 }}>
              <input type="hidden" name="book_id" value={row.book_id} />
              <input type="hidden" name="revision_id" value={row.revision_id} />
              <label htmlFor={`reason-${row.book_id}`}>Motivo para el autor</label>
              <textarea id={`reason-${row.book_id}`} name="reason" minLength={10} maxLength={2000} required
                style={{ display: "block", width: "100%", minHeight: 90, margin: "8px 0 12px", color: "#111" }} />
              <button name="action" value="request_changes" style={{ marginRight: 12 }}>Solicitar cambios</button>
              <button name="action" value="reject">Rechazar</button>
            </form>
          </>}
          {(row.book_status === "approved" || row.book_status === "paused") && <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="book_id" value={row.book_id} />
            <input type="hidden" name="revision_id" value={row.revision_id} />
            <button name="action" value="publish" disabled={!ready || row.seller_status !== "active"}>Publicar libro</button>
          </form>}
          {row.book_status === "published" && <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="book_id" value={row.book_id} />
            <input type="hidden" name="revision_id" value={row.published_revision_id ?? ""} />
            <button name="action" value="pause">Pausar publicación</button>
          </form>}
        </article>;
      })}
    </div>
  </main>;
}
