"use client";

import { useEvaluacion } from "./EvaluacionProvider";
import { trackEvent } from "@/lib/analytics";

export default function EvaluacionLink({
  children,
  source = "inline-link",
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  source?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { abrir } = useEvaluacion();
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent("ecosystem_cta_clicked", { cta: "evaluation", source });
        abrir(source);
      }}
      className={className}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, ...style }}
    >
      {children}
    </button>
  );
}
