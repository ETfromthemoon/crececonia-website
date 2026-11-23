import { SERVICE_OFFERS } from "@/lib/service-offers";
import ServiceLanding from "@/components/ServiceLanding";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Mentoría de IA 1:1 | CrececonIA",
  description: `Mentoría personalizada para profesionales y dueños de negocio con un objetivo de IA concreto. Requiere trabajo semanal. ${SERVICE_OFFERS.mentoria.investment}.`,
  path: "/mentoria",
});

const jsonLd = serviceJsonLd({
  name: "Mentoría de IA 1:1",
  description: "Mentoría personalizada para aplicar IA al trabajo o negocio: objetivo a 90 días y ciclo de acompañamiento acordado en la propuesta.",
  path: "/mentoria",
  minimumPrice: SERVICE_OFFERS.mentoria.minimumPrice,
  priceDescription: `${SERVICE_OFFERS.mentoria.investment}.`,
});

export default function Page() { return <><JsonLd data={jsonLd} /><ServiceLanding service="mentoria" /></>; }
