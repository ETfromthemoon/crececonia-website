import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Solicitar llamada | CrececonIA",
  alternates: { canonical: `${SITE_URL}/solicitar-llamada` },
  robots: { index: false, follow: false },
};

export default function SolicitarLlamadaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
