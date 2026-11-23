import { SERVICE_OFFERS } from "@/lib/service-offers";
import ServiceLanding from "@/components/ServiceLanding";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Implementación de IA para negocios | CrececonIA",
  description: `Agentes, automatizaciones y sistemas de IA para procesos repetitivos definidos. Requiere responsable y contexto real. ${SERVICE_OFFERS.implementacion.investment}.`,
  path: "/implementacion",
});

const jsonLd = serviceJsonLd({
  name: "Implementación de IA para negocios",
  description: "Diseño e implementación de agentes, automatizaciones y sistemas de IA para procesos de negocio concretos.",
  path: "/implementacion",
  minimumPrice: SERVICE_OFFERS.implementacion.minimumPrice,
  priceDescription: `${SERVICE_OFFERS.implementacion.investment}.`,
});

export default function Page() { return <><JsonLd data={jsonLd} /><ServiceLanding service="implementacion" /></>; }
