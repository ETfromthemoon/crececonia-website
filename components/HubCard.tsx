import Link from "next/link";
import { TIPO_LABEL, type HubItem } from "@/lib/hub";

const TIPO_CTA: Record<HubItem["tipo"], string> = {
  skill: "Ver skill →",
  guia: "Leer la guía →",
  enlace: "Abrir enlace ↗",
};

export default function HubCard({ item }: { item: HubItem }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Badge de TIPO (champagne) */}
        <span
          className="text-xs px-2 py-0.5"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--champagne)",
            background: "var(--gold-soft)",
            border: "1px solid rgba(217,179,106,0.15)",
            borderRadius: 2,
          }}
        >
          {TIPO_LABEL[item.tipo]}
        </span>
        {item.meta && (
          <span
            style={{
              color: "var(--smoke)",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            ↓ {item.meta}
          </span>
        )}
      </div>

      <h3
        className="mb-2 font-light"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          color: "var(--bone)",
          lineHeight: 1.3,
        }}
      >
        {item.titulo}
      </h3>
      <p
        className="text-sm leading-relaxed line-clamp-3"
        style={{ color: "var(--ash)", fontWeight: 300 }}
      >
        {item.descripcion}
      </p>

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5"
              style={{
                color: "var(--smoke)",
                border: "1px solid rgba(30,30,31,0.9)",
                borderRadius: 2,
                fontFamily: "var(--font-mono)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p
        className="mt-5 text-xs"
        style={{
          color: "var(--champagne)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
        }}
      >
        {TIPO_CTA[item.tipo]}
      </p>
    </>
  );

  const cardStyle = {
    background: "var(--carbon)",
    border: "1px solid rgba(30,30,31,0.9)",
    borderRadius: 4,
    padding: "24px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as const;

  if (item.externo) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block card-hover-dark"
        style={cardStyle}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className="group block card-hover-dark" style={cardStyle}>
      {inner}
    </Link>
  );
}
