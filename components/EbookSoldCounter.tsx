"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  /** Color del texto — pásalo distinto según el fondo (oscuro/crema) de cada página de ebook. */
  color?: string;
};

/**
 * Prueba social reutilizable para cualquier página de ebook: cuántas
 * personas ya lo compraron. Consulta /api/ebook/stats (66 pre-lanzamiento +
 * conteo real de ebook_purchases). No renderiza nada hasta tener el número
 * real — evita mostrar y luego "saltar" a otro valor.
 */
export default function EbookSoldCounter({ color = "rgba(246,243,241,0.6)" }: Props) {
  const [sold, setSold] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ebook/stats")
      .then((r) => r.json())
      .then((data) => setSold(data.sold))
      .catch(() => {});
  }, []);

  if (sold === null) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        color,
        fontFamily: "var(--font-mono)",
        fontSize: "0.72rem",
        letterSpacing: "0.08em",
      }}
    >
      {sold}+ personas ya lo compraron
    </motion.p>
  );
}
