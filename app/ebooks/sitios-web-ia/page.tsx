import { redirect } from "next/navigation";

// El resource "ebook:sitios-web-ia" se reemplazó por
// "ebook:creacion-de-webs-con-ia" (scope real: Parte 1, landing + proyecto
// AppFlow) antes de tener compradores, así que no hay entregas que romper.
// Nota: quien haya dejado su email en la waitlist de este resource sigue
// registrado bajo "ebook:sitios-web-ia" en ebook_waitlist — al avisar el
// lanzamiento (paso manual, ver runbook en AGENTS.md) hay que exportar esa
// lista además de la de "ebook:creacion-de-webs-con-ia".
export default function SitiosWebIALegacyRedirect() {
  redirect("/ebook/creacion-de-webs-con-ia");
}
