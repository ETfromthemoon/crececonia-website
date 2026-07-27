import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { EvaluacionProvider } from "@/components/EvaluacionProvider";
import EvaluacionModal from "@/components/EvaluacionModal";
import ChatWidget from "@/components/ChatWidget";
import SuscriptorPopup from "@/components/SuscriptorPopup";
import EbookPopup from "@/components/EbookPopup";

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

const sourceSerif4 = Source_Serif_4({
  variable: "--font-serif-monad",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://crececonia.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CrececonIA — Un agente IA para tu negocio, listo en 48 horas.",
  description:
    "Implementamos agentes IA para empresas latinoamericanas. Eliges el canal, cargas lo que sabe de tu negocio y te lo entregamos funcionando. Desde USD 297/mes.",
  authors: [{ name: "CrececonIA" }],
  openGraph: {
    title: "CrececonIA — Un agente IA para tu negocio, listo en 48 horas.",
    description:
      "Implementamos agentes IA para empresas latinoamericanas. WhatsApp, web, Instagram. Setup en 48h. Desde USD 297/mes.",
    url: SITE_URL,
    siteName: "CrececonIA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrececonIA — Agentes IA para empresas, listos en 48h",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CrececonIA — Un agente IA para tu negocio, listo en 48 horas.",
    description:
      "Implementamos agentes IA para empresas latinoamericanas. WhatsApp, web, Instagram. Desde USD 297/mes.",
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
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
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
    "Agencia de agentes IA para empresas latinoamericanas. Implementamos asistentes IA en WhatsApp, web e Instagram. Desde USD 297/mes. Setup en 48 horas.",
  areaServed: ["CL", "ES", "MX", "CO", "AR", "PE"],
  serviceType: "Implementación de Agentes de Inteligencia Artificial",
  slogan: "Un agente IA para tu negocio, listo en 48 horas.",
  offers: [
    {
      "@type": "Offer",
      name: "Agente IA mensual",
      description:
        "Agente IA implementado en WhatsApp, web o Instagram. Incluye setup, integración, capacitación y soporte continuo.",
      price: "297",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Setup inicial",
      description:
        "Personalización, integración con tus canales y carga de conocimiento de tu negocio. Entrega en 48 horas.",
      price: "200",
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
      data-theme="light"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable} antialiased`}
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
          <EbookPopup />
        </EvaluacionProvider>
      </body>
    </html>
  );
}
