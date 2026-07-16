"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import styles from "./EbookCinematic.module.css";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

type Props = {
  kicker: string;
  children: ReactNode;
  align?: "left" | "center";
  maxWidth?: number;
  size?: "md" | "lg";
};

/**
 * Shared kicker + headline block for the ebook sections. Centralizes the
 * blur-in title reveal and grown-hairline accent so every section shares
 * the same cinematic timing instead of six near-duplicate blocks.
 */
export default function EbookSectionHeading({
  kicker,
  children,
  align = "center",
  maxWidth,
  size = "md",
}: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      style={{
        textAlign: align,
        marginBottom: 48,
        maxWidth,
        marginLeft: align === "center" ? "auto" : undefined,
        marginRight: align === "center" ? "auto" : undefined,
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#4e4d4d",
          marginBottom: 16,
        }}
      >
        {kicker}
      </motion.p>
      <motion.div
        className={styles.hairline}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
        style={{
          transformOrigin: align === "center" ? "center" : "left",
          margin: align === "center" ? "0 auto 20px" : "0 0 20px",
        }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
        style={{
          fontFamily: "var(--font-serif-monad), Georgia, serif",
          fontWeight: 400,
          fontSize:
            size === "lg"
              ? "clamp(1.8rem, 3.5vw, 2.8rem)"
              : "clamp(1.8rem, 3.5vw, 2.4rem)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: "#000",
        }}
      >
        {children}
      </motion.h2>
    </div>
  );
}
