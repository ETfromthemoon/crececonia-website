"use client";

const links = [
  { icon: "↗", title: "Quiero aprender", description: "Ebooks y guías prácticas para aplicar IA por tu cuenta.", href: "/aprender", tag: "EBOOKS · SKILLS" },
  { icon: "◎", title: "Quiero acompañamiento", description: "Mentoría personalizada para ordenar y aplicar tus ideas.", href: "/mentoria", tag: "MENTORÍA · FOCO" },
  { icon: "◒", title: "Quiero que lo implementen", description: "Agentes, automatizaciones y sistemas para tu negocio.", href: "/implementacion", tag: "SISTEMAS · IA" },
];

export default function InstagramHub() {
  return <main className="hub-page hub-page-minimal"><div className="hub-shell">
    <div className="hub-top"><a href="/" className="brand-mark">Crece<span>con</span>IA</a></div>
    <section className="hub-intro"><span className="eyebrow">¿Cómo quieres usar la IA?</span><h1>Elige tu <em>siguiente paso.</em></h1><p>Una ruta para aprender, recibir acompañamiento o construirlo contigo.</p></section>
    <div className="hub-links">{links.map((link, index) => <a href={link.href} className="hub-link" style={{ "--hub-delay": `${index * 90 + 180}ms` } as React.CSSProperties} key={link.href}><span className="hub-link-icon">{link.icon}</span><span className="hub-link-copy"><strong>{link.title}</strong><span>{link.description}</span><small>{link.tag}</small></span><span className="hub-link-arrow">↗</span></a>)}</div>
  </div></main>;
}
