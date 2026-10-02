import Link from "next/link";
import { getCatalogEntry, getLiveCatalogEntries } from "@/lib/ebook-catalog";

type EbookCatalogNavProps = {
  currentResource: string;
};

export default function EbookCatalogNav({ currentResource }: EbookCatalogNavProps) {
  const currentEntry = getCatalogEntry(currentResource);
  const liveEntries = getLiveCatalogEntries();
  const entries = currentEntry && currentEntry.active && !liveEntries.some((entry) => entry.resource === currentResource)
    ? [...liveEntries, currentEntry]
    : liveEntries;

  return (
    <nav className="ebook-library-nav" aria-label="Navegación de ebooks">
      <div className="ebook-library-nav-inner">
        <Link href="/ebooks" className="ebook-library-index">Biblioteca <span>↗</span></Link>
        <details className="ebook-switcher">
          <summary>{currentEntry?.title ?? "Elegir ebook"}<span aria-hidden="true">⌄</span></summary>
        <div className="ebook-library-links" aria-label="Todos los ebooks">
          {entries.map((entry) => (
            <Link
              key={entry.resource}
              href={entry.href}
              aria-current={entry.resource === currentResource ? "page" : undefined}
            >
              {entry.title}
            </Link>
          ))}
        </div>
        </details>
      </div>
    </nav>
  );
}
