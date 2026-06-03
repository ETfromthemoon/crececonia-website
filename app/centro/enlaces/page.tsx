import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import HubListing from "@/components/HubListing";
import { getHubItems } from "@/lib/hub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links curados — Centro de Conocimiento · CrececonIA",
  description:
    "Los mejores artículos, herramientas, videos y repositorios sobre IA para negocios, seleccionados por Crececonia.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentroEnlacesPage() {
  const items = (await getHubItems()).filter((it) => it.tipo === "enlace");
  return (
    <>
      <Navbar />
      <EmailPopup />
      <HubListing
        eyebrow="Links curados"
        titulo="Los mejores links sobre IA"
        descripcion="Artículos, herramientas, videos y repos seleccionados a mano. Todo lo que vale la pena leer."
        items={items}
        emptyLabel="Próximamente · Estamos cubrando los primeros links"
      />
      <Footer />
    </>
  );
}
