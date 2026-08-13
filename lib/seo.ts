import type { Metadata } from "next";

export const SITE_URL = "https://www.crececonia.cl";
export const SITE_NAME = "CrececonIA";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  image = "/og-image.png",
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "es_CL",
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.svg"),
      email: "sergio@crececonia.cl",
      description:
        "IA aplicada con criterio: recursos prácticos, mentoría e implementación para profesionales y negocios.",
      areaServed: ["CL", "AR", "CO", "ES", "MX", "PE"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es-CL",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#professional-service`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "Mentoría e implementación de inteligencia artificial para profesionales y negocios con procesos concretos.",
      provider: { "@id": ORGANIZATION_ID },
      areaServed: ["CL", "AR", "CO", "ES", "MX", "PE"],
      serviceType: "Mentoría e implementación de inteligencia artificial",
    },
  ],
};

export function serviceJsonLd({
  name,
  description,
  path,
  minimumPrice,
  priceDescription,
}: {
  name: string;
  description: string;
  path: string;
  minimumPrice: number;
  priceDescription: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": ORGANIZATION_ID },
    areaServed: ["CL", "AR", "CO", "ES", "MX", "PE"],
    offers: {
      "@type": "Offer",
      priceCurrency: "CLP",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: minimumPrice,
        priceCurrency: "CLP",
        description: priceDescription,
      },
    },
  };
}
