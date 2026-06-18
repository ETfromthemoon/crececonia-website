"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function EbookPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="flex items-center justify-center py-8 lg:py-0"
    >
      <div
        style={{
          transform: "perspective(1400px) rotateY(-15deg) rotateX(3deg)",
          boxShadow: "-12px 18px 0 #050505, 40px 56px 110px rgba(0,0,0,0.85), 0 0 80px rgba(217,179,106,0.06)",
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
