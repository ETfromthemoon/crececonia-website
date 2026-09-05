import { notFound } from "next/navigation";
import Link from "next/link";
import LaunchCreateForm from "@/components/admin/LaunchCreateForm";
import { getActiveCatalogEntries } from "@/lib/ebook-catalog";
import { listLaunches } from "@/lib/launches";

export const dynamic = "force-dynamic";
const LABELS: Record<string,string> = { draft:"Borrador",planning:"Planificación",ready:"Listo",published:"Publicado",completed:"Completado",archived:"Archivado" };

export default async function LaunchesAdminPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) notFound();
  const launches = await listLaunches();
  const products = getActiveCatalogEntries().map((entry) => ({ resource: entry.resource, title: entry.title, coverSrc: entry.coverSrc, price: entry.tierPrices.regular }));
  const blocked = launches.filter((launch) => launch.blocked_count > 0).length;
  return <main className="launch-admin"><header className="launch-admin-head"><div><p>Centro de lanzamientos</p><h1>Una plantilla para cada campaña.</h1><span>Planifica, coordina con CERNEO y publica sin tocar el workshop vigente.</span></div><a href="/ebooks" target="_blank">Ver tienda ↗</a></header>
    <section className="launch-summary"><article><span>Total</span><b>{launches.length}</b></article><article><span>En vivo</span><b>{launches.filter((item)=>item.status==="published").length}</b></article><article><span>Listos</span><b>{launches.filter((item)=>item.status==="ready").length}</b></article><article><span>Bloqueados</span><b>{blocked}</b></article></section>
    <section className="launch-list"><div className="launch-section-head"><span>Portafolio</span><h2>Lanzamientos y estado real.</h2></div>{launches.length === 0 ? <p className="launch-empty">Todavía no hay lanzamientos en esta plantilla. Crea el primero abajo.</p> : <div>{launches.map((launch)=><Link className="launch-list-card" key={launch.id} href={`/admin/lanzamientos/${launch.slug}?key=${encodeURIComponent(key)}`}><span data-status={launch.status}>{LABELS[launch.status]}</span><div><h3>{launch.name}</h3><p>{launch.starts_at ? new Date(launch.starts_at).toLocaleString("es-CL") : "Fecha por definir"} · CERNEO {launch.cerneo_status === "pending" ? "pendiente" : "vinculado"}</p></div><b>{launch.task_ready}/{launch.task_total} ✓</b><i>→</i></Link>)}</div>}</section>
    <LaunchCreateForm adminKey={key} products={products}/>
  </main>;
}
