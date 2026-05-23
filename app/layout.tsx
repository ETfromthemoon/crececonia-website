import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { EvaluacionProvider } from "@/components/EvaluacionProvider";
import EvaluacionModal from "@/components/EvaluacionModal";

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
  title: "CrececonIA — Consultoría de IA para empresas medianas y grandes",
  description:
    "Diagnóstico gratuito de 30 minutos. Identificamos los 3 procesos de mayor impacto en tu empresa e instalamos el sistema para que tu equipo lo use desde el día 1.",
  keywords: [
    "consultoría IA empresas",
    "implementación inteligencia artificial",
    "automatización procesos empresariales",
    "diagnóstico IA gratuito",
    "IA para PYMES",
    "adopción IA Chile",
    "consultor inteligencia artificial",
  ],
  authors: [{ name: "CrececonIA" }],
  openGraph: {
    title: "CrececonIA — Consultoría de IA para empresas medianas y grandes",
    description:
      "Diagnóstico gratuito de 30 minutos. Identificamos los 3 procesos de mayor impacto en tu empresa e instalamos el sistema para que tu equipo lo use desde el día 1.",
    url: SITE_URL,
    siteName: "CrececonIA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrececonIA — Consultoría de IA para empresas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CrececonIA — Consultoría de IA para empresas",
    description:
      "Diagnóstico gratuito de 30 minutos. Identificamos los 3 procesos de mayor impacto e instalamos el sistema para que tu equipo lo use desde el día 1.",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CrececonIA",
  url: SITE_URL,
  description:
    "Consultoría de inteligencia artificial para empresas medianas y grandes. Diagnóstico gratuito + implementación con resultados medibles.",
  areaServed: ["CL", "ES", "MX", "CO", "AR", "PE"],
  serviceType: "Consultoría de Inteligencia Artificial",
  offers: [
    {
      "@type": "Offer",
      name: "Diagnóstico gratuito",
      description: "Sesión de 30 minutos sin costo para identificar oportunidades de IA.",
      price: "0",
      priceCurrency: "CLP",
    },
    {
      "@type": "Offer",
      name: "Auditoría de IA",
      description: "Mapeo profundo de procesos y hoja de ruta priorizada por ROI. 2 semanas.",
    },
    {
      "@type": "Offer",
      name: "Implementación completa",
      description: "Instalación, integración, capacitación y medición de adopción. 6–8 semanas.",
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
        </EvaluacionProvider>
      </body>
    </html>
  );
}
