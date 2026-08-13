import type { CSSProperties } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Elige tu ruta de IA | CrececonIA",
  description: "Compara ebooks, mentoría e implementación de IA. Cada ruta muestra sus requisitos e inversión antes de que decidas contactar.",
  path: "/ia",
});

const routeSelectorJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Elige tu ruta de IA",
  description: "Selector de servicios de CrececonIA para aprender, recibir mentoría o implementar IA.",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Aprender por cuenta propia", url: "https://www.crececonia.cl/aprender" },
      { "@type": "ListItem", position: 2, name: "Mentoría 1:1", url: "https://www.crececonia.cl/mentoria" },
      { "@type": "ListItem", position: 3, name: "Implementación de IA", url: "https://www.crececonia.cl/implementacion" },
    ],
  },
};

const links = [
  { icon: "↗", title: "Quiero aprender", description: "Ebooks y guías prácticas para aplicar IA por tu cuenta.", qualifier: "Para quien quiere ejecutar sin acompañamiento 1:1.", href: "/aprender", tag: "COMPRA DIRECTA · EBOOKS" },
  { icon: "◎", title: "Quiero acompañamiento", description: "Mentoría 1:1 para avanzar con foco y un plan de acción.", qualifier: "Desde $400.000 CLP mensuales · trabajo semanal requerido.", href: "/mentoria", tag: "MENTORÍA · POSTULACIÓN" },
  { icon: "◒", title: "Quiero que lo implementen", description: "Agentes, automatizaciones y sistemas para un proceso de negocio concreto.", qualifier: "Desde $500.000 CLP + mantención desde $100.000 CLP mensuales.", href: "/implementacion", tag: "IMPLEMENTACIÓN · EVALUACIÓN" },
];

export default function InstagramHub() {
  return <><JsonLd data={routeSelectorJsonLd} /><main className="hub-page hub-page-minimal"><div className="hub-shell">
    <div className="hub-top"><a href="/" className="brand-mark">Crece<span>con</span>IA</a></div>
    <section className="hub-intro"><span className="eyebrow">¿Cómo quieres usar la IA?</span><h1>Elige tu <em>siguiente paso.</em></h1><p>Aprende por tu cuenta, recibe dirección 1:1 o encarga una implementación. Cada ruta tiene requisitos e inversión distintos.</p></section>
    <div className="hub-links">{links.map((link, index) => <a href={link.href} className="hub-link" style={{ "--hub-delay": `${index * 90 + 180}ms` } as CSSProperties} key={link.href}><span className="hub-link-icon">{link.icon}</span><span className="hub-link-copy"><strong>{link.title}</strong><span>{link.description}</span><small className="hub-link-qualifier">{link.qualifier}</small><small>{link.tag}</small></span><span className="hub-link-arrow">↗</span></a>)}</div>
  </div></main></>;
}
