"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HubCard from "@/components/HubCard";
import { TIPO_LABEL, type HubItem } from "@/lib/hub";
import type { TemaId } from "@/lib/temas";

export interface TemaResumen {
  id: TemaId;
  titulo: string;
  descripcion: string;
  count: number;
}

export default function CentroBrowser({
  items,
  temas,
}: {
  items: HubItem[];
  temas: TemaResumen[];
}) {
  const [q, setQ] = useState("");

  const countByTipo = useMemo(
    () => ({
      guia: items.filter((it) => it.tipo === "guia").length,
      skill: items.filter((it) => it.tipo === "skill").length,
      enlace: items.filter((it) => it.tipo === "enlace").length,
    }),
    [items],
  );

  const query = q.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (!query) return [];
    return items.filter((it) => {
      const hay = [
        it.titulo,
        it.descripcion,
        it.categoria,
        TIPO_LABEL[it.tipo],
        ...(it.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [items, query]);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Buscador global */}
      <div className="max-w-2xl mx-auto mb-14">
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--smoke)" }}
            aria-hidden
          >
            ⌕
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en todo el conocimiento…"
            aria-label="Buscar en el Centro de Conocimiento"
            className="w-full"
            style={{
              background: "var(--carbon)",
              border: "1px solid rgba(30,30,31,0.9)",
              borderRadius: 4,
              padding: "14px 16px 14px 40px",
              color: "var(--bone)",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--champagne)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,30,31,0.9)")}
          />
        </div>
      </div>

      {query ? (
        /* Resultados de búsqueda */
        <section className="pb-24">
          <p
            className="mb-6 text-xs"
            style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
          >
            {resultados.length} resultado{resultados.length === 1 ? "" : "s"} para “{q.trim()}”
          </p>
          {resultados.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                Nada por aquí. Probá con otra palabra o explorá los temas.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resultados.map((it) => (
                <HubCard key={`${it.tipo}-${it.slug}`} item={it} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Grilla de temas + acceso por tipo */
        <section className="pb-24">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {temas.map((t) => (
              <Link
                key={t.id}
                href={`/centro/${t.id}`}
                className="group block card-hover-dark"
                style={{
                  background: "var(--carbon)",
                  border: "1px solid rgba(30,30,31,0.9)",
                  borderRadius: 4,
                  padding: "28px 24px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <h3
                  className="mb-2 font-light"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.35rem",
                    color: "var(--bone)",
                    lineHeight: 1.25,
                  }}
                >
                  {t.titulo}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "var(--ash)", fontWeight: 300 }}
                >
                  {t.descripcion}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
                  >
                    {t.count} recurso{t.count === 1 ? "" : "s"}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
                  >
                    Explorar →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Explorar por tipo */}
          <div className="mt-12">
            <p
              className="mb-4 text-xs text-center"
              style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              O explorá por tipo
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                { href: "/centro/guias", label: "Todas las guías", n: countByTipo.guia },
                { href: "/centro/skills", label: "Todas las skills", n: countByTipo.skill },
                ...(countByTipo.enlace > 0
                  ? [{ href: "/centro/enlaces", label: "Todos los links", n: countByTipo.enlace }]
                  : []),
              ].map((acc) => (
                <Link
                  key={acc.href}
                  href={acc.href}
                  className="group inline-flex items-center gap-3 card-hover-dark"
                  style={{
                    background: "var(--carbon)",
                    border: "1px solid rgba(30,30,31,0.9)",
                    borderRadius: 4,
                    padding: "14px 20px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <span
                    style={{
                      color: "var(--bone)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1rem",
                      fontWeight: 300,
                    }}
                  >
                    {acc.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}
                  >
                    {acc.n}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)" }}
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
