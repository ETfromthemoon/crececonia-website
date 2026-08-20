"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CorridorPath = {
  perspective?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardRadius?: number;
  birthHeight?: number;
  exitHeight?: number;
  railBirth?: number;
  railExit?: number;
  fan?: number;
  turnBirth?: number;
  turnExit?: number;
  stops?: number;
};

const PATH: Required<CorridorPath> = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.4,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
};

function keyframes(dir: 1 | -1, name: string, p: Required<CorridorPath>, unit: "cqw" | "vw" = "cqw") {
  const steps: string[] = [];

  for (let s = 0; s <= p.stops; s += 1) {
    const u = s / p.stops;
    const scale =
      (p.birthHeight / p.cardHeight) *
      Math.pow(p.exitHeight / p.birthHeight, u);
    const z = p.perspective * (1 - 1 / scale);
    const rail =
      p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;

    steps.push(
      `${(u * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(2)}${unit},0,${z.toFixed(2)}${unit}) rotateY(${(-dir * turn).toFixed(2)}deg)}`,
    );
  }

  return `@keyframes ${name}{${steps.join("")}}`;
}

export type StreamImage = {
  src: string;
  alt?: string;
};

export type ImageStreamHeroProps = {
  images: StreamImage[];
  cards?: number;
  speed?: number;
  axis?: number;
  path?: CorridorPath;
  mobileAxis?: number;
  mobilePath?: CorridorPath;
  /** Viewport units keep the mobile 3D path stable on browsers without cqw transforms. */
  mobileUnit?: "cqw" | "vw";
  children?: React.ReactNode;
  className?: string;
};

export function ImageStreamHero({
  images,
  cards = 9,
  speed = 18,
  axis = 55,
  path,
  mobileAxis = axis,
  mobilePath,
  mobileUnit = "cqw",
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & ImageStreamHeroProps) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const right = `ish-r-${id}`;
  const left = `ish-l-${id}`;
  const mobileRight = `ish-mr-${id}`;
  const mobileLeft = `ish-ml-${id}`;
  const card = `ish-c-${id}`;
  const root = `ish-root-${id}`;
  const p = React.useMemo(() => ({ ...PATH, ...path }), [path]);
  const mp = React.useMemo(() => ({ ...p, ...mobilePath }), [p, mobilePath]);

  const css = React.useMemo(
    () =>
      `${keyframes(1, right, p)}${keyframes(-1, left, p)}` +
      `${keyframes(1, mobileRight, mp, mobileUnit)}${keyframes(-1, mobileLeft, mp, mobileUnit)}` +
      `@media(max-width:680px){.${root}{--ish-perspective:${mp.perspective}${mobileUnit}!important;--ish-axis:${mobileAxis}%!important;--ish-card-width:${mp.cardWidth}${mobileUnit}!important;--ish-card-height:${mp.cardHeight}${mobileUnit}!important;--ish-card-radius:${mp.cardRadius}${mobileUnit}!important}.ish-right-${id}{animation-name:${mobileRight}!important}.ish-left-${id}{animation-name:${mobileLeft}!important}}` +
      `@media(prefers-reduced-motion:reduce){.${card}{animation-play-state:paused}}`,
    [right, left, mobileRight, mobileLeft, card, root, id, p, mp, mobileAxis, mobileUnit],
  );

  const rootStyle = {
    containerType: "inline-size",
    "--ish-perspective": `${p.perspective}cqw`,
    "--ish-axis": `${axis}%`,
    "--ish-card-width": `${p.cardWidth}cqw`,
    "--ish-card-height": `${p.cardHeight}cqw`,
    "--ish-card-radius": `${p.cardRadius}cqw`,
    ...props.style,
  } as React.CSSProperties;

  return (
    <div
      className={cn(root, "relative overflow-hidden", className)}
      {...props}
      style={rootStyle}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="image-stream-stage pointer-events-none absolute inset-0"
        style={{
          perspective: "var(--ish-perspective)",
          perspectiveOrigin: "50% var(--ish-axis)",
        }}
      >
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {[right, left].map((name) =>
            Array.from({ length: cards }, (_, i) => {
              const img = images[i % Math.max(images.length, 1)];

              return (
                <div
                  key={`${name}-${i}`}
                  className={cn(card, name === right ? `ish-right-${id}` : `ish-left-${id}`, "image-stream-card absolute overflow-hidden")}
                  style={{
                    left: "50%",
                    top: "var(--ish-axis)",
                    width: "var(--ish-card-width)",
                    height: "var(--ish-card-height)",
                    marginLeft: "calc(var(--ish-card-width) / -2)",
                    marginTop: "calc(var(--ish-card-height) / -2)",
                    borderRadius: "var(--ish-card-radius)",
                    animation: `${name} ${speed}s linear infinite`,
                    animationDelay: `${-(i * speed) / cards}s`,
                    backfaceVisibility: "hidden",
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={img.alt ?? ""}
                      loading={i < 3 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

export default ImageStreamHero;
