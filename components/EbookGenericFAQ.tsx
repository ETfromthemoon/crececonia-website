"use client";

import { useState } from "react";
import EbookSectionHeading from "./EbookSectionHeading";

export type FAQItem = { q: string; a: string };

type Props = {
  faqs: FAQItem[];
};

/**
 * FAQ genérico y parametrizable — mismo look & feel que EbookFAQ (libro 1)
 * pero con preguntas propias por libro.
 */
export default function EbookGenericFAQ({ faqs }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section-y-narrow px-6">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <EbookSectionHeading kicker="FAQ">
          Las que más <em style={{ fontStyle: "italic" }}>preguntan.</em>
        </EbookSectionHeading>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.1)",
                  borderTop: idx === 0 ? "1px solid rgba(0,0,0,0.1)" : "none",
                  background: isOpen ? "rgba(198,219,112,0.16)" : "transparent",
                  transition: "background 0.35s ease",
                  borderRadius: isOpen ? 12 : 0,
                }}
              >
                <button
                  className="w-full text-left py-5 flex items-center justify-between gap-4"
                  style={{ padding: "20px 0" }}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`gfaq-panel-${idx}`}
                  id={`gfaq-trigger-${idx}`}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-serif-monad), Georgia, serif",
                      fontWeight: 400,
                      fontSize: "1rem",
                      lineHeight: 1.45,
                      color: "#000",
                    }}
                  >
                    {faq.q}
                  </span>
                  <span
                    style={{
                      color: "#4e4d4d",
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: "transform 0.3s ease",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      display: "block",
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  id={`gfaq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`gfaq-trigger-${idx}`}
                  className={`accordion-body${isOpen ? " open" : ""}`}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.82rem",
                        lineHeight: 1.8,
                        color: "#4e4d4d",
                        paddingBottom: 20,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
