"use client";

import { useEffect } from "react";

/**
 * Agrega un botón "Copiar" a cada bloque de código dentro de las guías.
 * Firma del formato de guías (prompts y comandos copiables).
 */
export default function GuiaCodeCopy() {
  useEffect(() => {
    const pres = document.querySelectorAll<HTMLPreElement>(".skill-prose pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copiar";
      btn.style.cssText =
        "position:absolute;top:8px;right:8px;font-size:11px;font-family:var(--font-mono),ui-monospace,monospace;" +
        "background:rgba(217,179,106,0.12);color:#e8cd97;border:1px solid rgba(217,179,106,0.3);" +
        "border-radius:5px;padding:3px 10px;cursor:pointer;opacity:0.85;transition:opacity 0.15s";
      btn.addEventListener("mouseenter", () => (btn.style.opacity = "1"));
      btn.addEventListener("mouseleave", () => (btn.style.opacity = "0.85"));
      btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        const text = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(text);
        btn.textContent = "Copiado ✓";
        window.setTimeout(() => {
          btn.textContent = "Copiar";
        }, 1500);
      });
      pre.appendChild(btn);
    });
  }, []);

  return null;
}
