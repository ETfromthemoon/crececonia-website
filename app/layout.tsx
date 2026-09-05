import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono, Source_Serif_4, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import PostHogProvider from "@/components/PostHogProvider";
import MetaPixel from "@/components/MetaPixel";
import { EvaluacionProvider } from "@/components/EvaluacionProvider";
import EvaluacionModal from "@/components/EvaluacionModal";
import ChatWidget from "@/components/ChatWidget";
import EbookPopup from "@/components/EbookPopup";
import { organizationJsonLd, serializeJsonLd, SITE_URL } from "@/lib/seo";
import "@/components/PopupSurfaces.css";
import "@/components/ContrastOverrides.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-editorial", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const sourceSerif4 = Source_Serif_4({ variable: "--font-serif-monad", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Consultoría de IA para empresas | CrececonIA",
  description: "Consultoría de IA en Chile para aprender, recibir mentoría o implementar agentes y automatizaciones. Compara rutas, requisitos e inversión.",
  applicationName: "CrececonIA",
  authors: [{ name: "CrececonIA" }],
  category: "Inteligencia artificial aplicada",
  openGraph: { title: "Consultoría de IA para empresas | CrececonIA", description: "Recursos, mentoría e implementación para aplicar IA a procesos reales de trabajo y negocio.", url: SITE_URL, siteName: "CrececonIA", locale: "es_CL", type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CrececonIA — IA aplicada a tu negocio" }] },
  twitter: { card: "summary_large_image", title: "Consultoría de IA para empresas | CrececonIA", description: "Recursos, mentoría e implementación para aplicar IA a procesos reales de trabajo y negocio.", images: ["/opengraph-image"] },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-CL" data-theme="light" className={`${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable} antialiased`}><head><meta name="facebook-domain-verification" content="yv8r0z7loiesxg7kevissyb0owb7hm" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }} /></head><body className="flex flex-col min-h-screen"><MetaPixel /><PostHogProvider><EvaluacionProvider><SmoothScroll />{children}<EvaluacionModal /><ChatWidget /><EbookPopup /></EvaluacionProvider></PostHogProvider></body></html>;
}
