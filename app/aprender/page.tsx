import ServiceLanding from "@/components/ServiceLanding";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Aprender IA por tu cuenta | CrececonIA",
  description: "Ebooks, guías y skills prácticas para aplicar IA por tu cuenta, sin llamada previa ni acompañamiento 1:1.",
  path: "/aprender",
});
export default function Page() { return <ServiceLanding service="aprender" />; }
