"use client";

import { useEffect, useMemo, useState } from "react";
import EbookCard from "@/components/EbookCard";
import { trackEbookEvent } from "@/lib/analytics";
import { catalogResultBucket, searchLengthBucket } from "@/lib/marketplace/catalog-analytics";

type CatalogBook = {
  key: string;
  title: string;
  description: string;
  href: string;
  coverSrc: string;
  status: "available" | "coming-soon";
  priceLabel?: string;
  previousPriceLabel?: string;
  level: string;
  outcome: string;
  audience: string;
  pageCount: number;
};

export default function EbookCatalogBrowser({ books }: { books: CatalogBook[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const levels = useMemo(() => [...new Set(books.map((book) => book.level))].sort(), [books]);
  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-CL");
    return books.filter((book) => {
      const matchesLevel = level === "all" || book.level === level;
      const searchableText = `${book.title} ${book.description} ${book.outcome} ${book.audience}`.toLocaleLowerCase("es-CL");
      return matchesLevel && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [books, level, query]);

  useEffect(() => {
    const lengthBucket = searchLengthBucket(query);
    if (!lengthBucket) return;
    const timer = window.setTimeout(() => {
      trackEbookEvent("marketplace_catalog_search", {
        query_length_bucket: lengthBucket,
        result_bucket: catalogResultBucket(filteredBooks.length),
        level_filter: level,
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [query, level, filteredBooks.length]);

  return (
    <>
      <div className="ebook-marketplace-controls" aria-label="Buscar y filtrar ebooks">
        <label className="ebook-marketplace-search">
          <span>Buscar por tema o resultado</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Claude, agentes, sitios web…"
          />
        </label>
        <label className="ebook-marketplace-level">
          <span>Nivel</span>
          <select value={level} onChange={(event) => {
            const nextLevel = event.target.value;
            setLevel(nextLevel);
            trackEbookEvent("marketplace_catalog_filter", { level_filter: nextLevel });
          }}>
            <option value="all">Todos los niveles</option>
            {levels.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <p className="ebook-marketplace-result-count" aria-live="polite">
          {filteredBooks.length} {filteredBooks.length === 1 ? "ebook" : "ebooks"}
        </p>
      </div>

      {filteredBooks.length ? (
        <div className="ebook-store-grid">
          {filteredBooks.map(({ key, ...card }, index) => <EbookCard key={key} index={index} {...card} onSelect={() => trackEbookEvent("marketplace_book_selected", {
            resource: key,
            availability: card.status,
            level_filter: level,
            search_active: Boolean(searchLengthBucket(query)),
            placement: "catalog",
            card_position: index + 1,
          })} />)}
        </div>
      ) : (
        <p className="ebook-marketplace-empty" role="status">
          No encontramos ebooks que coincidan. Prueba con otro tema o nivel.
        </p>
      )}
    </>
  );
}
