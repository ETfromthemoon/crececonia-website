const BELIEFS = [
  {
    number: "01",
    title: "La IA es una herramienta, no una estrategia.",
    body: "La mayoría de las empresas que nos llaman querían IA para problemas que no requieren IA. Requieren ordenar data, mapear procesos rotos, o cambiar incentivos del equipo. Por eso aplicamos el Protocolo BPI — primero las Bases, después los Procesos, y solo entonces evaluamos la IA.",
  },
  {
    number: "02",
    title: "La adopción es el único KPI real.",
    body: "Una herramienta sin adopción es gasto, no inversión. Medimos adopción en la semana 3, no entregables en la semana 12. Si en la semana 3 el equipo no la está usando, iteramos sin costo hasta que lo hagan. No facturamos la fase de adopción si no se adoptó.",
  },
  {
    number: "03",
    title: "Las medianas merecen jugar el juego de las grandes.",
    body: "Las consultoras serias se dedican a Fortune 500 y a corporativos enormes. Las medianas quedan a merced de agencias que venden chatbots y promesas vagas. CrececonIA existe para llenar ese hueco: el mismo rigor técnico y operacional que reciben las grandes, sin el ruido y sin las horas facturadas a perpetuidad.",
  },
];

export default function Beliefs() {
  return (
    <section id="manifiesto" className="section-y px-6">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">Lo que creemos</p>
        <h2
          className="font-light mb-4 leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
        >
          Tres principios que <em className="gradient-text">no negociamos.</em>
        </h2>
        <p
          className="text-base mb-14 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Cualquier proyecto que tomamos pasa por este filtro. Si no encajas en
          los tres, te lo decimos en el Test de Fit y no avanzamos.
        </p>

        <div className="flex flex-col gap-8">
          {BELIEFS.map((b) => (
            <div
              key={b.number}
              className="flex gap-6 pb-8"
              style={{ borderBottom: "1px solid rgba(30,30,31,0.9)" }}
            >
              <span
                className="flex-shrink-0 pt-1"
                style={{
                  color: "var(--champagne)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                }}
              >
                {b.number}
              </span>
              <div className="flex-1">
                <h3
                  className="font-light text-xl mb-3 leading-snug"
                  style={{
                    color: "var(--bone)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {b.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
                >
                  {b.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
