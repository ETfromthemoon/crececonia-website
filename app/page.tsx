import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";

const layers = [
  { number: "01", icon: "↗", title: "Aprender y aplicar por tu cuenta", text: "Ebooks y guías para convertir una necesidad concreta en una primera solución.", href: "/aprender", note: "Menor inversión · más autonomía" },
  { number: "02", icon: "◎", title: "Avanzar con dirección experta", text: "Mentoría 1:1 para priorizar, decidir y ejecutar sobre tu propio negocio.", href: "/mentoria", note: "Dirección semanal · ejecución propia" },
  { number: "03", icon: "◒", title: "Delegar la implementación", text: "Agentes, automatizaciones y sistemas construidos para un proceso definido.", href: "/implementacion", note: "Mayor delegación · solución a medida" },
];

const decisionSignals = ["Para quién es cada ruta", "Inversión y requisitos", "Qué tendrás que hacer tú"];

const faqs = [
  {
    question: "¿Por dónde empiezo si todavía no sé qué necesito?",
    answer: "Por el comparador de rutas. En menos de dos minutos podrás contrastar autonomía, acompañamiento, inversión y nivel de delegación antes de decidir.",
  },
  {
    question: "¿Tengo que saber programar para aplicar IA?",
    answer: "No para elegir una ruta ni para detectar una oportunidad útil. Algunas guías enseñan ejecución técnica paso a paso; la mentoría y la implementación se adaptan al nivel de tu equipo.",
  },
  {
    question: "¿Conviene automatizar cualquier proceso?",
    answer: "No. Primero hay que confirmar que el proceso sea claro, repetible y valioso. El Protocolo BPI ayuda a decidir qué cambiar antes de sumar herramientas.",
  },
];

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/")}#webpage`,
      url: absoluteUrl("/"),
      name: "Consultoría de IA para empresas | CrececonIA",
      description: "Recursos, mentoría e implementación para aplicar inteligencia artificial a procesos reales de trabajo y negocio.",
      inLanguage: "es-CL",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: layers.map((layer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: layer.title,
          url: absoluteUrl(layer.href),
        })),
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function Home() {
  return <><JsonLd data={homeJsonLd} /><Navbar /><main className="corporate-page">
    <section className="corporate-hero site-container"><div className="corporate-hero-top"><span className="eyebrow">CrececonIA · IA aplicada</span><span className="hero-location">Santiago / remoto</span></div><div className="corporate-hero-grid"><div><h1>IA aplicada a tu negocio. <em>Sin herramientas de más.</em></h1><p className="hero-lead">Empieza con una guía, avanza con mentoría o delega la implementación. Compara qué opción calza con tu problema, tiempo y presupuesto.</p><div className="hero-actions"><a className="button button-dark" href="/ia">Comparar las 3 rutas <span>→</span></a><a className="text-link" href="#escalera">Ver cómo funciona ↓</a></div></div><div className="hero-aside"><span className="aside-mark">Problema<span>→</span>decisión<span>→</span>sistema</span><p>Partimos por entender el proceso. Después elegimos el nivel de apoyo y, recién entonces, la tecnología que vale la pena usar.</p></div></div></section>
    <section className="decision-strip" aria-label="Información disponible antes de elegir"><div className="site-container decision-strip-inner"><span className="decision-strip-label">Antes de elegir verás</span>{decisionSignals.map((signal, index) => <span key={signal}><b>0{index + 1}</b>{signal}</span>)}</div></section>
    <section id="escalera" className="layers-section"><div className="site-container"><div className="section-heading"><span className="eyebrow">Tres formas de avanzar</span><h2>Tres rutas.<br /><em>Una decisión más fácil.</em></h2></div><div className="layers-list">{layers.map((layer) => <a href={layer.href} className="layer-row" key={layer.href}><span className="layer-number">{layer.number}</span><span className="layer-icon">{layer.icon}</span><span className="layer-copy"><strong>{layer.title}</strong><span>{layer.text}</span></span><span className="layer-note">{layer.note}</span><span className="layer-arrow">↗</span></a>)}</div></div></section>
    <section className="corporate-method site-container"><div className="method-statement"><span className="eyebrow">El criterio detrás de cada ruta</span><h2>No automatizamos el desorden.</h2></div><div className="method-copy"><p>El Protocolo BPI identifica primero el cuello de botella, el costo de no resolverlo y el cambio que tendría impacto. La herramienta viene después.</p><a href="/protocolo-bpi" className="text-link">Conocer el Protocolo BPI ↗</a></div></section>
    <section className="home-faq"><div className="site-container home-faq-grid"><div><span className="eyebrow">Antes de decidir</span><h2>Preguntas que vale la pena resolver.</h2></div><div className="home-faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="corporate-cta"><div className="site-container cta-inner"><div><span className="eyebrow">Tu siguiente paso</span><h2>Encuentra la ruta que calza con tu problema, tiempo y presupuesto.</h2><p className="cta-support">La comparación muestra requisitos e inversión antes de que tengas que contactar a alguien.</p></div><a href="/ia" className="button button-light">Comparar rutas y requisitos <span>→</span></a></div></section>
  </main><Footer /></>;
}
