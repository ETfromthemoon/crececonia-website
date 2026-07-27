"use client";

import { motion } from "framer-motion";
import styles from "./EbookCinematic.module.css";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

type Props = {
  role: string;
  title: string;
  desc: string;
  index: number;
};

export default function EbookProfileCard({ role, title, desc, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      className={`${styles.glass} ${styles.glassHover}`}
      style={{ borderRadius: 40, padding: "32px" }}
    >
      <p
        style={{
          color: "#242424",
          fontSize: "0.68rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {role}
      </p>
      <h3
        style={{
          fontFamily: "var(--font-serif-monad), Georgia, serif",
          fontWeight: 400,
          color: "#000",
          fontSize: "1.05rem",
          lineHeight: 1.35,
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "#4e4d4d",
          lineHeight: 1.75,
        }}
      >
        {desc}
      </p>
    </motion.div>
  );
}
