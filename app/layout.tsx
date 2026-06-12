import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { EvaluacionProvider } from "@/components/EvaluacionProvider";
import EvaluacionModal from "@/components/EvaluacionModal";
import ChatWidget from "@/components/ChatWidget";
import SuscriptorPopup from "@/components/SuscriptorPopup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://crececonia.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CrececonIA — Sistemas que tu equipo sí usa, sin gastar en IA que no necesitas.",
  description:
    "Consultoría de IA para empresas medianas. Aplicamos el Protocolo BPI: Bases, Procesos, IA — en ese orden. Test de Fit gratuito de 30 minutos: te decimos honestamente en qué letra está tu empresa.",
  authors: [{ name: "CrececonIA" }],
  openGraph: {
    title: "CrececonIA — Sistemas que tu equipo sí usa, sin gastar en IA que no necesitas.",
    description:
      "Consultoría de IA para empresas medianas. Aplicamos el Protocolo BPI: Bases, Procesos, IA — en ese orden. Test de Fit gratuito de 30 minutos.",
    url: SITE_URL,
    siteName: "CrececonIA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrececonIA — Protocolo BPI: Bases, Procesos, IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CrececonIA — Sistemas que tu equipo sí usa, sin gastar en IA que no necesitas.",
    description:
      "Consultoría de IA para empresas medianas. Protocolo BPI: Bases, Procesos, IA — en ese orden. Test de Fit gratuito.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CrececonIA",
  url: SITE_URL,
  description:
    "Consultoría de IA para empresas medianas. Aplicamos el Protocolo BPI: Bases, Procesos, IA — en ese orden. Si tu empresa no necesita IA, te lo decimos en el Test de Fit.",
  areaServed: ["CL", "ES", "MX", "CO", "AR", "PE"],
  serviceType: "Consultoría de Inteligencia Artificial",
  slogan: "Sistemas que tu equipo sí usa, sin gastar en IA que no necesitas.",
  offers: [
    {
      "@type": "Offer",
      name: "Test de Fit",
      description:
        "Sesión gratuita de 30 minutos para identificar en qué letra del Protocolo BPI está tu empresa (Bases, Procesos o IA).",
      price: "0",
      priceCurrency: "CLP",
    },
    {
      "@type": "Offer",
      name: "Auditoría profunda",
      description:
        "Mapeo de Bases y Procesos + hoja de ruta priorizada por ROI. 2 semanas.",
      price: "500",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Implementación completa",
      description:
        "Instalación, integración, capacitación y medición de adopción en semana 3. Garantía: si no se usa, iteramos sin costo.",
      price: "1500",
      priceCurrency: "USD",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <EvaluacionProvider>
          <SmoothScroll />
          {children}
          <EvaluacionModal />
          <ChatWidget />
          <SuscriptorPopup />
        </EvaluacionProvider>
      </body>
    </html>
  );
}
