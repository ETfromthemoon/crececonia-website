"use client";

import { useEffect } from "react";

/**
 * Envuelve cada bloque de código de las guías en un contenedor con una barra
 * superior y un botón "Copiar" (fuera del área de texto, no encima).
 * El texto del código envuelve (pre-wrap) en vez de desbordarse.
 */
export default function GuiaCodeCopy() {
  useEffect(() => {
    const pres = document.querySelectorAll<HTMLPreElement>(".skill-prose pre");
    pres.forEach((pre) => {
      // Idempotente: si ya está envuelto, no repetir.
      if (pre.parentElement?.classList.contains("code-block")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";

      const bar = document.createElement("div");
      bar.className = "code-block__bar";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copiar";
      btn.setAttribute("aria-label", "Copiar código");
      btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        const text = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(text);
        btn.textContent = "Copiado ✓";
        window.setTimeout(() => {
          btn.textContent = "Copiar";
        }, 1500);
      });
      bar.appendChild(btn);

      // Insertar wrapper en el lugar del pre y mover el pre dentro.
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(bar);
      wrapper.appendChild(pre);
    });
  }, []);

  return null;
}
