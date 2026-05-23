const PILLARS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Sin contrato anual.",
    description: "Cada fase es independiente y cancelable. Solo seguimos si los entregables están a tu altura.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "NDA incluido.",
    description: "Firmamos antes de la primera entrevista. Toda la información de tu operación queda bajo confidencialidad.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Pago contra entregables.",
    description: "No facturamos horas ni tiempo. Facturamos hitos concretos: mapa de ruta entregado, sistema funcionando.",
  },
];

export default function Guarantee() {
  return (
    <section className="py-20 px-6" style={{ background: "var(--card)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--accent)" }}
          >
            Nuestra garantía
          </p>
          <h2
            className="font-bold leading-tight max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "var(--ink)",
            }}
          >
            Si en la semana 3 nadie en tu equipo está usando el sistema,{" "}
            <span className="gradient-text">lo iteramos sin costo hasta que lo hagan.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border p-6 flex flex-col gap-4"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  color: "var(--indigo)",
                }}
              >
                {pillar.icon}
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                  {pillar.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/#proceso"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--indigo)" }}
          >
            Ver el proceso completo →
          </a>
        </div>
      </div>
    </section>
  );
}
