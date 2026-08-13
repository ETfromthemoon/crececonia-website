import ServiceLanding from "@/components/ServiceLanding";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Mentoría de IA 1:1 | CrececonIA",
  description: "Mentoría personalizada para profesionales y dueños de negocio con un objetivo de IA concreto. Requiere trabajo semanal e inversión desde $400.000 CLP mensuales.",
  path: "/mentoria",
});

const jsonLd = serviceJsonLd({
  name: "Mentoría de IA 1:1",
  description: "Mentoría personalizada para aplicar IA a un objetivo concreto de trabajo o negocio durante los próximos 90 días.",
  path: "/mentoria",
  minimumPrice: 400000,
  priceDescription: "Desde $400.000 CLP mensuales.",
});

export default function Page() { return <><JsonLd data={jsonLd} /><ServiceLanding service="mentoria" /></>; }
