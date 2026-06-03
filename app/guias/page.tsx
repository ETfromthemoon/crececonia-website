import { permanentRedirect } from "next/navigation";

// El catálogo de guías ahora vive dentro del Centro de Conocimiento.
// Redirección permanente (308) para mantener links/SEO existentes.
export default function GuiasIndex() {
  permanentRedirect("/centro/guias");
}
