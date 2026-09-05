import { notFound } from "next/navigation";
import Link from "next/link";
import LaunchManager from "@/components/admin/LaunchManager";
import { getLaunch } from "@/lib/launches";

export const dynamic = "force-dynamic";
const LABELS: Record<string,string> = { draft:"Borrador",planning:"Planificación",ready:"Listo",published:"Publicado",completed:"Completado",archived:"Archivado" };
export default async function LaunchAdminDetail({ params, searchParams }: { params: Promise<{ identifier: string }>; searchParams: Promise<{ key?: string }> }) {
  const [{ identifier }, { key }] = await Promise.all([params, searchParams]);
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) notFound();
  const launch = await getLaunch(identifier); if (!launch) notFound();
  return <main className="launch-admin"><header className="launch-admin-head"><div><p>{LABELS[launch.status]} · {launch.launch_type.replace("_"," ")}</p><h1>{launch.name}</h1><span>{launch.headline}</span></div><nav><Link href={`/admin/lanzamientos?key=${encodeURIComponent(key)}`}>← Todos</Link><a href={`/lanzamientos/${launch.slug}?key=${encodeURIComponent(key)}`} target="_blank">Vista previa ↗</a></nav></header><LaunchManager launch={JSON.parse(JSON.stringify(launch))} adminKey={key}/></main>;
}
