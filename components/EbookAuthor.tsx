"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import styles from "./EbookCinematic.module.css";

export default function EbookAuthor() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-y px-6" style={{ position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden
        className={styles.numeralGhost}
        style={{
          position: "absolute",
          left: "50%",
          top: "-4%",
          transform: "translateX(-50%)",
          fontSize: "clamp(8rem, 24vw, 18rem)",
          color: "rgba(36,36,36,0.045)",
          zIndex: 0,
        }}
      >
        &ldquo;
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
          <div
            className={`${styles.glass} ${styles.glassSheen}`}
            style={{ flexShrink: 0, borderRadius: "50%", padding: 6 }}
          >
            <Image
              src="/sergio.jpg"
              alt="Sergio Astudillo"
              width={96}
              height={96}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#4e4d4d",
                marginBottom: 12,
              }}
            >
              El autor
            </p>
            <h3
              style={{
                fontFamily: "var(--font-serif-monad), Georgia, serif",
                fontWeight: 400,
                color: "#000",
                fontSize: "1.3rem",
                marginBottom: 4,
              }}
            >
              Sergio Astudillo
            </h3>
            <p
              style={{
                color: "#4e4d4d",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Fundador · CrececonIA
            </p>
            <p
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.8,
                color: "#4e4d4d",
                marginBottom: 12,
              }}
            >
              5+ años integrando IA en empresas medianas. 30+ proyectos en producción. 7 industrias.
              4 países. CrececonIA existe porque vi demasiados PDFs de estrategia que nadie usaba.
            </p>
            <p
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.8,
                color: "#4e4d4d",
              }}
            >
              Este ebook no es teoría. Es lo que aprendí haciendo — los prompts que uso cada semana,
              los workflows que le explico a cada cliente nuevo, y los errores que ya no cometo.
            </p>

            <div style={{ marginTop: 20 }}>
              <a
                href="/"
                style={{
                  color: "#242424",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(0,0,0,0.3)",
                  textUnderlineOffset: 3,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                Conoce más sobre CrececonIA →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
