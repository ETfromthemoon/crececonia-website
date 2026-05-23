"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WAButton } from "./GradientButton";

const NAV_LINKS = [
  { label: "Proceso", href: "/#proceso" },
  { label: "Resultados", href: "/#resultados" },
  { label: "Herramientas", href: "/herramientas" },
  { label: "Skills", href: "/skills" },
  { label: "Inversión", href: "/#servicios" },
  { label: "Preguntas", href: "/#faq" },
];

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
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:block">
          <WAButton source="nav" size="md">
            Postular al diagnóstico
          </WAButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 flex flex-col gap-1.5 justify-center items-center"
          aria-label="Toggle menu"
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
            Diagnóstico
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
                    color: "var(--smoke)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
