import { requireAdminSession } from "@/lib/admin-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import LaunchManager from "@/components/admin/LaunchManager";
import { getLaunch } from "@/lib/launches";

export const dynamic = "force-dynamic";
const LABELS: Record<string,string> = { draft:"Borrador",planning:"Planificación",ready:"Listo",published:"Publicado",completed:"Completado",archived:"Archivado" };
export default async function LaunchAdminDetail({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  await requireAdminSession();
  const launch = await getLaunch(identifier); if (!launch) notFound();
  return <main className="launch-admin"><header className="launch-admin-head"><div><p>{LABELS[launch.status]} · {launch.launch_type.replace("_"," ")}</p><h1>{launch.name}</h1><span>{launch.headline}</span></div><nav><Link href={`/admin/lanzamientos`}>← Todos</Link><a href={`/lanzamientos/${launch.slug}`} target="_blank">Vista previa ↗</a></nav></header><LaunchManager launch={JSON.parse(JSON.stringify(launch))}/></main>;
}
