"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import EbookSectionHeading from "./EbookSectionHeading";

export type TOCChapter = { title: string; desc: string };
export type TOCSection = { heading: string; chapters: TOCChapter[] };

type Props = {
  kicker?: string;
  title: ReactNode;
  sections: TOCSection[];
};

/**
 * Tabla de contenido genérica agrupada por nivel/parte — a diferencia de
 * EbookTOC (lista plana fija del libro 1), acepta cualquier estructura de
 * secciones. Cada sección numera sus propios capítulos desde 01.
 */
export default function EbookGenericTOC({ kicker = "Contenido", title, sections }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-y px-6" style={{ background: "rgba(207,218,245,0.18)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <EbookSectionHeading kicker={kicker}>{title}</EbookSectionHeading>

        <div ref={ref}>
          {sections.map((section, sIdx) => (
            <div key={section.heading} style={{ marginBottom: sIdx < sections.length - 1 ? 32 : 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#8fa3d9",
                  marginBottom: 4,
                  paddingBottom: 12,
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {section.heading}
              </p>
              {section.chapters.map((ch, i) => (
                <motion.div
                  key={ch.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: (sIdx * section.chapters.length + i) * 0.04,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  style={{ padding: "18px 0" }}
                >
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#cfdaf5",
                        borderRadius: 8,
                        color: "#242424",
                        fontSize: "0.66rem",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-serif-monad), Georgia, serif",
                          fontWeight: 400,
                          color: "#000",
                          fontSize: "0.98rem",
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {ch.title}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.76rem",
                          color: "#4e4d4d",
                          lineHeight: 1.6,
                        }}
                      >
                        {ch.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
