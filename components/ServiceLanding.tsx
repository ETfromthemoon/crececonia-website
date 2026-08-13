import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QualificationForm from "@/components/QualificationForm";

type Service = "aprender" | "mentoria" | "implementacion";
type ServiceData = {
  kicker: string;
  title: string;
  lead: string;
  promise: string;
  proof: string;
  steps: string[];
  features: string[];
  resourceLinks?: { label: string; text: string; href: string }[];
  fit?: {
    investment: string;
    ideal: string[];
    notFor: string[];
  };
};

const DATA: Record<Service, ServiceData> = {
  aprender: {
    kicker: "Capa 01 · Autonomía",
    title: "Aprende IA con algo que puedas usar mañana.",
    lead: "Guías, skills y ebooks pagados para dejar de mirar la IA desde afuera y empezar a trabajar con ella.",
    promise: "El punto de entrada para construir criterio, velocidad y confianza.",
    proof: "Ebooks prácticos · workflows probados · recursos descargables",
    steps: ["Elige un punto de partida concreto.", "Aplica el workflow a tu contexto.", "Vuelve por el siguiente nivel cuando estés listo."],
    features: ["Ebooks paso a paso, sin teoría sobrante", "Skills y guías para integrarlo a tu forma de trabajar", "Recursos que puedes copiar, adaptar y repetir"],
    resourceLinks: [
      { label: "Ebooks pagados", text: "La biblioteca principal para avanzar con un método concreto.", href: "/ebooks" },
      { label: "Guías prácticas", text: "Lecturas y recursos para resolver una pregunta puntual.", href: "/centro/guias" },
      { label: "Skills", text: "Capacidades listas para llevar a tu propio flujo de trabajo.", href: "/centro/skills" },
    ],
  },
  mentoria: {
    kicker: "Capa 02 · Dirección",
    title: "Deja de probar IA al azar. Avanza con un plan que sí vas a ejecutar.",
    lead: "Mentoría 1:1 para profesionales, emprendedores y dueños de negocio que ya decidieron aplicar IA a su trabajo y quieren claridad, estructura y seguimiento.",
    promise: "No necesitas otra herramienta. Necesitas saber qué mover primero y sostener el avance.",
    proof: "1:1 · contexto real · roadmap · seguimiento",
    steps: ["Definimos un resultado concreto para los próximos 90 días.", "Elegimos qué aprender o construir primero y qué dejar fuera.", "Revisamos avances y bloqueos para sostener el plan cada semana."],
    features: ["Mentoría para profesionales, emprendedores y dueños de negocio", "Aplicación directa a un flujo de trabajo, oportunidad o proyecto real", "Criterio para decidir qué automatizar, qué hacer tú y qué no hacer todavía"],
    fit: {
      investment: "Desde $400.000 CLP mensuales",
      ideal: [
        "Tienes un objetivo concreto que quieres conseguir en los próximos 90 días.",
        "Puedes dedicar tiempo semanal a ejecutar y llegar con avances o bloqueos reales.",
        "Quieres aprender a operar tu solución; no delegarla por completo.",
      ],
      notFor: [
        "Buscas una clase suelta, respuestas gratis por WhatsApp o un curso grabado.",
        "Esperas que alguien implemente todo por ti.",
        "No puedes invertir desde $400.000 CLP al mes o no estás dispuesto a seguir un roadmap.",
      ],
    },
  },
  implementacion: {
    kicker: "Capa 03 · Resultado",
    title: "Implementamos IA cuando hay un proceso claro que vale la pena mejorar.",
    lead: "Diseñamos e implementamos agentes, automatizaciones y sistemas a medida para negocios que ya identificaron un problema repetitivo y quieren medir un resultado operativo.",
    promise: "La implementación empieza antes del código: empieza entendiendo qué debe cambiar.",
    proof: "Agentes IA · automatizaciones · sistemas a medida",
    steps: ["Revisamos el proceso, el impacto y si IA es realmente la respuesta.", "Definimos alcance, límites, responsables, métrica y presupuesto.", "Construimos, probamos con casos reales, capacitamos y dejamos soporte acordado."],
    features: ["Agentes para atención, ventas y operación", "Automatizaciones conectadas a las herramientas que ya usas", "Sistemas a medida con responsables, límites y una métrica de resultado"],
    fit: {
      investment: "Desde $500.000 CLP + mantención desde $100.000 CLP mensuales",
      ideal: [
        "Puedes nombrar un proceso repetitivo que hoy pierde tiempo, oportunidades o calidad.",
        "Hay una persona que decide y un equipo que podrá probar y usar la solución.",
        "Puedes entregar ejemplos, datos y contexto del proceso que se quiere mejorar.",
      ],
      notFor: [
        "Solo quieres “algo con IA” o un chatbot genérico porque está de moda.",
        "Tu proceso todavía no está claro o nadie puede validar, aprobar ni dar contexto.",
        "Esperas reemplazar a tu equipo o no consideras el soporte mensual de una solución en producción.",
      ],
    },
  },
};

export default function ServiceLanding({ service }: { service: Service }) {
  const data = DATA[service];
  return <><Navbar /><main className={`service-page service-${service}`}>
    <section className="service-hero site-container"><div className="service-hero-copy"><span className="eyebrow">{data.kicker}</span><h1>{data.title}</h1><p className="hero-lead">{data.lead}</p>{data.fit && <p className="hero-qualification-note"><strong>Inversión:</strong> {data.fit.investment}</p>}<div className="hero-actions"><a className="button button-dark" href={service === "aprender" ? "/ebooks" : "#requisitos"}>{service === "aprender" ? "Explorar ebooks" : "Revisar requisitos"} <span>↓</span></a><a className="text-link" href="/ia">Volver al selector</a></div></div><div className="hero-signal"><span className="signal-index">0{service === "aprender" ? 1 : service === "mentoria" ? 2 : 3}</span><p>{data.promise}</p><div className="signal-line" /><span className="signal-caption">{data.proof}</span></div></section>
    <section className="service-band"><div className="site-container service-band-inner"><span>CrececonIA / {service}</span><span>Una escalera, no tres caminos desconectados.</span></div></section>
    {data.fit && <section id="requisitos" className="service-decision"><div className="site-container"><div className="service-decision-heading"><span className="eyebrow">Antes de postular</span><h2>Elige esta vía solo si te ves en estas condiciones.</h2><p>{data.fit.investment}</p></div><div className="service-decision-grid"><div><span className="service-decision-label">Sí es para ti si</span><ul>{data.fit.ideal.map((item) => <li key={item}>{item}</li>)}</ul></div><div><span className="service-decision-label">No es para ti si</span><ul>{data.fit.notFor.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div></section>}
    <section className="service-content site-container"><div><span className="eyebrow">Cómo se ve</span><h2>Un siguiente paso que cabe en tu realidad.</h2></div><div className="service-features">{data.features.map((feature, index) => <div className="feature-row" key={feature}><span>0{index + 1}</span><p>{feature}</p></div>)}</div></section>
    {data.resourceLinks && <section className="resource-section"><div className="site-container"><div className="steps-heading"><span className="eyebrow">Explora el núcleo</span><h2>Empieza por el formato que necesitas.</h2></div><div className="resource-grid">{data.resourceLinks.map((resource) => <a className="resource-link" href={resource.href} key={resource.href}><strong>{resource.label}</strong><span>{resource.text}</span><small>Entrar ↗</small></a>)}</div></div></section>}
    <section className="service-steps"><div className="site-container"><div className="steps-heading"><span className="eyebrow">El recorrido</span><h2>De la pregunta a la práctica.</h2></div><div className="steps-grid">{data.steps.map((step, index) => <div className="step-item" key={step}><span>0{index + 1}</span><p>{step}</p></div>)}</div></div></section>
    {service === "aprender" ? <section className="service-form-section service-learning-next"><div className="site-container"><span className="eyebrow">Compra autónoma</span><h2>Aprende a tu ritmo, sin llamada previa.</h2><p>Elige el ebook que corresponde a tu nivel y objetivo. Si luego necesitas criterio aplicado a tu caso, vuelve por mentoría con un objetivo concreto.</p><a href="/ebooks" className="button button-dark">Ver la biblioteca de ebooks <span>→</span></a></div></section> : <section id="calificar" className="service-form-section site-container"><QualificationForm service={service} /></section>}
    <section className="service-footer-cta"><div className="site-container"><p>¿Todavía no sabes cuál es tu siguiente paso?</p><a href="/ia" className="button button-light">Volver al selector <span>→</span></a></div></section>
  </main><Footer /></>;
}
