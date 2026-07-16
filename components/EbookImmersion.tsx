"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import styles from "./EbookCinematic.module.css";

/**
 * Cinematic scroll set-piece dramatizing the ebook's promise. Text-only by
 * design: the ebook cover art (public/ebook-cover.png) already carries its
 * own baked-in cover copy ("25 capítulos") that would clash with this page's
 * page-count framing if blown up full-bleed, so this reveal is built from
 * typography instead of the cover image.
 *
 * Copy is reused verbatim from EbookProblem's third paragraph and from the
 * Hero's trust line — no new claims are introduced.
 */
const LINES: [string, string, string] = [
  "Este ebook condensa 6 meses",
  "de experimentación real con Claude Code",
  "en 150+ páginas.",
];
const DETAIL = "PDF · Descarga inmediata · Garantía de devolución";
const ACCENT = "#8fa3d9";
const BG = "#141414";
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function EbookImmersion() {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0005,
  });

  const numeralScale = useTransform(p, [0, 1], [1, 1.6]);
  const numeralOpacity = useTransform(p, [0, 0.5, 1], [0.05, 0.09, 0.05]);

  const l1o = useTransform(p, [0.06, 0.22, 0.82, 0.96], [0, 1, 1, 0]);
  const l1b = useTransform(p, [0.06, 0.22], ["blur(16px)", "blur(0px)"]);
  const l1y = useTransform(p, [0.06, 0.22], [40, 0]);
  const l2o = useTransform(p, [0.2, 0.36, 0.82, 0.96], [0, 1, 1, 0]);
  const l2b = useTransform(p, [0.2, 0.36], ["blur(16px)", "blur(0px)"]);
  const l2y = useTransform(p, [0.2, 0.36], [40, 0]);
  const l3o = useTransform(p, [0.34, 0.5, 0.82, 0.96], [0, 1, 1, 0]);
  const l3b = useTransform(p, [0.34, 0.5], ["blur(16px)", "blur(0px)"]);
  const l3y = useTransform(p, [0.34, 0.5], [40, 0]);

  const lineScaleX = useTransform(p, [0.5, 0.66], [0, 1]);
  const detailO = useTransform(p, [0.58, 0.7, 0.82, 0.94], [0, 1, 1, 0]);

  if (reduced) {
    return (
      <section
        className="px-6"
        style={{ background: BG, padding: "96px 24px" }}
        aria-label="La promesa del ebook"
      >
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 5vw, 3rem)",
              lineHeight: 1.25,
              color: "#f6f3f1",
            }}
          >
            {LINES.join(" ")}
          </h2>
          <p
            style={{
              marginTop: 24,
              color: "rgba(246,243,241,0.65)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {DETAIL}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      style={{ height: "220vh", background: BG }}
      aria-label="La promesa del ebook"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex items-center justify-center">
        <motion.div
          aria-hidden
          className={styles.numeralGhost}
          style={{
            position: "absolute",
            fontSize: "clamp(10rem, 42vw, 34rem)",
            scale: numeralScale,
            opacity: numeralOpacity,
            color: "#f6f3f1",
          }}
        >
          6M
        </motion.div>

        <div className="relative px-6 text-center" style={{ maxWidth: 780 }}>
          <h2
            className="leading-[1.05] tracking-tight"
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontSize: "clamp(1.9rem, 5.5vw, 3.4rem)",
              fontWeight: 400,
              color: "#f6f3f1",
            }}
          >
            <motion.span className="block" style={{ opacity: l1o, y: l1y, filter: l1b }}>
              {LINES[0]}
            </motion.span>
            <motion.span className="block" style={{ opacity: l2o, y: l2y, filter: l2b }}>
              {LINES[1]}
            </motion.span>
            <motion.span
              className="block italic"
              style={{ opacity: l3o, y: l3y, filter: l3b, color: ACCENT }}
            >
              {LINES[2]}
            </motion.span>
          </h2>
          <motion.div
            aria-hidden
            style={{
              marginTop: 36,
              height: 1,
              width: 96,
              marginLeft: "auto",
              marginRight: "auto",
              scaleX: lineScaleX,
              transformOrigin: "center",
              background: `linear-gradient(to right, transparent, ${ACCENT}, transparent)`,
            }}
          />
          <motion.p
            style={{
              opacity: detailO,
              marginTop: 24,
              color: "rgba(246,243,241,0.65)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {DETAIL}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
