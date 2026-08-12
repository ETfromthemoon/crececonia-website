import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import PostHogProvider from "@/components/PostHogProvider";
import { EvaluacionProvider } from "@/components/EvaluacionProvider";
import EvaluacionModal from "@/components/EvaluacionModal";
import ChatWidget from "@/components/ChatWidget";
import EbookPopup from "@/components/EbookPopup";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-display", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const sourceSerif4 = Source_Serif_4({ variable: "--font-serif-monad", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], display: "swap" });
const SITE_URL = "https://crececonia.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CrececonIA — Aprende, recibe dirección e implementa IA.",
  description: "Una escalera de valor para aplicar IA: ebooks y guías, mentoría personalizada e implementación de agentes y sistemas.",
  authors: [{ name: "CrececonIA" }],
  openGraph: { title: "CrececonIA — Aprende, recibe dirección e implementa IA.", description: "Ebooks, mentoría e implementación de IA para personas y empresas que quieren avanzar con criterio.", url: SITE_URL, siteName: "CrececonIA", locale: "es_CL", type: "website", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CrececonIA — Aprende, recibe dirección e implementa IA" }] },
  twitter: { card: "summary_large_image", title: "CrececonIA — Aprende, recibe dirección e implementa IA.", description: "Ebooks, mentoría e implementación de IA para personas y empresas.", images: ["/og-image.png"] },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: [{ url: "/favicon-32.png", type: "image/png", sizes: "32x32" }, { url: "/icon.svg", type: "image/svg+xml" }] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CrececonIA",
  url: SITE_URL,
  description: "Ebooks, mentoría e implementación de inteligencia artificial.",
  areaServed: ["CL", "ES", "MX", "CO", "AR", "PE"],
  serviceType: "IA aplicada, mentoría e implementación de sistemas de IA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-theme="light" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable} antialiased`}><head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></head><body className="flex flex-col min-h-screen"><PostHogProvider><EvaluacionProvider><SmoothScroll />{children}<EvaluacionModal /><ChatWidget /><EbookPopup /></EvaluacionProvider></PostHogProvider></body></html>;
}
