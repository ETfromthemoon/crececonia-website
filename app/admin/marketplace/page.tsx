import { requireAdminSession } from "@/lib/admin-auth";
import { listMarketplaceReviewAssets, listMarketplaceReviews, listSellerReviews } from "@/lib/marketplace-review";
import { marketplaceDemoAvailable } from "@/lib/marketplace-demo";
import { queryDatabase } from "@/lib/database";
import DemoMarketplaceAdmin from "./DemoMarketplaceAdmin";
import FiscalEvidenceForm from "./FiscalEvidenceForm";
import SettlementForm from "./SettlementForm";
import RefundForm from "./RefundForm";
import FeeEvidenceForm from "./FeeEvidenceForm";
import MarketplaceHealth from "./MarketplaceHealth";
import layout from "./demo.module.css";
import styles from "./panel.module.css";

export const dynamic = "force-dynamic";

const formatCLP = (value: string | bigint) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

type MarketplaceCounts = { sellers: string; books: string; buyers: string; orders: string; paid: string;
  fiscal_pending: string; paid_sales_minor: string; net_commission_minor: string };
type SellerContact = { id: string; email: string | null; display_name: string; public_slug: string; status: string; created_at: string };
type MarketplaceOrder = {
  id: string; buyer_email: string; total_minor: string; status: string; created_at: string;
  paid_at: string | null; title: string | null; seller_name: string | null;
  commission_minor: string;
  commission_tax_minor: string;
  tax_minor: string;
  payment_status: string | null; gateway_fee_actual_minor: string | null;
  gateway_fee_reconciled: boolean | null;
  payment_id: string | null;
  delivery_status: string | null; document_kind: string | null;
  document_reference: string | null;
};
type SellerBalance = { seller_id: string; display_name: string; ledger_net_minor: string;
  settled_minor: string; available_minor: string; blocked: boolean };

export default async function MarketplaceReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string; vista?: string }>;
}) {
  await requireAdminSession("/admin/marketplace");
  const preview = marketplaceDemoAvailable();
  const { resultado, vista } = await searchParams;
  if (preview && vista === "demo") return <DemoMarketplaceAdmin />;
  const [rows, sellers, assets, counts, contacts, orders, balances] = preview ? [[], [], [], [], [], [], []] : await Promise.all([
    listMarketplaceReviews(), listSellerReviews(), listMarketplaceReviewAssets(),
    queryDatabase<MarketplaceCounts>(`
      select (select count(*) from marketplace_sellers)::text as sellers,
        (select count(*) from marketplace_books)::text as books,
        (select count(distinct buyer_email) from marketplace_orders)::text as buyers,
        (select count(*) from marketplace_orders)::text as orders,
        (select count(*) from marketplace_orders where status='paid')::text as paid,
        (select coalesce(sum(total_minor), 0) from marketplace_orders where status='paid')::text as paid_sales_minor,
        (select coalesce(sum(credit_minor - debit_minor), 0) from marketplace_ledger_entries
          where account_code='platform_commission')::text as net_commission_minor,
        (select count(*) from marketplace_orders o where o.status in ('paid', 'refunded', 'disputed')
          and o.paid_at is not null and not exists
          (select 1 from marketplace_fiscal_evidence e where e.order_id=o.id))::text as fiscal_pending`),
    queryDatabase<SellerContact>(`
      select s.id, i.email, s.display_name, s.public_slug, s.status, s.created_at::text
      from marketplace_sellers s
      left join marketplace_seller_identities i on i.id::text=s.owner_user_id
      order by s.created_at desc, s.id desc limit 100`),
    queryDatabase<MarketplaceOrder>(`
      select o.id, o.buyer_email, o.total_minor::text, o.status, o.created_at::text,
        o.paid_at::text, items.title, items.seller_name, items.commission_minor, items.commission_tax_minor, items.tax_minor,
        p.status as payment_status,
        p.id as payment_id, p.gateway_fee_actual_minor::text, p.gateway_fee_reconciled,
        delivery.status as delivery_status,
        e.document_kind, e.document_reference
      from marketplace_orders o
      left join lateral (
        select string_agg(r.title, ', ' order by r.title) as title,
          string_agg(s.display_name, ', ' order by s.display_name) as seller_name,
          coalesce(sum(oi.commission_minor), 0)::text as commission_minor,
          coalesce(sum(oi.commission_tax_minor), 0)::text as commission_tax_minor,
          coalesce(sum(oi.tax_minor), 0)::text as tax_minor
        from marketplace_order_items oi
        join marketplace_book_revisions r on r.id=oi.revision_id
        join marketplace_sellers s on s.id=oi.seller_id
        where oi.order_id=o.id
      ) items on true
      left join lateral (
        select pay.id, pay.status, pay.gateway_fee_actual_minor,
          (pay.gateway_fee_actual_minor = 0 or (pay.gateway_fee_actual_minor > 0
            and exists (select 1 from marketplace_ledger_entries fee
              where fee.payment_id=pay.id and fee.source_type='gateway_fee_actual'
                and fee.account_code='seller_payable'
                and fee.debit_minor=pay.gateway_fee_actual_minor and fee.credit_minor=0)
            and exists (select 1 from marketplace_ledger_entries fee
              where fee.payment_id=pay.id and fee.source_type='gateway_fee_actual'
                and fee.account_code='processor_clearing'
                and fee.credit_minor=pay.gateway_fee_actual_minor and fee.debit_minor=0))) as gateway_fee_reconciled
        from marketplace_payments pay
        where pay.order_id=o.id order by pay.created_at desc, pay.id desc limit 1
      ) p on true
      left join lateral (
        select status from marketplace_outbox
        where aggregate_type='order' and aggregate_id=o.id
        order by created_at desc, id desc limit 1
      ) delivery on true
      left join marketplace_fiscal_evidence e on e.order_id=o.id
      order by (o.status in ('paid', 'refunded', 'disputed') and o.paid_at is not null and e.order_id is null) desc,
        o.created_at desc, o.id desc limit 100`),
    queryDatabase<SellerBalance>(`
      select seller_id, display_name, ledger_net_minor::text, settled_minor::text,
        available_minor::text, blocked
      from public.marketplace_seller_payout_balances
      order by display_name, seller_id limit 100`),
  ]);
  return <div className={`${layout.shell} ${styles.workspace}`}>
    <aside className={`${layout.sidebar} ${styles.sidebar}`}>
      <a className={layout.brand} href="/ebooks/mercado">
        <span className={layout.brandMark} aria-hidden="true">C</span>
        <span>CRECECONIA<small>MARKETPLACE</small></span>
      </a>
      <nav className={styles.navigation} aria-label="Secciones de administración">
        <a href="#resumen">Resumen</a><a href="#ventas">Ventas y boletas</a>
        <a href="#liquidaciones">Liquidaciones</a><a href="#usuarios">Usuarios</a>
        <a href="#verificaciones">Verificaciones</a><a href="#libros">Libros</a><a href="#servicios">Servicios</a>
      </nav>
    </aside>
    <main className={layout.main}>
    <div className={layout.topbar}><span className={layout.breadcrumb}>Marketplace / Administración</span><span>{preview ? "Vista previa" : "Operación en vivo"}</span></div>
    <div className={`${layout.content} ${styles.content}`}>
    <header className={layout.heading}>
      <div><h1>Administración del Marketplace</h1><p>Revisa autores, publicaciones, ventas y liquidaciones en un solo lugar.</p></div>
      <a className={layout.outlineButton} href="/ebooks/mercado">Ver tienda ↗</a>
    </header>
    {preview && <div className={layout.notice}><p>Este preview muestra el panel sin datos. <a href="?vista=demo">Explorar con datos de ejemplo</a></p></div>}
    {!preview && resultado === "guardado" && <p role="status" className={layout.notice}>Cambio guardado.</p>}
    <section id="resumen" aria-labelledby="resumen-title" className={styles.section}>
      <h2 id="resumen-title">Resumen de operación</h2>
      <div className={layout.metrics}>
        {([ ["Autores", counts[0]?.sellers], ["Libros", counts[0]?.books],
          ["Compradores", counts[0]?.buyers], ["Órdenes", counts[0]?.orders],
          ["Pagadas", counts[0]?.paid],
          ["Ventas pagadas", formatCLP(counts[0]?.paid_sales_minor ?? "0")],
          ["Comisión cobrada con IVA, tras reversos", formatCLP(counts[0]?.net_commission_minor ?? "0")],
          ["Boletas o vouchers pendientes", counts[0]?.fiscal_pending] ] as const).map(([label, value]) =>
          <div key={label} className={layout.metric}>
            <p>{label}</p><strong>{value ?? "0"}</strong>
          </div>)}
      </div>
    </section>
    <section id="ventas" aria-labelledby="ventas-title" className={`${layout.panel} ${styles.section}`}>
      <h2 id="ventas-title">Compradores, ventas y comprobantes</h2>
      <p>Hasta 100 órdenes, con los comprobantes pendientes primero. Registra el folio de la boleta emitida manualmente o la referencia del voucher correspondiente.</p>
      {orders.length === 0 ? <p className={styles.empty}>Aún no hay órdenes. Las compras y comprobantes aparecerán aquí.</p> :
        <div className={styles.records}>
          {orders.map((order) => <article key={order.id} className={styles.record}>
            <h3 style={{ fontSize: "1.2rem" }}>{order.title ?? "Libro pendiente"} · {formatCLP(order.total_minor)}</h3>
            <p>Comprador: {order.buyer_email} · Autor: {order.seller_name ?? "Pendiente"}</p>
            <p>Orden: {order.id} · {order.status} · Pago: {order.payment_status ?? "pendiente"} · Entrega: {order.delivery_status ?? "pendiente"}</p>
            <p>Creada: {new Date(order.created_at).toLocaleString("es-CL", { timeZone: "America/Santiago" })}
              {order.paid_at && ` · Pagada: ${new Date(order.paid_at).toLocaleString("es-CL", { timeZone: "America/Santiago" })}`}</p>
            {order.paid_at && <>
              <p>Total cobrado al comprador: <strong>{formatCLP(order.total_minor)}</strong> · IVA registrado en la venta: <strong>{formatCLP(order.tax_minor)}</strong></p>
              <p>Comisión CrececonIA sin IVA: {formatCLP(BigInt(order.commission_minor) - BigInt(order.commission_tax_minor))}
                {" · "}IVA de la comisión: {formatCLP(order.commission_tax_minor)}
                {" · "}Total de la comisión: {formatCLP(order.commission_minor)}
                {["refunded", "disputed"].includes(order.status) && " · Reversada"}</p>
            </>}
            <p>Tarifa Flow observada: {order.gateway_fee_actual_minor === null ? "por conciliar" : formatCLP(order.gateway_fee_actual_minor)}
              {order.gateway_fee_actual_minor !== null && !order.gateway_fee_reconciled && " · asiento pendiente"}</p>
            {["paid", "refunded", "disputed"].includes(order.status)
              && ["confirmed", "refunded", "disputed"].includes(order.payment_status ?? "")
              && order.payment_id && !order.gateway_fee_reconciled
              && <FeeEvidenceForm paymentId={order.payment_id} />}
            {order.document_reference ? <p>Respaldo tributario: {order.document_kind} · {order.document_reference}</p> :
              order.paid_at && ["paid", "refunded", "disputed"].includes(order.status)
                ? <FiscalEvidenceForm orderId={order.id} />
                : <p>El comprobante se registra al confirmar el pago.</p>}
            {order.status === "paid" && order.payment_status === "confirmed" && order.payment_id &&
              <RefundForm paymentId={order.payment_id} />}
          </article>)}
        </div>}
    </section>
    <section id="liquidaciones" aria-labelledby="liquidaciones-title" className={`${layout.panel} ${styles.section}`}>
      <h2 id="liquidaciones-title">Liquidaciones a autores</h2>
      <p>Saldo según libro contable menos transferencias registradas. Se bloquea si falta la boleta, la tarifa Flow conciliada o hay una devolución o disputa pendiente.</p>
      {balances.length === 0 ? <p className={styles.empty}>Aún no hay autores para liquidar.</p> :
        <div className={styles.records}>
          {balances.map((balance) => <article key={balance.seller_id} className={styles.record}>
            <h3 style={{ fontSize: "1.2rem" }}>{balance.display_name}</h3>
            <p>Devengado: {formatCLP(balance.ledger_net_minor)} · Ya transferido: {formatCLP(balance.settled_minor)}</p>
            <p>Saldo: {formatCLP(balance.available_minor)} · {balance.blocked ? "Bloqueado para revisión" : "Conciliado"}</p>
            {balance.blocked ? <p>Revisa boletas, tarifa Flow, reembolsos, disputas y órdenes antes de transferir.</p> :
              BigInt(balance.available_minor) > BigInt(0) && <SettlementForm sellerId={balance.seller_id} maxMinor={balance.available_minor} />}
          </article>)}
        </div>}
    </section>
    <section id="usuarios" aria-labelledby="usuarios-title" className={`${layout.panel} ${styles.section}`}>
      <h2 id="usuarios-title">Usuarios vendedores</h2>
      <p>Últimos 100 perfiles. El correo se muestra solo en este panel protegido.</p>
      {contacts.length === 0 ? <p className={styles.empty}>Aún no hay perfiles de vendedores.</p> :
        <div className={styles.records}>
          {contacts.map((contact) => <div key={contact.id} className={styles.record}>
            <strong>{contact.display_name}</strong> · {contact.status}<br />
            <span>{contact.email ?? "Sin correo asociado"} · /{contact.public_slug}</span>
          </div>)}
        </div>}
    </section>
    <section id="verificaciones" aria-labelledby="seller-review-title" className={`${layout.panel} ${styles.section}`}>
      <h2 id="seller-review-title">Verificación de autores</h2>
      <p>Verifica identidad, contenido y condiciones antes de activar una cuenta. Cada libro requiere revisión y publicación antes de recibir pagos.</p>
      {sellers.length === 0 && <p className={styles.empty}>No hay autores en revisión.</p>}
      {sellers.length > 0 && <div className={styles.records}>
        {sellers.map((seller) => <article key={seller.id} className={styles.record}>
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
      </div>}
    </section>
    <section id="libros" aria-labelledby="libros-title" className={`${layout.panel} ${styles.section}`}>
    <h2 id="libros-title">Libros</h2>
    {rows.length === 0 && <p className={styles.empty}>No hay libros pendientes de revisión.</p>}
    {rows.length > 0 && <div className={styles.records}>
      {rows.map((row) => {
        const ready = Boolean(row.rights_declared_at && row.ready_pdf && row.ready_cover && row.price_tax_mode !== "pending_review");
        return <article key={row.book_id} className={styles.record}>
          <p className="eyebrow">{row.seller_name} · {row.seller_status}</p>
          <h2 style={{ fontSize: "1.5rem", margin: "10px 0" }}>{row.title}</h2>
          {row.subtitle && <p>{row.subtitle}</p>}
          <p>/{row.slug} · {row.category} · Autor: {row.author_display_name} · {formatCLP(row.price_minor)} · Libro: {row.book_status} · Revisión: {row.moderation_status}</p>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{row.description}</p>
          <ul style={{ marginTop: 16, paddingLeft: 20 }}>
            <li>Derechos declarados: {row.rights_declared_at ? row.rights_declaration_version ?? "sí" : "pendiente"}</li>
            <li>PDF validado: {row.ready_pdf ? "sí" : "pendiente"}</li>
            <li>Portada revisada: {row.ready_cover ? "sí" : "pendiente"}</li>
            <li>Tratamiento tributario: {row.price_tax_mode}</li>
          </ul>
          {assets.filter((asset) => asset.revision_id === row.revision_id).map((asset) =>
            <div key={asset.id} style={{ padding: 16, margin: "16px 0", border: "1px solid var(--border)", borderRadius: 8 }}>
              <p>Archivo: {asset.asset_kind} · {asset.scan_status} · {asset.byte_size} bytes</p>
              {asset.asset_kind === "ebook_pdf" && <a href={`/api/admin/marketplace/assets/${asset.id}`}>Descargar PDF para revisión</a>}
              {asset.asset_kind === "cover" && <a href={`/api/admin/marketplace/assets/${asset.id}`} target="_blank" rel="noopener noreferrer">Abrir portada para revisión</a>}
              {asset.scan_status === "quarantined" && (asset.asset_kind === "ebook_pdf" || asset.asset_kind === "cover") &&
                <form action="/api/admin/marketplace/assets" method="post" style={{ marginTop: 14 }}>
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <label htmlFor={`asset-reason-${asset.id}`}>Resultado de revisión del archivo</label>
                  <textarea id={`asset-reason-${asset.id}`} name="reason" minLength={10} maxLength={2000} required
                    style={{ display: "block", width: "100%", minHeight: 75, margin: "8px 0 12px", color: "#111" }} />
                  <label style={{ display: "block", marginBottom: 12 }}>
                    <input name="manual_review_confirmed" value="yes" type="checkbox" /> Revisé el archivo y confirmo que corresponde al contenido declarado.
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
          {(row.book_status === "approved" || row.book_status === "paused") && !row.publication_verified &&
            <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
              <input type="hidden" name="book_id" value={row.book_id} />
              <input type="hidden" name="revision_id" value={row.revision_id} />
              <fieldset disabled={!ready || row.seller_status !== "active"} style={{ border: "1px solid var(--border)", padding: 16 }}>
                <legend>Verificación final antes de publicar</legend>
                <p>Confirma cada punto tras revisar las evidencias. Esta decisión queda registrada para esta versión del libro.</p>
                <label style={{ display: "block" }}><input type="checkbox" name="confirm_identity" value="yes" required /> Identidad del autor y titularidad del perfil verificadas</label>
                <label style={{ display: "block" }}><input type="checkbox" name="confirm_tax" value="yes" required /> RUT, inicio de actividades y situación tributaria comprobados</label>
                <label style={{ display: "block" }}><input type="checkbox" name="confirm_rights" value="yes" required /> Derechos de publicación y declaración del autor revisados</label>
                <label style={{ display: "block" }}><input type="checkbox" name="confirm_pdf" value="yes" required /> PDF aprobado corresponde a este libro</label>
                <label style={{ display: "block" }}><input type="checkbox" name="confirm_cover" value="yes" required /> Portada aprobada corresponde a este libro</label>
                <label htmlFor={`publication-evidence-${row.book_id}`} style={{ display: "block", marginTop: 12 }}>Referencia de la evidencia y decisión (sin documentos personales)</label>
                <textarea id={`publication-evidence-${row.book_id}`} name="reason" minLength={20} maxLength={2000} required
                  style={{ display: "block", width: "100%", minHeight: 90, margin: "8px 0 12px", color: "#111" }} />
                <button name="action" value="verify_publication">Registrar verificación final</button>
              </fieldset>
            </form>}
          {(row.book_status === "approved" || row.book_status === "paused") && <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="book_id" value={row.book_id} />
            <input type="hidden" name="revision_id" value={row.revision_id} />
            <button name="action" value="publish" disabled={!ready || row.seller_status !== "active" || !row.publication_verified}>Publicar libro</button>
            {!row.publication_verified && <p>Registra la verificación final para habilitar la publicación.</p>}
          </form>}
          {row.book_status === "published" && <form action="/api/admin/marketplace" method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="book_id" value={row.book_id} />
            <input type="hidden" name="revision_id" value={row.published_revision_id ?? ""} />
            <button name="action" value="pause">Pausar publicación</button>
          </form>}
        </article>;
      })}
    </div>}
    </section>
    <section id="servicios" aria-labelledby="servicios-title" className={`${layout.panel} ${styles.section}`}>
      <h2 id="servicios-title">Estado de los servicios</h2>
      <p>Consulta la conexión de la base de datos y el almacenamiento privado.</p>
      {preview ? <p className={styles.empty}>La comprobación está disponible en producción con sesión de administrador.</p> : <MarketplaceHealth />}
    </section>
    </div>
    </main>
  </div>;
}
