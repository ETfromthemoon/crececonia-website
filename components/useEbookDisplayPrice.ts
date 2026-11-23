"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";

type DisplayPrice = PriceInfo & { salePrice?: number; previousPrice?: number; pricingTime?: number; promotionEndsAt?: string | null };

/** Precio de los CTA del hero, actualizado también si la pestaña cruza el cierre. */
export function useEbookDisplayPrice(resource: string) {
  const [priceInfo, setPriceInfo] = useState<DisplayPrice | null>(null);
  useEffect(() => {
    let cancelled = false;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const response = await fetch(`/api/ebook/cupos?resource=${encodeURIComponent(resource)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Precio no disponible");
        const data: DisplayPrice = await response.json();
        if (!Number.isFinite(data.salePrice ?? data.price)) throw new Error("Precio no válido");
        if (cancelled) return;
        setPriceInfo(data);
        clearTimeout(expiryTimer);
        if (data.promotionEndsAt && data.pricingTime) {
          expiryTimer = setTimeout(() => { setPriceInfo(null); void load(); }, Math.max(0, Date.parse(data.promotionEndsAt) - data.pricingTime));
        }
      } catch {
        if (!cancelled) setPriceInfo(null);
      }
    };
    setPriceInfo(null);
    void load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); clearTimeout(expiryTimer); };
  }, [resource]);
  return priceInfo;
}
