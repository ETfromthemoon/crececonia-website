"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function EbookPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
      className="relative flex items-center justify-center py-8 lg:py-0"
    >
      {/* Ambient glow — grounds the cover against the dark cold-open backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "70%",
          height: "70%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(143,163,217,0.28) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: 12,
          overflow: "hidden",
          flexShrink: 0,
          width: "min(460px, 82vw)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 40px 100px -20px rgba(143,163,217,0.35), 0 0 60px rgba(143,163,217,0.12)",
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
