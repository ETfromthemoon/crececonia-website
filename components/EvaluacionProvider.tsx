"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = {
  open: boolean;
  source: string;
  abrir: (source?: string) => void;
  cerrar: () => void;
};

const EvaluacionCtx = createContext<Ctx | null>(null);

export function EvaluacionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("default");

  return (
    <EvaluacionCtx.Provider
      value={{
        open,
        source,
        abrir: (src = "default") => {
          setSource(src);
          setOpen(true);
        },
        cerrar: () => setOpen(false),
      }}
    >
      {children}
    </EvaluacionCtx.Provider>
  );
}

export function useEvaluacion() {
  const ctx = useContext(EvaluacionCtx);
  if (!ctx) throw new Error("useEvaluacion debe usarse dentro de EvaluacionProvider");
  return ctx;
}
