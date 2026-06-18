"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WAButton } from "./GradientButton";

const NAV_LINKS = [
  { label: "Manifiesto", href: "/#manifiesto" },
  { label: "Protocolo BPI", href: "/#proceso" },
  { label: "Casos", href: "/#resultados" },
  { label: "Inversión", href: "/#servicios" },
  { label: "Conocimiento", href: "/centro" },
  { label: "Ebook", href: "/ebook/de-cero-a-claude-en-una-semana", highlight: true },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: 68,
        background: scrolled ? "rgba(10,10,11,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(30,30,31,0.9)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-8">
        <a
          href="/"
          className="font-light text-lg tracking-tight flex-shrink-0"
          style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
        >
          Crece<span style={{ color: "var(--champagne)", fontStyle: "italic" }}>con</span>
          <span style={{ color: "var(--bone)" }}>IA</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs transition-colors"
              style={{
                color: "highlight" in link && link.highlight ? "var(--champagne)" : "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "highlight" in link && link.highlight ? "var(--champagne)" : "var(--smoke)")}
            >
              {link.label}
              {"highlight" in link && link.highlight && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--champagne)",
                    flexShrink: 0,
                    marginBottom: 1,
                  }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:block">
          <WAButton source="nav" size="md">
            Solicitar Test de Fit
          </WAButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 justify-center items-center"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
          style={{ width: 44, height: 44 }}
        >
          <motion.span
            animate={{ rotate: mobileMenuOpen ? 45 : 0, y: mobileMenuOpen ? 8 : 0 }}
            className="w-5 h-px rounded transition-all"
            style={{ background: "var(--bone)" }}
          />
          <motion.span
            animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
            className="w-5 h-px rounded"
            style={{ background: "var(--bone)" }}
          />
          <motion.span
            animate={{ rotate: mobileMenuOpen ? -45 : 0, y: mobileMenuOpen ? -8 : 0 }}
            className="w-5 h-px rounded transition-all"
            style={{ background: "var(--bone)" }}
          />
        </button>

        {/* Mobile CTA */}
        <div className="sm:hidden">
          <WAButton source="nav-mobile" size="md">
            Test de Fit
          </WAButton>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute left-0 right-0"
            style={{
              top: 68,
              background: "rgba(10,10,11,0.97)",
              borderBottom: "1px solid rgba(30,30,31,0.9)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick()}
                  className="text-xs py-2 transition-colors"
                  style={{
                    color: "highlight" in link && link.highlight ? "var(--champagne)" : "var(--smoke)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {link.label}
                  {"highlight" in link && link.highlight && (
                    <span
                      style={{
                        fontSize: "0.55rem",
                        background: "rgba(217,179,106,0.15)",
                        color: "var(--champagne)",
                        border: "1px solid rgba(217,179,106,0.3)",
                        borderRadius: 2,
                        padding: "1px 5px",
                        letterSpacing: "0.12em",
                      }}
                    >
                      NUEVO
                    </span>
                  )}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
