"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useEvaluacion } from "./EvaluacionProvider";

const SPARKLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </svg>
);

/**
 * WAButton — antes era el botón de WhatsApp.
 * Ahora abre el modal de Evaluación AI (diagnóstico gratuito).
 * Mantengo el nombre para no romper imports en todos los componentes.
 */
export function WAButton({
  source,
  children,
  size = "md",
  className = "",
}: {
  source: string;
  children: React.ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  const { abrir } = useEvaluacion();
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const sx = (x - 0.5) * 26;
    const sy = (y - 0.5) * 12;
    setGlowStyle({
      boxShadow: `${sx}px ${sy}px 26px rgba(217,179,106,0.55), 0 0 14px rgba(217,179,106,0.32)`,
    });
  };

  const handleMouseLeave = () => {
    setGlowStyle({});
  };

  return (
    <motion.button
      type="button"
      onClick={() => abrir(source)}
      className={`btn-evaluacion${size === "lg" ? " btn-lg" : ""} ${className}`}
      style={glowStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {SPARKLE_ICON}
      {children}
    </motion.button>
  );
}

interface GradientButtonProps {
  href?: string;
  type?: "submit" | "button";
  children: React.ReactNode;
  filled?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function GradientButton({
  href,
  type = "button",
  children,
  filled = true,
  className = "",
  onClick,
}: GradientButtonProps) {
  const cls = `${filled ? "btn-evaluacion" : "btn-ghost"} ${className}`;

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
