import type { ReactNode } from "react";
import EbookSectionHeading from "./EbookSectionHeading";

type EbookFitProps = {
  title: ReactNode;
  forYou: string[];
  notFor: string[];
  alternative?: { href: string; label: string };
};

export default function EbookFit({ title, forYou, notFor, alternative }: EbookFitProps) {
  return (
    <section className="section-y px-6">
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <EbookSectionHeading kicker="Antes de comprar" align="left" maxWidth={760}>
          {title}
        </EbookSectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div style={{ borderTop: "2px solid rgba(198,219,112,0.9)", paddingTop: 18 }}>
            <p style={{ color: "#718641", fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cómpralo si</p>
            <ul style={{ display: "grid", gap: 12, marginTop: 22 }}>
              {forYou.map((item) => <li key={item} style={{ color: "#2c2b2a", fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.7, paddingLeft: 18, position: "relative" }}><span style={{ color: "#718641", left: 0, position: "absolute" }}>+</span>{item}</li>)}
            </ul>
          </div>
          <div style={{ borderTop: "2px solid rgba(125,78,55,0.45)", paddingTop: 18 }}>
            <p style={{ color: "#825439", fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>No lo compres todavía si</p>
            <ul style={{ display: "grid", gap: 12, marginTop: 22 }}>
              {notFor.map((item) => <li key={item} style={{ color: "#4e4d4d", fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.7, paddingLeft: 18, position: "relative" }}><span style={{ color: "#825439", left: 0, position: "absolute" }}>–</span>{item}</li>)}
            </ul>
            {alternative && <a href={alternative.href} style={{ color: "#718641", display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.72rem", marginTop: 24, textDecoration: "underline" }}>{alternative.label} →</a>}
          </div>
        </div>
      </div>
    </section>
  );
}
