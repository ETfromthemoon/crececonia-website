import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WAButton } from "@/components/GradientButton";

const SITE_URL = "https://crececonia.cl";

export const metadata: Metadata = {
  title: "Protocolo BPI — Bases · Procesos · IA · CrececonIA",
  description:
    "La metodología propietaria de CrececonIA: sistemas que tu equipo adopta de verdad, sin gastar en IA antes de tiempo. Bases, Procesos, IA: en ese orden.",
  alternates: { canonical: `${SITE_URL}/protocolo-bpi` },
  openGraph: {
    title: "Protocolo BPI — Bases · Procesos · IA",
    description:
      "Primero las Bases. Después los Procesos. Solo entonces, la IA. Saltarse el orden es por qué la mayoría de los proyectos de IA fallan.",
    url: `${SITE_URL}/protocolo-bpi`,
    siteName: "CrececonIA",
    locale: "es_CL",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Protocolo BPI — Bases, Procesos, IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Protocolo BPI — Bases · Procesos · IA",
    description:
      "La metodología propietaria de CrececonIA. Bases, Procesos, IA — en ese orden.",
    images: ["/og-image.png"],
  },
};

type Stage = {
  letter: "B" | "P" | "I";
  label: string;
  tagline: string;
  coreQuestion: string;
  checks: string[];
  ifHere: string;
  failureMode: string;
};

const STAGES: Stage[] = [
  {
    letter: "B",
    label: "Bases",
    tagline: "¿Existen los cimientos sobre los que construir?",
    coreQuestion:
      "¿Tu data está accesible y limpia? ¿Tu equipo entiende sus propios procesos? ¿Sabes qué pasa hoy en tu operación — no en teoría, sino realmente?",
    checks: [
      "La información del negocio está digitalizada — no en cabezas, no en cuadernos, no en hojas sueltas.",
      "El equipo puede describir su trabajo sin contradecirse entre personas del mismo cargo.",
      "Existen métricas básicas de operación (volumen, tiempos, errores) que alguien revisa periódicamente.",
      "Hay un responsable claro por cada flujo crítico. Si algo falla, sabemos a quién preguntarle.",
    ],
    ifHere:
      "Si tu empresa está en la «B», lo más útil que podemos hacer es decírtelo y recomendarte por dónde empezar. La consultoría correcta no somos nosotros — es alguien de operaciones, control de gestión o digitalización. Volver con nosotros tiene sentido cuando esas Bases existan.",
    failureMode:
      "El error típico: comprar IA con la esperanza de que «obligue» a ordenar los datos. La IA no ordena nada. Acelera lo que ya hay. Si hay caos, acelera el caos.",
  },
  {
    letter: "P",
    label: "Procesos",
    tagline: "¿El proceso que quieres automatizar tiene sentido como está?",
    coreQuestion:
      "Si pones una capa de IA sobre este flujo, ¿estarías automatizando una buena solución o cementando una mala? ¿El proceso existe porque resuelve algo real, o porque «siempre se hizo así»?",
    checks: [
      "El proceso tiene un input claro, pasos definibles y un output medible.",
      "Las excepciones son la minoría, no la regla. No el 60% de los casos «no aplica» a las reglas del flujo.",
      "Existe una versión del proceso que el dueño podría dibujar en una servilleta sin avergonzarse.",
      "Rediseñarlo costaría más que dejarlo como está — vale la pena conservarlo y mejorarlo.",
    ],
    ifHere:
      "Si tu empresa está en la «P», muchas veces la mejor IA es rediseñar el proceso primero. Sin licencias nuevas. Sin software adicional. Sin tapar con tecnología un problema operativo. Para eso existe la Auditoría: dos semanas, mapa de procesos priorizado por ROI, hoja de ruta ejecutable.",
    failureMode:
      "El error típico: automatizar un proceso roto. El proceso sigue roto, ahora a mayor velocidad. La adopción cae a las dos semanas porque el equipo descubre que el output no sirve.",
  },
  {
    letter: "I",
    label: "IA",
    tagline: "¿En qué procesos la IA realmente paga el costo total de propiedad?",
    coreQuestion:
      "Costo total de propiedad significa licencias, integración, capacitación, monitoreo, mantenimiento y el riesgo de que falle. ¿La ganancia justifica esa suma — no solo la licencia mensual?",
    checks: [
      "El proceso se ejecuta con frecuencia suficiente para amortizar la instalación (típicamente más de 10 veces por semana).",
      "Hay un costo medible hoy en horas, errores o velocidad — no solo «sería bonito automatizarlo».",
      "El equipo tiene un campeón interno: alguien con autoridad informal para que el sistema se use.",
      "La calidad de los datos es lo suficientemente alta para que el output sea confiable desde la semana 1.",
    ],
    ifHere:
      "Si tu empresa está en la «I», instalamos el sistema, lo integramos a tu stack, capacitamos al equipo y medimos adopción. No facturamos la fase de adopción si no se adoptó. La métrica son personas usando el sistema en la semana 3, no entregables en la semana 12.",
    failureMode:
      "El error típico: implementar IA en procesos con volumen bajo, equipo desalineado o datos inconsistentes. El sistema funciona, pero nadie lo usa. La cuenta sigue corriendo y el ROI nunca llega.",
  },
];

const NOT_BPI = [
  {
    title: "BPI no es un framework genérico de transformación digital.",
    body: "No es Lean, ni Agile, ni ITIL. Es un filtro específico para decidir si la IA tiene caso ahora — o si lo que estás llamando «proyecto de IA» es en realidad un proyecto de orden, de procesos o de cambio cultural.",
  },
  {
    title: "BPI no es un proceso lineal de tres fases.",
    body: "No vendemos «primero te hacemos las Bases, después los Procesos, después la IA». Eso sería un retainer de 18 meses. BPI es un diagnóstico: te decimos en qué letra estás. Si es la B, te recomendamos a otro. Si es la P, hacemos Auditoría. Si es la I, implementamos.",
  },
  {
    title: "BPI no es excusa para no implementar IA.",
    body: "Cuando hay caso real, lo decimos rápido y lo hacemos rápido. El protocolo existe para filtrar el ruido, no para alargar el ciclo de venta. La mayoría de las llamadas terminan con «esto sí» o «esto no» — no con «esto quizás en 18 meses».",
  },
  {
    title: "BPI no es propiedad nuestra como concepto.",
    body: "Cualquiera puede pensar en estos términos. Lo nuestro es el rigor en aplicarlo a empresas medianas y la honestidad de decirte «esto no es para ti» sin mover el precio. Si copian la idea pero no la honestidad, el filtro no funciona.",
  },
];

const TEST_STEPS = [
  {
    n: "01",
    title: "Cuestionario pre-llamada",
    body: "Ocho preguntas que toman cinco minutos: tamaño, industria, proceso que más duele, herramientas que ya usan, horizonte de decisión. Lo leemos antes de conectarnos para no gastar tu tiempo preguntando lo obvio.",
  },
  {
    n: "02",
    title: "Treinta minutos en videollamada",
    body: "Cinco segmentos: encuadre, descubrimiento operacional, diagnóstico técnico y cultural, evaluación estratégica y cierre. No es una demo. No es un pitch. Es Sergio entendiendo en qué letra está tu empresa.",
  },
  {
    n: "03",
    title: "Matriz de fit en seis dimensiones",
    body: "Automabilidad, ROI potencial, madurez técnica, receptividad del equipo, claridad del alcance y urgencia. Cada dimensión se puntúa de 1 a 5 con pesos definidos. Total: 0–45. Es el mismo scoring para todos — no hay descuento por simpatía.",
  },
  {
    n: "04",
    title: "Veredicto honesto en 24 horas",
    body: "Si hay fit, llega propuesta concreta. Si no, llega un correo explicando por qué y qué te recomendamos hacer antes de pensar en IA. En ningún caso queda «pendiente» o «hablamos la próxima».",
  },
];

const PRINCIPLES = [
  "El orden importa. Saltarse una letra no acelera el proyecto — lo hace fallar más caro.",
  "La mayoría de las llamadas terminan en «no, todavía no». Eso es el filtro funcionando.",
  "No hay descuento por «hagamos la I primero y vemos las Bases después». No funciona así.",
  "El Test de Fit es gratuito porque es nuestro filtro, no el tuyo. Si no es para ti, lo decimos rápido.",
];

export default function ProtocoloBPIPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: "var(--obsidian)", paddingTop: 112 }}
      >
        {/* ====== HERO ====== */}
        <section className="relative section-y px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,179,106,0.10) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />

          <div className="relative max-w-3xl mx-auto text-center">
            <p className="eyebrow">Metodología propietaria</p>
            <h1
              className="font-light leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
            >
              Protocolo BPI.
              <br />
              <em className="gradient-text">Bases, Procesos, IA — en ese orden.</em>
            </h1>
            <p
              className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              La mayoría de los proyectos de IA fallan porque la empresa salta a la
              «I» cuando todavía está en la «B» o en la «P». BPI es el filtro que
              usamos en la primera llamada para decidir si avanzamos o si te
              recomendamos a otro.
            </p>

            {/* Flujo B → P → I */}
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-10">
              {(["B", "P", "I"] as const).map((letter, i) => (
                <div key={letter} className="flex items-center gap-3 md:gap-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 4,
                      border: `1px solid ${i === 2 ? "var(--champagne)" : "rgba(217,179,106,0.3)"}`,
                      background:
                        i === 2 ? "rgba(217,179,106,0.10)" : "rgba(255,255,255,0.02)",
                      color: i === 2 ? "var(--champagne)" : "var(--bone)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.9rem",
                      fontWeight: 300,
                    }}
                  >
                    {letter}
                  </div>
                  {i < 2 && (
                    <span
                      style={{
                        color: "var(--champagne)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.2rem",
                        opacity: 0.6,
                      }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>

            <WAButton source="protocolo-bpi-hero" size="lg">
              Solicitar Test de Fit
            </WAButton>
          </div>
        </section>

        {/* ====== POR QUÉ EXISTE ====== */}
        <section
          className="section-y px-6"
          style={{ background: "var(--graphite)" }}
        >
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow">Por qué existe el protocolo</p>
            <h2
              className="font-light leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
            >
              La mayoría no necesita IA.
              <br />
              <em className="gradient-text">Necesita arreglar lo de antes.</em>
            </h2>
            <div
              className="text-base leading-relaxed space-y-5"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              <p>
                Desde 2023 los proyectos de IA en empresas medianas se venden con un
                discurso similar: «instala este copiloto, este chatbot, este agente
                — y vas a ahorrar X horas al mes». La oferta tiene una forma
                conveniente: empieza con la implementación.
              </p>
              <p>
                Lo que vemos repetidamente cuando entramos a estas empresas: el
                problema no está donde se vende la solución. El problema está dos
                pisos abajo. Datos en cabezas. Procesos que nadie escribió.
                Excepciones que son el 60% del flujo. Equipos que no saben quién
                hace qué cuando algo falla.
              </p>
              <p>
                Poner IA encima de eso no resuelve nada. Acelera el desorden y a las
                seis semanas el sistema queda sin usar. La factura sigue corriendo.
                El dueño concluye que «la IA no era para nosotros». La realidad es
                que el orden de las cosas estaba mal.
              </p>
              <p style={{ color: "var(--bone)", fontWeight: 400 }}>
                BPI es la pregunta que hacemos antes de cobrarte un peso:{" "}
                <em className="gradient-text">
                  ¿en qué letra está tu empresa hoy?
                </em>
              </p>
            </div>
          </div>
        </section>

        {/* ====== LAS TRES LETRAS EN DETALLE ====== */}
        <section id="letras" className="section-y px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="eyebrow">Las tres letras</p>
              <h2
                className="font-light leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Cada letra es una <em className="gradient-text">pregunta</em>,
                <br />y una respuesta de qué hacer si estás ahí.
              </h2>
              <p
                className="text-base max-w-2xl mx-auto leading-relaxed"
                style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
              >
                No avanzamos a la siguiente letra sin la anterior resuelta. Es la
                regla que no negociamos — y la razón principal por la que
                cumplimos la métrica de adopción al día 90.
              </p>
            </div>

            <div className="flex flex-col gap-10">
              {STAGES.map((stage, idx) => (
                <article
                  key={stage.letter}
                  className="relative border p-7 md:p-10"
                  style={{
                    borderRadius: 3,
                    borderColor:
                      idx === 2
                        ? "rgba(217,179,106,0.3)"
                        : "rgba(30,30,31,0.9)",
                    background: "var(--carbon)",
                  }}
                >
                  <header className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 mb-8 pb-6" style={{ borderBottom: "1px solid rgba(30,30,31,0.9)" }}>
                    <div className="flex items-baseline gap-4">
                      <span
                        className="leading-none"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "5rem",
                          fontWeight: 300,
                          fontStyle: "italic",
                          color:
                            idx === 2
                              ? "var(--champagne)"
                              : "rgba(231,229,221,0.85)",
                        }}
                      >
                        {stage.letter}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          color: "var(--smoke)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <p
                      className="text-lg md:text-xl font-light leading-snug"
                      style={{
                        color: "var(--bone)",
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                      }}
                    >
                      {stage.tagline}
                    </p>
                  </header>

                  <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                    {/* Columna izquierda: pregunta + checks */}
                    <div>
                      <p
                        className="text-xs mb-3"
                        style={{
                          color: "var(--champagne)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        La pregunta
                      </p>
                      <p
                        className="text-base leading-relaxed mb-7"
                        style={{
                          color: "var(--bone)",
                          fontWeight: 300,
                          lineHeight: 1.75,
                        }}
                      >
                        {stage.coreQuestion}
                      </p>

                      <p
                        className="text-xs mb-3"
                        style={{
                          color: "var(--champagne)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        Lo que verificamos
                      </p>
                      <ul className="flex flex-col gap-3">
                        {stage.checks.map((check, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-sm leading-relaxed"
                            style={{
                              color: "var(--ash)",
                              fontWeight: 300,
                              lineHeight: 1.7,
                            }}
                          >
                            <span
                              style={{
                                color: "var(--champagne)",
                                fontFamily: "var(--font-mono)",
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                              aria-hidden="true"
                            >
                              ·
                            </span>
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Columna derecha: si estás aquí + failure mode */}
                    <div>
                      <p
                        className="text-xs mb-3"
                        style={{
                          color: "var(--champagne)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        Si tu empresa está aquí
                      </p>
                      <p
                        className="text-sm leading-relaxed mb-7"
                        style={{
                          color: "var(--bone)",
                          fontWeight: 300,
                          lineHeight: 1.8,
                        }}
                      >
                        {stage.ifHere}
                      </p>

                      <div
                        className="p-5"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          borderLeft: "2px solid rgba(217,179,106,0.4)",
                          borderRadius: 2,
                        }}
                      >
                        <p
                          className="text-xs mb-2"
                          style={{
                            color: "var(--smoke)",
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                          }}
                        >
                          El error que vemos
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            color: "var(--ash)",
                            fontWeight: 300,
                            lineHeight: 1.75,
                            fontStyle: "italic",
                          }}
                        >
                          {stage.failureMode}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CÓMO IDENTIFICAMOS LA LETRA ====== */}
        <section
          id="como-funciona"
          className="section-y px-6"
          style={{ background: "var(--graphite)" }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-14">
              <p className="eyebrow">Cómo identificamos la letra</p>
              <h2
                className="font-light leading-tight mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--bone)",
                }}
              >
                El Test de Fit es <em className="gradient-text">cuatro pasos</em>.
                <br />
                Termina con un veredicto, no con un «hablamos».
              </h2>
              <p
                className="text-base max-w-2xl leading-relaxed"
                style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
              >
                No es una llamada de venta disfrazada. Es el filtro real que aplicamos
                a cada prospecto, con el mismo scoring para todos, y un cierre claro
                dentro de las 24 horas.
              </p>
            </div>

            <ol className="flex flex-col gap-5">
              {TEST_STEPS.map((step) => (
                <li
                  key={step.n}
                  className="border flex gap-5 md:gap-7 p-6 md:p-7"
                  style={{
                    borderRadius: 3,
                    borderColor: "rgba(30,30,31,0.9)",
                    background: "var(--carbon)",
                  }}
                >
                  <span
                    className="number-badge"
                    style={{ width: 44, height: 44 }}
                  >
                    {step.n}
                  </span>
                  <div className="flex-1">
                    <h3
                      className="font-light text-base md:text-lg mb-2 leading-snug"
                      style={{
                        color: "var(--bone)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "var(--ash)",
                        fontWeight: 300,
                        lineHeight: 1.75,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ====== PRINCIPIOS ====== */}
        <section className="section-y px-6">
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow">Reglas que no negociamos</p>
            <h2
              className="font-light leading-tight mb-10"
              style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
            >
              Cuatro principios <em className="gradient-text">del protocolo.</em>
            </h2>

            <ul className="flex flex-col gap-5">
              {PRINCIPLES.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-4 pb-5"
                  style={{ borderBottom: "1px solid rgba(30,30,31,0.9)" }}
                >
                  <span
                    style={{
                      color: "var(--champagne)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.18em",
                      flexShrink: 0,
                      paddingTop: 4,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: "var(--bone)",
                      fontWeight: 300,
                      lineHeight: 1.75,
                    }}
                  >
                    {p}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ====== QUÉ NO ES BPI ====== */}
        <section
          className="section-y px-6 relative overflow-hidden"
          style={{ background: "var(--graphite)" }}
        >
          <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto">
            <p className="eyebrow">Para evitar malentendidos</p>
            <h2
              className="font-light leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
            >
              Lo que BPI <em className="gradient-text">no es.</em>
            </h2>
            <p
              className="text-base mb-12 leading-relaxed"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
            >
              El nombre suena a metodología pesada de consultoría grande. No lo es.
              Lo aclaramos antes de que la primera llamada parta con suposiciones
              equivocadas.
            </p>

            <div className="flex flex-col gap-4">
              {NOT_BPI.map((item) => (
                <div
                  key={item.title}
                  className="border p-6"
                  style={{
                    borderRadius: 2,
                    borderColor: "rgba(30,30,31,0.9)",
                    background: "var(--carbon)",
                  }}
                >
                  <p
                    className="font-light text-base mb-2 leading-snug"
                    style={{ color: "var(--bone)" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "var(--ash)",
                      fontWeight: 300,
                      lineHeight: 1.75,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA FINAL ====== */}
        <section className="section-y-spacious px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(217,179,106,0.12) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl mx-auto text-center">
            <p className="eyebrow">El siguiente paso</p>
            <h2
              className="font-light leading-tight mb-6"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--bone)",
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              }}
            >
              ¿En qué letra estás hoy?
              <br />
              <em className="gradient-text">Te lo decimos en 30 minutos.</em>
            </h2>
            <p
              className="text-base mb-10 leading-relaxed max-w-xl mx-auto"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Sin pitch. Sin demo. Sin presentación corporativa. Treinta minutos
              de preguntas honestas y un veredicto en 24 horas. Si no hay fit, te
              lo decimos — y te recomendamos qué hacer antes de pensar en IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <WAButton source="protocolo-bpi-final" size="lg">
                Solicitar Test de Fit
              </WAButton>
              <Link
                href="/#manifiesto"
                className="btn-ghost btn-lg"
                style={{ minWidth: 160 }}
              >
                Lo que creemos
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
