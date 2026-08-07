"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-resource-ids";
import type { EbookCatalogEntry } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";
import { trackEbookEvent } from "@/lib/analytics";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import EbookSectionHeading from "./EbookSectionHeading";
import EbookSoldCounter from "./EbookSoldCounter";
import styles from "./EbookCinematic.module.css";

type LiveCatalogEntry = Extract<EbookCatalogEntry, { active: true }>;

type EbookPricingProps = {
  resource?: string;
  /**
   * Libros a ofrecer como "sumá otros ebooks", YA resueltos por el Server
   * Component que renderiza esta página (getCrossSellEntries corriendo en
   * el servidor). A propósito NO se calcula acá adentro: este es un "use
   * client" component, y lib/ebook-catalog.ts (de donde sale ese cálculo)
   * expone el array completo de precios por tramo y los instantes
   * `visibleFrom` de TODOS los libros, incluidos los que aún no se anuncian.
   * Importarlo desde código de cliente —aunque sea indirectamente, vía
   * ebook-crossell.ts— hace que el bundler meta ese array completo, en texto
   * plano, en el JS que se manda a cualquier visitante de esta página. Pasó
   * de verdad: se confirmó grepeando el chunk generado por el build antes de
   * este fix. Recibirlo ya resuelto como prop evita que ese dato sensible
   * viaje al navegador antes de tiempo.
   */
  crossSellEntries?: LiveCatalogEntry[];
  /**
   * Extras a preseleccionar al montar (desde un link `?bundle=slug`), ya
   * resueltos y filtrados a libros vivos por el Server Component — mismo
   * motivo que `crossSellEntries`: lib/ebook-bundles.ts (EBOOK_BUNDLES, con
   * los nombres y pitches de los combos) no debería importarse desde código
   * de cliente si se puede evitar. No es tan sensible como el precio, pero
   * revela nombres de combos y qué libros los componen antes del anuncio.
   */
  initialSelectedExtras?: string[];
  /** Código de descuento a auto-aplicar al montar (desde un link `?promo=CODIGO`). */
  initialPromoCode?: string;
  /**
   * Vista previa privada del dueño del sitio para probar el checkout de un
   * libro ANTES de su `visibleFrom`, sin abrirlo al público — ver
   * isAdminPreviewKey en lib/ebook-catalog.ts. Viaja en las requests a
   * /api/ebook/cupos, /api/flow/create y /api/ebook/discount/validate, que
   * son quienes de verdad validan el secreto contra ADMIN_SECRET; este
   * componente solo lo reenvía, nunca decide nada con él.
   */
  previewKey?: string;
};

const TIER_LABELS: Record<string, { badge: string; discount: string }> = {
  "super-early": { badge: "Super Early", discount: "60% OFF" },
  early: { badge: "Early Adopters", discount: "33% OFF" },
  regular: { badge: "", discount: "" },
};

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type AppliedDiscount = { code: string; finalPrice: number };

export default function EbookPricing({
  resource = DEFAULT_EBOOK_RESOURCE,
  crossSellEntries = [],
  initialSelectedExtras,
  initialPromoCode,
  previewKey,
}: EbookPricingProps) {
  const otherActiveEbooks = crossSellEntries;
  const pricingVariant = useFeatureFlagVariantKey("ebook-pricing-variant") ?? "control";
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  async function handleApplyDiscount(codeOverride?: string) {
    const code = codeOverride ?? discountInput;
    if (!code) return;
    setApplyingDiscount(true);
    setDiscountError("");

    const res = await fetch("/api/ebook/discount/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Sin `resource`, el endpoint validaba el código contra el precio del
      // libro 1 sin importar en qué página se aplicara — un código de 10%
      // en la página de Claude Experto mostraba un "descuento" calculado
      // sobre $17.900 (libro 1) en vez de sobre el precio real de ese libro,
      // pudiendo mostrar un precio "con descuento" más alto que el tachado.
      // El monto real cobrado siempre fue correcto (Flow revalida contra el
      // resource real), pero el número que se mostraba antes de pagar no.
      body: JSON.stringify({ code, resource, previewKey }),
    });
    const data = await res.json().catch(() => ({}));
    setApplyingDiscount(false);

    if (!data.valid) {
      setDiscountError(data.reason ?? "Código no válido.");
      setAppliedDiscount(null);
      return;
    }

    setAppliedDiscount({ code: data.code, finalPrice: data.finalPrice });
  }

  // Preselecciona el combo desde un link de bundle (?bundle=ruta-operador) y
  // auto-aplica un código de descuento de un link de lanzamiento en vivo
  // (?promo=CODIGO), sin que la persona tenga que tocar nada. Ambos ya
  // vienen resueltos por props (el Server Component que renderiza la página
  // lee `searchParams` y resuelve el bundle ahí) — este componente no lee la
  // URL ni importa EBOOK_BUNDLES directamente, para no mandar los nombres y
  // pitches de los combos al bundle de cliente antes de tiempo. Corre una
  // sola vez al montar: si el usuario después decide sacar libros o borrar
  // el código, no lo volvemos a forzar.
  const appliedFromProps = useRef(false);
  useEffect(() => {
    if (appliedFromProps.current) return;
    appliedFromProps.current = true;

    if (initialSelectedExtras && initialSelectedExtras.length > 0) {
      setSelectedExtras(initialSelectedExtras);
      return; // el combo y el código de descuento son mutuamente excluyentes
    }

    if (initialPromoCode) {
      setDiscountInput(initialPromoCode);
      handleApplyDiscount(initialPromoCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previewQs = previewKey ? `&preview=${encodeURIComponent(previewKey)}` : "";
    const load = () =>
      fetch(`/api/ebook/cupos?resource=${resource}${previewQs}`)
        .then((r) => r.json())
        .then(setPriceInfo)
        .catch(() => {});

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [resource, previewKey]);

  useEffect(() => {
    trackEbookEvent("ebook_page_view", { resource, pricing_variant: pricingVariant });
  }, [resource, pricingVariant]);

  const tier = priceInfo?.tier ?? "regular";
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.regular;
  const basePrice = priceInfo?.price ?? 27000;

  // `selectedExtras` normalmente solo se llena tocando los checkboxes de
  // `otherActiveEbooks` (que ya están filtrados a lo que hoy es comprable),
  // pero también puede llegar de un link `?bundle=` — por las dudas, acá se
  // vuelve a filtrar contra la lista viva antes de usarlo para nada. Sin
  // este filtro, un resource "fantasma" (ej. un libro que dejó de estar
  // vivo entre que se armó el link y que alguien lo abrió) rompía el cálculo
  // de precio de la página del libro 1 — que ya está en venta — con
  // "Cannot read properties of undefined (reading 'tierPrices')".
  const otherActiveByResource = new Map(otherActiveEbooks.map((e) => [e.resource, e]));
  const liveExtras = selectedExtras.filter((r) => otherActiveByResource.has(r));
  const isCombo = liveExtras.length > 0;
  const selectedResources = [resource, ...liveExtras];

  // Preview client-side, solo para mostrar el total en vivo — el servidor
  // recalcula todo desde cero en /api/flow/create y nunca confía en este
  // número.
  const bundlePreview = isCombo
    ? computeBundleTotal(
        selectedResources.map((itemResource) => ({
          resource: itemResource,
          price:
            itemResource === resource
              ? basePrice
              : otherActiveByResource.get(itemResource)!.tierPrices.regular,
        }))
      )
    : null;

  const displayPrice = isCombo ? bundlePreview!.total : appliedDiscount?.finalPrice ?? basePrice;
  const formattedPrice = displayPrice.toLocaleString("es-CL");
  const formattedBasePrice = basePrice.toLocaleString("es-CL");
  // Antes esto era un `27000` fijo, de cuando EbookPricing solo se usaba en
  // el libro 1 (cuyo precio regular es, por coincidencia, ese mismo número).
  // Al reusar el componente en libros con otro precio regular (9700/13700/
  // 19700), el hardcode mostraba el "antes" equivocado. `priceInfo.originalPrice`
  // ya lo devuelve la API por resource — solo faltaba usarlo.
  const formattedOriginal = (priceInfo?.originalPrice ?? basePrice).toLocaleString("es-CL");
  const hasDiscount = tier !== "regular";

  function toggleExtra(extraResource: string, checked: boolean) {
    setSelectedExtras((prev) =>
      checked ? [...prev, extraResource] : prev.filter((r) => r !== extraResource)
    );
    // El combo y el código de descuento nunca se combinan — sumar un libro
    // limpia cualquier código ya aplicado.
    setAppliedDiscount(null);
    trackEbookEvent("ebook_combo_toggle", {
      resource,
      extra_resource: extraResource,
      action: checked ? "add" : "remove",
      pricing_variant: pricingVariant,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    trackEbookEvent("ebook_checkout_started", {
      resource,
      tier,
      item_count: selectedResources.length,
      has_discount_code: Boolean(appliedDiscount),
      pricing_variant: pricingVariant,
    });

    const res = await fetch("/api/flow/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        resources: selectedResources,
        discountCode: isCombo ? undefined : appliedDiscount?.code,
        previewKey,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      setErrorMsg(data.error ?? "Error al procesar el pago. Intentá nuevamente.");
      setStatus("error");
      return;
    }

    window.location.href = data.redirectUrl;
  }

  return (
    <section id="comprar" className="section-y px-6">
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <EbookSectionHeading kicker="Precio">
          Empieza hoy.{" "}
          <em style={{ fontStyle: "italic" }}>Sin excusas.</em>
        </EbookSectionHeading>

        <div
          className={`${styles.glass} ${styles.glassSheen}`}
          style={{ borderRadius: 40, overflow: "hidden" }}
        >
          {/* Price header */}
          <div
            style={{
              padding: "36px 36px 28px",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {hasDiscount && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span
                  style={{
                    background: "#242424",
                    color: "#f6f3f1",
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {tierInfo.badge}
                </span>
                <span
                  style={{
                    background: "rgba(0,0,0,0.08)",
                    color: "#242424",
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tierInfo.discount}
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  color: "#000",
                  fontSize: "2.4rem",
                  fontWeight: 400,
                  fontFamily: "var(--font-serif-monad), Georgia, serif",
                }}
              >
                ${formattedPrice}
              </span>
              <span
                style={{
                  color: "#4e4d4d",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                CLP
              </span>
              {(hasDiscount || appliedDiscount) && (
                <span
                  style={{
                    color: "#4e4d4d",
                    fontSize: "0.9rem",
                    textDecoration: "line-through",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ${appliedDiscount ? formattedBasePrice : formattedOriginal}
                </span>
              )}
            </div>

            {appliedDiscount && (
              <p
                style={{
                  color: "#2e7d32",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  marginTop: 6,
                }}
              >
                Código {appliedDiscount.code} aplicado ✓
              </p>
            )}

            <div style={{ marginTop: 8 }}>
              <EbookSoldCounter color="#4e4d4d" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "28px 36px" }}>
            {otherActiveEbooks.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p
                  style={{
                    color: "#4e4d4d",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Sumá otros ebooks y ahorrá más
                </p>
                {otherActiveEbooks.map((entry) => (
                  <label
                    key={entry.resource}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-mono)",
                      color: "#242424",
                      marginBottom: 6,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedExtras.includes(entry.resource)}
                      onChange={(e) => toggleExtra(entry.resource, e.target.checked)}
                    />
                    {entry.title}
                  </label>
                ))}
                {isCombo && (
                  <p style={{ color: "#2e7d32", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: 6 }}>
                    {bundlePreview!.discountPercent}% de descuento por combo aplicado ✓
                  </p>
                )}
              </div>
            )}

            {!appliedDiscount && !isCombo && (
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="ebook-discount"
                  style={{
                    display: "block",
                    color: "#4e4d4d",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  ¿Tienes un código de descuento?
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="ebook-discount"
                    type="text"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value);
                      setDiscountError("");
                    }}
                    placeholder="CODIGO2025"
                    style={{
                      flex: 1,
                      background: "#f6f3f1",
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: 12,
                      padding: "11px 14px",
                      color: "#000",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyDiscount()}
                    disabled={applyingDiscount || !discountInput}
                    style={{
                      cursor: applyingDiscount ? "wait" : "pointer",
                      background: "transparent",
                      border: "1px solid rgba(0,0,0,0.25)",
                      borderRadius: 12,
                      padding: "0 18px",
                      color: "#242424",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {applyingDiscount ? "..." : "Aplicar"}
                  </button>
                </div>
                {discountError && (
                  <p
                    style={{
                      color: "#c0392b",
                      fontSize: "0.75rem",
                      marginTop: 6,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {discountError}
                  </p>
                )}
              </div>
            )}

            <label
              htmlFor="ebook-email"
              style={{
                display: "block",
                color: "#4e4d4d",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Tu email
            </label>
            <input
              id="ebook-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                background: "#f6f3f1",
                border: "1px solid rgba(0,0,0,0.2)",
                borderRadius: 12,
                padding: "13px 16px",
                color: "#000",
                fontSize: "0.95rem",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
                fontFamily: "var(--font-mono)",
              }}
            />

            {errorMsg && (
              <p
                style={{
                  color: "#c0392b",
                  fontSize: "0.8rem",
                  marginBottom: 12,
                  lineHeight: 1.5,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-monad-fill"
              style={{
                width: "100%",
                cursor: status === "loading" ? "wait" : "pointer",
              }}
            >
              {status === "loading"
                ? "Redirigiendo a pago..."
                : `Comprar ahora · $${formattedPrice} CLP`}
            </button>
          </form>

          {/* Trust signals */}
          <div
            style={{
              padding: "0 36px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              "Pago seguro via Flow (Webpay, débito, crédito)",
              "Descarga inmediata al completar el pago",
              "Garantía de devolución si no te sirve",
            ].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#4e4d4d",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <CheckIcon />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
