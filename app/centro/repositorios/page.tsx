import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HubListing from "@/components/HubListing";
import { getHubItems } from "@/lib/hub";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Repositorios — Centro de Conocimiento · CrececonIA",
  description:
    "Explora los proyectos y herramientas de código abierto de CrececonIA.",
  path: "/centro/repositorios",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentroRepositoriosPage() {
  const items = (await getHubItems()).filter((item) => item.tipo === "repositorio");
  return (
    <>
      <Navbar />
      <HubListing
        eyebrow="Código abierto"
        titulo="Repositorios de CrececonIA"
        descripcion="Proyectos y herramientas que compartimos para que puedas explorarlos y usarlos."
        items={items}
        emptyLabel="Próximamente · Estamos preparando los primeros repositorios"
      />
      <Footer />
    </>
  );
}
