"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_URL = "https://crececonia.cl/ia";
const links = [
  { icon: "↗", title: "Quiero aprender", description: "Ebooks y guías prácticas para aplicar IA por tu cuenta.", href: "/aprender", tag: "EBOOKS · SKILLS" },
  { icon: "◎", title: "Quiero acompañamiento", description: "Mentoría personalizada para ordenar y aplicar tus ideas.", href: "/mentoria", tag: "MENTORÍA · FOCO" },
  { icon: "◒", title: "Quiero que lo implementen", description: "Agentes, automatizaciones y sistemas para tu negocio.", href: "/implementacion", tag: "SISTEMAS · IA" },
];

export default function InstagramHub() {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(BASE_URL); setCopied(true); setTimeout(() => setCopied(false), 2200); }
  return <><Navbar /><main className="hub-page"><div className="hub-shell"><div className="hub-top"><a href="/" className="brand-mark">Crece<span>con</span>IA</a><span className="hub-status">IA aplicada / Chile</span></div><section className="hub-intro"><span className="eyebrow">¿Cómo quieres usar la IA?</span><h1>Elige tu <em>siguiente paso.</em></h1><p>Una ruta para aprender, recibir acompañamiento o construirlo contigo.</p></section><div className="hub-links">{links.map((link) => <a href={link.href} className="hub-link" key={link.href}><span className="hub-link-icon">{link.icon}</span><span className="hub-link-copy"><strong>{link.title}</strong><span>{link.description}</span><small>{link.tag}</small></span><span className="hub-link-arrow">↗</span></a>)}</div><div className="copy-box"><div><span className="copy-label">Tu enlace único</span><code>{BASE_URL}</code></div><button type="button" onClick={copy}>{copied ? "Copiado ✓" : "Copiar enlace"}</button></div><a className="hub-home-link" href="/">Conoce CrececonIA ↗</a></div></main><Footer /></>;
}
