import ServiceLanding from "@/components/ServiceLanding";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Implementación de IA para negocios | CrececonIA",
  description: "Agentes, automatizaciones y sistemas de IA para procesos repetitivos definidos. Requiere responsable, contexto real e inversión desde $500.000 CLP.",
  path: "/implementacion",
});

const jsonLd = serviceJsonLd({
  name: "Implementación de IA para negocios",
  description: "Diseño e implementación de agentes, automatizaciones y sistemas de IA para procesos de negocio concretos.",
  path: "/implementacion",
  minimumPrice: 500000,
  priceDescription: "Desde $500.000 CLP, más mantención desde $100.000 CLP mensuales.",
});

export default function Page() { return <><JsonLd data={jsonLd} /><ServiceLanding service="implementacion" /></>; }
