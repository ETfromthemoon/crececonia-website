import type { Metadata } from "next";
import EbookRecuperarDescarga from "@/components/EbookRecuperarDescarga";

const SITE_URL = "https://www.crececonia.cl";

export const metadata: Metadata = {
  title: "Recuperar descarga — Ebooks CrececonIA",
  description:
    "Ingresá el email con el que compraste para volver a descargar tus ebooks de CrececonIA.",
  alternates: { canonical: `${SITE_URL}/ebook/descargar` },
  robots: { index: false, follow: true },
};

/**
 * Ruta canónica de recuperación, válida para CUALQUIER libro del catálogo.
 * La ruta vieja (/ebook/de-cero-a-claude-en-una-semana/descargar) sigue
 * funcionando con el mismo componente porque todos los emails ya enviados
 * apuntan ahí.
 */
export default function DescargarPage() {
  return <EbookRecuperarDescarga />;
}
