import { redirect } from "next/navigation";

// Este libro pasó de "próximamente" a la venta real — su página vive ahora
// en /ebook/agentes-de-ia (patrón singular, igual que el resto de los libros
// con venta activa). Se deja este redirect por si quedó algún link viejo
// compartido o indexado apuntando acá.
export default function AgentesDeIALegacyRedirect() {
  redirect("/ebook/agentes-de-ia");
}
