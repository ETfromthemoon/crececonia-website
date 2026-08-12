"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { whatsappUrl } from "@/lib/contact";

const NAV_LINKS = [
  { label: "La escalera", href: "/#escalera" },
  { label: "Aprender", href: "/aprender" },
  { label: "Mentoría", href: "/mentoria" },
  { label: "Implementación", href: "/implementacion" },
] as const;

const WHATSAPP_URL = whatsappUrl("Hola, quiero entender qué capa de CrececonIA es mejor para mí.");

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="corporate-nav" data-scrolled={scrolled}>
      <div className="site-container nav-inner">
        <a href="/" className="brand-mark" aria-label="CrececonIA, inicio">
          Crece<span>con</span>IA
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="nav-actions">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="nav-cta">Hablemos</a>
          <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileMenuOpen}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mobile-nav" aria-label="Navegación móvil">
            {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>)}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mobile-whatsapp">Hablar por WhatsApp ↗</a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
