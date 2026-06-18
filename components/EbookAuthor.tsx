"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function EbookAuthor() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-y px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/sergio.jpg"
              alt="Sergio Astudillo"
              width={96}
              height={96}
              style={{
                borderRadius: "50%",
                border: "2px solid rgba(217,179,106,0.3)",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="eyebrow mb-3">El autor</p>
            <h3
              className="font-light mb-1"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--bone)",
                fontSize: "1.3rem",
              }}
            >
              Sergio Astudillo
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              Fundador · CrececonIA
            </p>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              5+ años integrando IA en empresas medianas. 30+ proyectos en producción. 7 industrias.
              4 países. CrececonIA existe porque vi demasiados PDFs de estrategia que nadie usaba.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Este ebook no es teoría. Es lo que aprendí haciendo — los prompts que uso cada semana,
              los workflows que le explico a cada cliente nuevo, y los errores que ya no cometo.
            </p>

            <div style={{ marginTop: 20 }}>
              <a
                href="/#manifiesto"
                className="text-sm"
                style={{
                  color: "var(--champagne)",
                  textDecoration: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                Conocé más sobre CrececonIA →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
