"use client";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Casos", href: "/#casos" },
  { label: "Precio", href: "/#precio" },
  { label: "FAQ", href: "/#faq" },
  { label: "Centro de Conocimiento", href: "/centro" },
  { label: "Ebook", href: "/ebook/de-cero-a-claude-en-una-semana", highlight: true },
];

const linkStyle: React.CSSProperties = {
  color: "var(--smoke)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  fontSize: "12px",
  textTransform: "none",
  lineHeight: 1.8,
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const headerStyle: React.CSSProperties = {
  color: "var(--bone)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.16em",
  fontSize: "11px",
  textTransform: "uppercase",
  marginBottom: "16px",
  fontWeight: 600,
};

export default function Footer() {
  return (
    <footer
      className="pt-16 pb-8 px-6 border-t"
      style={{ borderColor: "var(--hairline)", background: "var(--carbon)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mb-12">
          {/* Col 1 — Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <a
              href="/"
              className="font-light text-xl tracking-tight inline-block mb-3"
              style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
            >
              Crece<em style={{ color: "var(--champagne)" }}>con</em>IA
            </a>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
            >
              Agentes IA para empresas latinoamericanas.
            </p>
            <p
              className="mt-4 text-xs"
              style={{
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
              }}
            >
              Santiago, Chile
            </p>
          </div>

          {/* Col 2 — Navegación */}
          <div>
            <p style={headerStyle}>Navegación</p>
            <ul className="space-y-1.5">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={{
                      ...linkStyle,
                      color:
                        "highlight" in l && l.highlight
                          ? "var(--champagne)"
                          : "var(--smoke)",
                    }}
                    className="transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--champagne)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "highlight" in l && l.highlight
                          ? "var(--champagne)"
                          : "var(--smoke)")
                    }
                  >
                    {l.label}
                    {"highlight" in l && l.highlight && (
                      <span
                        style={{
                          fontSize: "0.55rem",
                          background: "rgba(196,155,74,0.12)",
                          color: "var(--champagne)",
                          border: "1px solid rgba(196,155,74,0.25)",
                          borderRadius: 2,
                          padding: "1px 5px",
                          letterSpacing: "0.12em",
                          marginLeft: 2,
                        }}
                      >
                        NUEVO
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Contacto */}
          <div>
            <p style={headerStyle}>Contacto</p>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="mailto:sergio@crececonia.cl"
                  style={linkStyle}
                  className="transition-colors"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--champagne)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--smoke)")
                  }
                >
                  sergio@crececonia.cl
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/569XXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                  className="transition-colors"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--champagne)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--smoke)")
                  }
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/sergioastudillo"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                  className="transition-colors"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--champagne)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--smoke)")
                  }
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separador + cierre */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <p
            className="text-xs"
            style={{
              color: "var(--smoke)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
            }}
          >
            &copy; 2026 CrececonIA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="mailto:sergio@crececonia.cl"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--champagne)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--smoke)")
              }
            >
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/sergioastudillo"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--champagne)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--smoke)")
              }
            >
              LinkedIn
            </a>
            <a
              href="https://wa.me/569XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--champagne)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--smoke)")
              }
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
