import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const layers = [
  { number: "01", icon: "↗", title: "Quiero aprender", text: "Guías y ebooks para implementar IA por tu cuenta.", href: "/aprender", note: "Ebooks · skills · recursos" },
  { number: "02", icon: "◎", title: "Quiero acompañamiento", text: "Mentoría personalizada para aplicar IA a tu trabajo o negocio.", href: "/mentoria", note: "Mentoría · dirección · foco" },
  { number: "03", icon: "◒", title: "Quiero que lo implementen", text: "Sistemas, automatizaciones y soluciones de IA desarrolladas para ti.", href: "/implementacion", note: "Agentes · sistemas · operación" },
];

export default function Home() {
  return <><Navbar /><main className="corporate-page">
    <section className="corporate-hero site-container"><div className="corporate-hero-top"><span className="eyebrow">CrececonIA · IA aplicada</span><span className="hero-location">Santiago / remoto</span></div><div className="corporate-hero-grid"><div><h1>La IA no es un destino. Es una <em>escalera.</em></h1><p className="hero-lead">Aprende lo necesario, recibe dirección cuando la necesites y construye sistemas que hagan avanzar tu negocio.</p><div className="hero-actions"><a className="button button-dark" href="/ia">Elegir mi ruta <span>→</span></a><a className="text-link" href="#escalera">Ver las tres capas ↓</a></div></div><div className="hero-aside"><span className="aside-mark">IA<span>×</span>contexto</span><p>CrececonIA conecta criterio, acompañamiento e implementación para que cada persona entre por el nivel que realmente necesita.</p></div></div></section>
    <section id="escalera" className="layers-section"><div className="site-container"><div className="section-heading"><span className="eyebrow">Tres formas de avanzar</span><h2>Elige la puerta.<br /><em>Nosotros cuidamos el camino.</em></h2></div><div className="layers-list">{layers.map((layer) => <a href={layer.href} className="layer-row" key={layer.href}><span className="layer-number">{layer.number}</span><span className="layer-icon">{layer.icon}</span><span className="layer-copy"><strong>{layer.title}</strong><span>{layer.text}</span></span><span className="layer-note">{layer.note}</span><span className="layer-arrow">↗</span></a>)}</div></div></section>
    <section className="corporate-method site-container"><div className="method-statement"><span className="eyebrow">El alma de la marca</span><h2>Antes de automatizar, hay que entender qué debe cambiar.</h2></div><div className="method-copy"><p>El Protocolo BPI vive detrás de cada recomendación: una forma de mirar el negocio antes de llenar la operación de herramientas.</p><a href="/protocolo-bpi" className="text-link">Conocer el protocolo ↗</a></div></section>
    <section className="corporate-cta"><div className="site-container cta-inner"><div><span className="eyebrow">¿Te ayudamos a ubicarte?</span><h2>Empieza por elegir la ruta que sí calza contigo.</h2></div><a href="/ia" className="button button-light">Comparar rutas y requisitos <span>→</span></a></div></section>
  </main><Footer /></>;
}
