"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import styles from "./EbookCinematic.module.css";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

type Props = {
  title: string;
  description: string;
  href: string;
  coverSrc?: string;
  /**
   * Portadas de los libros que componen un combo. Un bundle no tiene portada
   * propia, y sin esto la card mostraba un "?" gigante en el catálogo.
   */
  coverSrcs?: string[];
  status: "available" | "coming-soon";
  priceLabel?: string;
  index?: number;
};

/**
 * Card de catálogo para /ebooks. Pensada para crecer: cada ebook nuevo es
 * una entrada más en la lista que pasa a app/ebooks/page.tsx, sin tocar
 * este componente.
 */
export default function EbookCard({
  title,
  description,
  href,
  coverSrc,
  coverSrcs,
  status,
  priceLabel,
  index = 0,
}: Props) {
  const isComingSoon = status === "coming-soon";
  const collage = coverSrcs ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
      className={`${styles.glass} ${styles.glassHover}`}
      style={{
        borderRadius: 24,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity: isComingSoon ? 0.88 : 1,
      }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          // Las portadas del catálogo comparten ratio 1:1.6 — usarlo evita
          // recortes en la grilla en vez de forzar un 3:4 genérico.
          aspectRatio: "1 / 1.6",
          background: "#141414",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            style={{ objectFit: "cover" }}
          />
        ) : collage.length > 0 ? (
          // Combo: se muestran las portadas de los libros que incluye,
          // superpuestas en abanico. Antes acá salía un "?" gigante.
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12% 8%",
            }}
          >
            {collage.map((src, i) => (
              <div
                key={src}
                style={{
                  position: "relative",
                  width: `${Math.min(58, 92 / collage.length + 18)}%`,
                  aspectRatio: "1 / 1.6",
                  marginLeft: i === 0 ? 0 : "-16%",
                  borderRadius: 6,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  transform: `rotate(${(i - (collage.length - 1) / 2) * 4}deg)`,
                  zIndex: i,
                }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-display), Arial, sans-serif",
              color: "rgba(246,243,241,0.15)",
              fontSize: "3rem",
            }}
          >
            ?
          </span>
        )}
        {isComingSoon && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(20,20,20,0.85)",
              color: "#f6f3f1",
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 100,
            }}
          >
            Próximamente
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: "var(--font-display), Arial, sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            fontSize: "1.12rem",
            lineHeight: 1.3,
            color: "#000",
            marginBottom: 7,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.76rem",
            lineHeight: 1.65,
            color: "#4e4d4d",
          }}
        >
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="btn-monad-fill"
        style={{
          textAlign: "center",
          background: isComingSoon ? "transparent" : "#242424",
          color: isComingSoon ? "#242424" : "#f6f3f1",
          border: isComingSoon ? "1px solid rgba(0,0,0,0.25)" : "1px solid #242424",
        }}
      >
        {isComingSoon ? "Avísame cuando esté" : priceLabel ?? "Ver ebook"}
      </Link>
    </motion.div>
  );
}
