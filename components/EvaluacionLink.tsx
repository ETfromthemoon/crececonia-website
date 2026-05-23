"use client";

import { useEvaluacion } from "./EvaluacionProvider";

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
      onClick={() => abrir(source)}
      className={className}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, ...style }}
    >
      {children}
    </button>
  );
}
