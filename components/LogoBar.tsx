// TODO: reemplazar CLIENT_PLACEHOLDERS con logos reales (SVG/PNG transparente, grayscale).
// Cada logo debe tener: name, sector, country. Agregar src cuando estén disponibles.
const CLIENT_PLACEHOLDERS = [
  { name: "Constructora · CL", sector: "Construcción" },
  { name: "Distribuidora · MX", sector: "Distribución" },
  { name: "Manufacturera · CL", sector: "Manufactura" },
  { name: "Consultora · ES", sector: "Servicios profesionales" },
  { name: "Retail · AR", sector: "Retail" },
  { name: "Logística · PE", sector: "Logística" },
];

// Duplicamos para el loop infinito del marquee
const ITEMS = [...CLIENT_PLACEHOLDERS, ...CLIENT_PLACEHOLDERS];

export default function SectorStrip() {
  return (
    <section
      className="py-10 border-y overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p
        className="text-center text-xs font-semibold uppercase tracking-widest mb-6"
        style={{ color: "var(--muted)" }}
      >
        Han implementado IA con nosotros
      </p>

      <div className="slider-wrap relative">
        <div
          className="slider-track flex items-center gap-10"
          style={{
            animation: "scroll-logos 26s linear infinite",
            width: "max-content",
          }}
        >
          {ITEMS.map((client, i) => (
            <span
              key={i}
              className="flex items-center gap-10 whitespace-nowrap"
            >
              {/* TODO: reemplazar este bloque por <img src={client.src} alt={client.name} ... /> */}
              <span
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg"
                style={{
                  background: "rgba(0,0,0,0.03)",
                  border: "1px solid var(--border)",
                  minWidth: 120,
                }}
              >
                <span className="text-xs font-bold" style={{ color: "var(--ink)", opacity: 0.7 }}>
                  {client.name}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.55 }}>
                  {client.sector}
                </span>
              </span>
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: "var(--muted)", opacity: 0.25 }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Sub-strip: sectores */}
      <p
        className="text-center text-xs mt-5"
        style={{ color: "var(--muted)", opacity: 0.6 }}
      >
        Construcción · Distribución · Manufactura · Servicios · Retail · Logística · Educación
      </p>
    </section>
  );
}
