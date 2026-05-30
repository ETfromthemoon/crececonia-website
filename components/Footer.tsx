"use client";

const COL_SERVICIOS = [
  { label: "Protocolo BPI", href: "/protocolo-bpi" },
  { label: "Lo que creemos", href: "/#manifiesto" },
  { label: "Casos reales", href: "/#resultados" },
  { label: "Inversión", href: "/#servicios" },
];

const COL_RECURSOS = [
  { label: "Preguntas frecuentes", href: "/#faq" },
  { label: "Skills para Claude Code", href: "/skills" },
];

const linkStyle = {
  color: "var(--smoke)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.06em",
  fontSize: "12px",
  textTransform: "none" as const,
  lineHeight: 1.8,
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const headerStyle = {
  color: "var(--bone)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.16em",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  marginBottom: "16px",
  fontWeight: 600 as const,
};

export default function Footer() {
  return (
    <footer
      className="pt-16 pb-8 px-6 border-t"
      style={{ borderColor: "rgba(30,30,31,0.9)", background: "var(--obsidian)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 3 columnas — en mobile: brand a la izquierda + 2 cols apilados después */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mb-12">

          {/* Col 1 — Brand (full width en mobile pequeño) */}
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
              Consultoría de IA para empresas medianas. Aplicamos el Protocolo BPI:
              Bases, Procesos, IA — en ese orden.
            </p>
            <p
              className="mt-4 text-xs"
              style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
            >
              Santiago, Chile
            </p>
          </div>

          {/* Col 2 — Servicios */}
          <div>
            <p style={headerStyle}>Servicios</p>
            <ul className="space-y-1.5">
              {COL_SERVICIOS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={linkStyle}
                    className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Recursos */}
          <div>
            <p style={headerStyle}>Recursos</p>
            <ul className="space-y-1.5">
              {COL_RECURSOS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={linkStyle}
                    className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separador + cierre */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(30,30,31,0.9)" }}
        >
          <p
            className="text-xs"
            style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
          >
            © {new Date().getFullYear()} CrececonIA · Strimo SPA · Todos los derechos reservados
          </p>
          <div className="flex items-center gap-5">
            <a
              href="mailto:sergio@crececonia.cl"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/sergioastudillo"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              LinkedIn
            </a>
            <a
              href="https://wa.me/56961945206"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              className="transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
