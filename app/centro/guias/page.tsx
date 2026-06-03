import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import HubListing from "@/components/HubListing";
import { getHubItems } from "@/lib/hub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guías — Centro de Conocimiento · CrececonIA",
  description:
    "Todas las guías de Crececonia: cómo sacarle el jugo a la IA, herramientas, prompts y procesos. Directo al grano.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentroGuiasPage() {
  const items = (await getHubItems()).filter((it) => it.tipo === "guia");
  return (
    <>
      <Navbar />
      <EmailPopup />
      <HubListing
        eyebrow="Guías"
        titulo="Todas las guías"
        descripcion="Guías prácticas para aplicar IA en tu negocio. Directo al grano, sin vueltas."
        items={items}
        emptyLabel="Próximamente · Estamos preparando las primeras guías"
      />
      <Footer />
    </>
  );
}
