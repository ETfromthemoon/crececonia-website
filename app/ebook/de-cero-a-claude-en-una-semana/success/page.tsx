import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compra exitosa — Ebook · CrececonIA",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="monad pt-28">
      <section
        className="section-y px-6"
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          {/* Check icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#cfdaf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#242424"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4e4d4d",
              marginBottom: 16,
            }}
          >
            Compra exitosa
          </p>

          <h1
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#000",
              marginBottom: 20,
            }}
          >
            ¡Gracias por tu compra!
          </h1>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "#4e4d4d",
              lineHeight: 1.8,
              marginBottom: 40,
            }}
          >
            Tu ebook{" "}
            <strong style={{ color: "#000", fontWeight: 400 }}>
              De cero a Claude en una semana
            </strong>{" "}
            está listo. Descargalo ahora — el link no vence.
          </p>

          {token ? (
            <div style={{ marginBottom: 32 }}>
              <a
                href={`/api/ebook/download?token=${encodeURIComponent(token)}`}
                className="btn-monad-fill"
                style={{ display: "inline-flex" }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar ebook (PDF)
              </a>
            </div>
          ) : (
            <div
              style={{
                background: "#cfdaf5",
                borderRadius: 16,
                padding: "20px 24px",
                marginBottom: 32,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "#242424",
                  lineHeight: 1.6,
                }}
              >
                Revisá tu email — te enviamos el link de descarga directo.
              </p>
            </div>
          )}

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "#4e4d4d",
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            ¿Perdiste el link?{" "}
            <Link
              href="/ebook/de-cero-a-claude-en-una-semana/descargar"
              style={{
                color: "#242424",
                textDecoration: "underline",
                textDecorationColor: "rgba(0,0,0,0.3)",
                textUnderlineOffset: 3,
              }}
            >
              Recuperá tu descarga aquí
            </Link>{" "}
            ingresando tu email.
          </p>

          <Link
            href="/"
            style={{
              color: "#4e4d4d",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
            }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
