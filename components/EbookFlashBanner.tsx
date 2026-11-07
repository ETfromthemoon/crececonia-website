"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EBOOK_FLASH_END } from "@/lib/ebook-promotion";

export default function EbookFlashBanner({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timeout = setTimeout(() => router.refresh(), Math.max(0, Date.parse(EBOOK_FLASH_END) - Date.now()));
    return () => clearTimeout(timeout);
  }, [active, router]);

  if (!active) return null;
  return (
    <aside aria-label="Promoción de ebooks" style={{ padding: "18px 24px", background: "var(--champagne, #dac5a7)", color: "#242424", textAlign: "center" }}>
      <strong>Solo por hoy: 50% de descuento en todos los ebooks y bundles.</strong>
      <p style={{ marginTop: 6 }}>7 de noviembre · Hasta las 23:59, hora de Santiago. Precio rebajado automáticamente, sin cupón. No acumulable con otros códigos.</p>
    </aside>
  );
}
