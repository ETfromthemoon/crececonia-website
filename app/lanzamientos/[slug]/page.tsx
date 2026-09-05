import { notFound } from "next/navigation";
import Image from "next/image";
import { getCatalogEntry, isAdminPreviewKey } from "@/lib/ebook-catalog";
import { getLaunch, launchDefaultCta } from "@/lib/launches";

export const dynamic = "force-dynamic";
const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default async function LaunchPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string }> }) {
  const [{ slug }, { key }] = await Promise.all([params, searchParams]);
  const launch = await getLaunch(slug);
  if (!launch || (launch.status !== "published" && !isAdminPreviewKey(key))) notFound();
  const cta = launchDefaultCta(launch);
  const activeTier = launch.tiers.find((tier) => tier.status === "active");
  const date = launch.starts_at ? new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeStyle: "short", timeZone: launch.timezone }).format(new Date(launch.starts_at)) : "Fecha por anunciar";
  return <main className="launch-public"><section className="launch-public-hero"><div className="launch-public-wrap"><p>{launch.status !== "published" ? "Vista previa privada" : "Nuevo lanzamiento"}</p><h1>{launch.headline}</h1><div className="launch-public-meta"><span>{date}</span>{activeTier && <strong>{money(activeTier.amount_minor)}</strong>}</div><p className="launch-public-lead">{launch.description || "Una experiencia de Crece con IA diseñada para llevar una idea a resultados concretos."}</p>{cta ? <a className="launch-public-cta" href={cta}>{launch.cta_label}<span>→</span></a> : <span className="launch-public-pending">El acceso se habilitará cuando finalice la coordinación.</span>}</div></section>
    {launch.products.length > 0 && <section className="launch-public-products launch-public-wrap"><div><span>Incluye</span><h2>Recursos para avanzar.</h2></div><div>{launch.products.map((item) => { const entry = getCatalogEntry(item.resource); return <article key={item.id}>{entry?.coverSrc && <Image src={entry.coverSrc} alt={`Portada de ${item.title_snapshot}`} width={220} height={352}/>}<span>{item.role === "primary" ? "Principal" : "Incluido"}</span><h3>{item.title_snapshot}</h3>{entry && <p>{entry.storeProfile.outcome}</p>}</article>; })}</div></section>}
    <section className="launch-public-proof"><div className="launch-public-wrap"><span>Coordinación</span><h2>Cada detalle se valida antes de abrir.</h2><p>Publicaciones, mensajes directos y seguimiento se coordinan desde Zernio; anuncios, entrega y medición quedan sujetos a aprobación antes de activar.</p></div></section>
  </main>;
}
