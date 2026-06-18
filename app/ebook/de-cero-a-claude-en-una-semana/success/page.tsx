import type { Metadata } from "next";
import DownloadLink from "@/components/DownloadLink";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compra exitosa — Ebook · CrececonIA",
  robots: { index: false, follow: false },
};

function CheckCircle() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--champagne)" }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="pt-28">
      <section
        className="section-y-spacious px-6 flex items-center justify-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="max-w-md mx-auto text-center">
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <CheckCircle />
          </div>

          <p className="eyebrow mb-4">Compra exitosa</p>

          <h1
            className="font-light leading-tight mb-6"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--bone)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
            }}
          >
            ¡Gracias por tu compra!
          </h1>

          <p
            className="leading-relaxed mb-10"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Tu ebook{" "}
            <strong style={{ color: "var(--bone)", fontWeight: 400 }}>
              De cero a Claude en una semana
            </strong>{" "}
            está listo. Hacé clic abajo para descargarlo ahora.
          </p>

          <div style={{ marginBottom: 24 }}>
            {token ? (
              <DownloadLink token={token} />
            ) : (
              <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
                Revisá tu email — te enviamos el link de descarga.
              </p>
            )}
          </div>

          <p
            className="text-sm"
            style={{ color: "var(--smoke)", fontWeight: 300, lineHeight: 1.7 }}
          >
            También te enviamos el link a tu email. Si lo perdés, podés
            recuperarlo en{" "}
            <Link
              href="/ebook/de-cero-a-claude-en-una-semana/descargar"
              style={{ color: "var(--champagne)", textDecoration: "none" }}
            >
              la página de re-descarga
            </Link>
            .
          </p>

          <div style={{ marginTop: 48 }}>
            <Link
              href="/"
              className="text-sm"
              style={{
                color: "var(--smoke)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
