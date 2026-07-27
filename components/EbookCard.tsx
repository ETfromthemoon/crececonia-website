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
  status,
  priceLabel,
  index = 0,
}: Props) {
  const isComingSoon = status === "coming-soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
      className={`${styles.glass} ${styles.glassHover}`}
      style={{
        borderRadius: 32,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        opacity: isComingSoon ? 0.88 : 1,
      }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "3 / 4",
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
        ) : (
          <span
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
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
            fontFamily: "var(--font-serif-monad), Georgia, serif",
            fontWeight: 400,
            fontSize: "1.2rem",
            lineHeight: 1.3,
            color: "#000",
            marginBottom: 8,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            lineHeight: 1.7,
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
        {isComingSoon ? "Avisame cuando esté" : priceLabel ?? "Ver ebook"}
      </Link>
    </motion.div>
  );
}
