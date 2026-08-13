"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchDevice = navigator.maxTouchPoints > 0;
    if (reducedMotion || touchDevice) return;

    const lenis = new Lenis({
      // Un easing suave mantiene la sensación editorial sin hacer que el
      // scroll se sienta atrasado detrás de la rueda o trackpad.
      lerp: 0.16,
      wheelMultiplier: 0.95,
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
