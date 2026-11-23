import type { Metadata } from "next";
import RetiredServiceNotice from "@/components/RetiredServiceNotice";

export const metadata: Metadata = {
  title: "Protocolo BPI retirado | CrececonIA",
  description: "El Protocolo BPI ya no se ofrece. Conoce las rutas vigentes de aprendizaje, mentoría e implementación de IA.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <RetiredServiceNotice title="El Protocolo BPI ya no se ofrece." />;
}
