"use client";
import { useState } from "react";

export default function PromptDemoBox({ prompt, titulo }: { prompt: string; titulo: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="my-8"
      style={{
        background: "var(--carbon)",
        border: "1px solid rgba(217,179,106,0.25)",
        borderRadius: 4,
        padding: "20px 22px",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs"
          style={{
            color: "var(--champagne)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Pruébalo con Claude
        </p>
        <button
          onClick={copy}
          className="text-xs px-3 py-1 transition-opacity hover:opacity-80"
          style={{
            background: copied ? "rgba(52,211,153,0.15)" : "var(--gold-soft)",
            color: copied ? "rgb(110,231,183)" : "var(--champagne)",
            border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(217,179,106,0.3)"}`,
            borderRadius: 2,
            fontFamily: "var(--font-mono)",
          }}
        >
          {copied ? "✓ copiado" : "copiar prompt"}
        </button>
      </div>
      <pre
        className="text-xs whitespace-pre-wrap break-words"
        style={{
          color: "var(--ash)",
          fontFamily: "var(--font-mono)",
          lineHeight: 1.6,
          margin: 0,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {prompt}
      </pre>
      <p
        className="mt-3 text-xs"
        style={{ color: "var(--smoke)", lineHeight: 1.5 }}
      >
        Pega esto en Claude (Claude Code, Claude.ai o tu API) reemplazando los placeholders <code style={{ color: "var(--champagne)" }}>{"{...}"}</code> con tus datos reales.
      </p>
    </div>
  );
}
