import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QualificationForm from "@/components/QualificationForm";
import { whatsappUrl } from "@/lib/contact";

type Service = "aprender" | "mentoria" | "implementacion";
type ServiceData = { kicker: string; title: string; lead: string; promise: string; proof: string; steps: string[]; features: string[]; resourceLinks?: { label: string; text: string; href: string }[] };

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
    title: "Acompañamiento para convertir intención en avance.",
    lead: "Mentoría personalizada para aplicar IA a tu trabajo, ordenar tus oportunidades y tomar decisiones con alguien que te ayude a ver el sistema completo.",
    promise: "No necesitas otra herramienta. Necesitas claridad sobre qué mover primero.",
    proof: "Sesiones 1:1 · contexto real · plan de acción",
    steps: ["Leemos tu contexto y tus restricciones.", "Priorizamos un problema que valga la pena resolver.", "Sales con un sistema de acción, no con más pestañas abiertas."],
    features: ["Mentoría para profesionales, líderes y equipos pequeños", "Aplicación directa a procesos, oferta y operación", "El Protocolo BPI como criterio de diagnóstico, cuando corresponde"],
  },
  implementacion: {
    kicker: "Capa 03 · Resultado",
    title: "Sistemas de IA que trabajan dentro de tu negocio.",
    lead: "Diseñamos e implementamos agentes IA, automatizaciones y sistemas personalizados para que la IA deje de ser una promesa y pase a formar parte de tu operación.",
    promise: "La implementación empieza antes del código: empieza entendiendo qué debe cambiar.",
    proof: "Agentes IA · automatizaciones · sistemas personalizados",
    steps: ["Detectamos el proceso donde existe valor real.", "Diseñamos la solución y sus límites.", "La implementamos, medimos y dejamos funcionando."],
    features: ["Agentes IA para atención, ventas y operación", "Automatizaciones conectadas a tus herramientas", "Sistemas a medida, con el BPI como alma de diagnóstico"],
  },
};

export default function ServiceLanding({ service }: { service: Service }) {
  const data = DATA[service];
  return <><Navbar /><main className={`service-page service-${service}`}>
    <section className="service-hero site-container"><div className="service-hero-copy"><span className="eyebrow">{data.kicker}</span><h1>{data.title}</h1><p className="hero-lead">{data.lead}</p><div className="hero-actions"><a className="button button-dark" href="#calificar">Ver si esto es para mí <span>↓</span></a><a className="text-link" href="/ia">Volver al selector</a></div></div><div className="hero-signal"><span className="signal-index">0{service === "aprender" ? 1 : service === "mentoria" ? 2 : 3}</span><p>{data.promise}</p><div className="signal-line" /><span className="signal-caption">{data.proof}</span></div></section>
    <section className="service-band"><div className="site-container service-band-inner"><span>CrececonIA / {service}</span><span>Una escalera, no tres caminos desconectados.</span></div></section>
    <section className="service-content site-container"><div><span className="eyebrow">Cómo se ve</span><h2>Un siguiente paso que cabe en tu realidad.</h2></div><div className="service-features">{data.features.map((feature, index) => <div className="feature-row" key={feature}><span>0{index + 1}</span><p>{feature}</p></div>)}</div></section>
    {data.resourceLinks && <section className="resource-section"><div className="site-container"><div className="steps-heading"><span className="eyebrow">Explora el núcleo</span><h2>Empieza por el formato que necesitas.</h2></div><div className="resource-grid">{data.resourceLinks.map((resource) => <a className="resource-link" href={resource.href} key={resource.href}><strong>{resource.label}</strong><span>{resource.text}</span><small>Entrar ↗</small></a>)}</div></div></section>}
    <section className="service-steps"><div className="site-container"><div className="steps-heading"><span className="eyebrow">El recorrido</span><h2>De la pregunta a la práctica.</h2></div><div className="steps-grid">{data.steps.map((step, index) => <div className="step-item" key={step}><span>0{index + 1}</span><p>{step}</p></div>)}</div></div></section>
    <section id="calificar" className="service-form-section site-container"><QualificationForm service={service} /></section>
    <section className="service-footer-cta"><div className="site-container"><p>¿Todavía no sabes qué capa es la tuya?</p><a href={whatsappUrl("Hola, necesito orientación para elegir entre aprender, mentoría o implementación.")} target="_blank" rel="noopener noreferrer" className="button button-light">Preguntar por WhatsApp <span>↗</span></a></div></section>
  </main><Footer /></>;
}
