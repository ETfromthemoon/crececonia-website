"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./EbookCinematic.module.css";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function EbookPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
      className="relative flex items-center justify-center py-8 lg:py-0"
    >
      {/* Glass frame peeking out behind the tilted cover — editorial overlap.
          Bumped opacity vs. the shared .glass default so it reads against
          the Hero's dark cold-open backdrop. */}
      <motion.div
        aria-hidden
        className={`${styles.glass} ${styles.glassSheen}`}
        initial={{ opacity: 0, rotate: -8 }}
        animate={{ opacity: 1, rotate: -4 }}
        transition={{ duration: 1, delay: 0.5, ease: EASE }}
        style={{
          position: "absolute",
          inset: "8% -4% -4% 10%",
          borderRadius: 28,
          background: "rgba(207,218,245,0.5)",
        }}
      />
      <div
        style={{
          position: "relative",
          transform: "perspective(1400px) rotateY(-15deg) rotateX(3deg)",
          boxShadow:
            "0 40px 100px -20px rgba(143,163,217,0.4), 0 0 70px rgba(143,163,217,0.15)",
          borderRadius: 6,
          overflow: "hidden",
          flexShrink: 0,
          width: "min(520px, 90vw)",
        }}
      >
        <Image
          src="/ebook-cover.png"
          alt="De cero a Claude en una semana — Ebook"
          width={520}
          height={693}
          priority
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>
    </motion.div>
  );
}
