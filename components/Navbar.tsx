"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { whatsappUrl } from "@/lib/contact";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Casos", href: "/#casos" },
  { label: "Precio", href: "/#precio" },
  { label: "FAQ", href: "/#faq" },
  { label: "Conocimiento", href: "/centro" },
  { label: "Ebooks", href: "/ebooks", highlight: true },
] as const;

const WHATSAPP_URL = whatsappUrl();

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
        background: scrolled ? "rgba(250,250,249,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-8">
        <a
          href="/"
          className="font-light text-lg tracking-tight flex-shrink-0"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          Crece<span style={{ color: "var(--champagne)", fontStyle: "italic" }}>con</span>
          <span style={{ color: "var(--ink)" }}>IA</span>
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
                letterSpacing: "0.15em",
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
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: "9px 18px" }}
          >
            Hablemos por WhatsApp
          </a>
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
            style={{ background: "var(--ink)" }}
          />
          <motion.span
            animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
            className="w-5 h-px rounded"
            style={{ background: "var(--ink)" }}
          />
          <motion.span
            animate={{ rotate: mobileMenuOpen ? -45 : 0, y: mobileMenuOpen ? -8 : 0 }}
            className="w-5 h-px rounded transition-all"
            style={{ background: "var(--ink)" }}
          />
        </button>

        {/* Mobile CTA */}
        <div className="sm:hidden">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: "8px 16px" }}
          >
            WhatsApp
          </a>
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
              background: "rgba(250,250,249,0.97)",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
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
                    color: "highlight" in link && link.highlight ? "var(--champagne)" : "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.15em",
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
                        background: "rgba(196,155,74,0.12)",
                        color: "var(--champagne)",
                        border: "1px solid rgba(196,155,74,0.25)",
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
