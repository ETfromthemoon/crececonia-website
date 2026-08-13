"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/contact";

const NAV_LINKS = [
  { label: "La escalera", href: "/#escalera" },
  { label: "Aprender", href: "/aprender" },
  { label: "Biblioteca", href: "/ebooks" },
  { label: "Mentoría", href: "/mentoria" },
  { label: "Implementación", href: "/implementacion" },
] as const;

const WHATSAPP_URL = whatsappUrl("Hola, quiero entender qué capa de CrececonIA es mejor para mí.");

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="corporate-nav" data-scrolled={scrolled}>
      <div className="site-container nav-inner">
        <a href="/" className="brand-mark" aria-label="CrececonIA, inicio">
          Crece<span>con</span>IA
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => {
            const isCurrent = link.href === "/#escalera"
              ? pathname === "/"
              : link.href === "/ebooks"
                ? pathname === "/ebooks" || pathname.startsWith("/ebook/")
                : pathname === link.href;
            return <a key={link.href} href={link.href} aria-current={isCurrent ? "page" : undefined}>{link.label}</a>;
          })}
        </nav>
        <div className="nav-actions">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="nav-cta">Hablemos</a>
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mobile-nav"
            aria-label="Navegación móvil"
          >
            {NAV_LINKS.map((link) => {
              const isCurrent = link.href === "/#escalera"
                ? pathname === "/"
                : link.href === "/ebooks"
                  ? pathname === "/ebooks" || pathname.startsWith("/ebook/")
                  : pathname === link.href;
              return <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} aria-current={isCurrent ? "page" : undefined}>{link.label}</a>;
            })}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mobile-whatsapp" onClick={() => setMobileMenuOpen(false)}>Hablar por WhatsApp →</a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
