import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import HubListing from "@/components/HubListing";
import { getHubItems } from "@/lib/hub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills para Claude Code — Centro de Conocimiento · CrececonIA",
  description:
    "Todas las skills de Crececonia para Claude Code. Descarga, copia y empieza a usarlas en segundos.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentroSkillsPage() {
  const items = (await getHubItems()).filter((it) => it.tipo === "skill");
  return (
    <>
      <Navbar />
      <EmailPopup />
      <HubListing
        eyebrow="Claude Code Skills"
        titulo="Todas las skills"
        descripcion="Habilidades listas para instalar en tu entorno de Claude Code. Descarga y empieza en segundos."
        items={items}
        emptyLabel="Próximamente · Estamos preparando las primeras skills"
      />
      <Footer />
    </>
  );
}
