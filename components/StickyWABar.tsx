"use client";

import { useEffect, useState } from "react";
import { WAButton } from "./GradientButton";

// TODO: actualizar N_CUPOS con el mismo valor que lib/availability.ts
const N_CUPOS = 2;

export default function StickyWABar() {
  const [visible, setVisible] = useState(false);
  const [deepScroll, setDeepScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > 520);
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      setDeepScroll(totalHeight > 0 && y / totalHeight > 0.5);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="md:hidden fixed z-40 transition-all duration-300"
      style={{
        bottom: 16,
        left: 16,
        right: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(140%)",
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={!visible}
    >
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-xl"
        style={{ background: "#fff", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--ink)" }}>
            {deepScroll ? `Quedan ${N_CUPOS} cupos · Postula ahora` : "Postular al diagnóstico · 30 min"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {deepScroll ? "Responde un humano en &lt;2h" : "Respondemos en < 2 horas hábiles"}
          </p>
        </div>
        <WAButton source="sticky" size="md">
          Diagnóstico gratis
        </WAButton>
      </div>
    </div>
  );
}
