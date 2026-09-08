import { getCatalogEntry } from "@/lib/ebook-catalog";
import { WORKSHOP_EBOOK_RESOURCES, WORKSHOP_SESSION_LABEL, WORKSHOP_TITLE } from "@/lib/workshop-product";
import type { WorkshopAssetStatus } from "@/lib/workshop-asset-storage";

type Props = { token: string; flowToken: string; recordingUrl: string; skoolUrl: string; assetStatus: WorkshopAssetStatus; supportEmail: string };

export default function WorkshopRoom({ token, flowToken, recordingUrl, skoolUrl, assetStatus, supportEmail }: Props) {
  const material = (asset: "skills" | "slides" | "handout") => `/api/workshop/material?token=${encodeURIComponent(token)}&asset=${asset}`;
  const ebook = (resource: string, format: "movil" | "a4") => `/api/ebook/download?token=${encodeURIComponent(flowToken)}&resource=${encodeURIComponent(resource)}&format=${format}`;
  return <main className="workshop-room">
    <header><a href="/">Crececon<span>IA</span></a><small>Sala privada</small></header>
    <section className="workshop-room-hero">
      <p>Tu acceso · {WORKSHOP_SESSION_LABEL}</p>
      <h1>{WORKSHOP_TITLE}</h1>
      <div className="workshop-room-actions">
        {recordingUrl ? <a className="is-primary" href={recordingUrl} target="_blank" rel="noreferrer">Ver la grabación de la clase ↗</a> : <span>La grabación se publicará próximamente.</span>}
      </div>
    </section>
    <section className="workshop-room-grid">
      <article><span>01</span><h2>Tus dos ebooks</h2><p>Cada libro está disponible en versión móvil y A4 para leer o imprimir. Los enlaces también llegaron a tu correo.</p><div className="workshop-room-books">{WORKSHOP_EBOOK_RESOURCES.map((resource) => <div className="workshop-room-book" key={resource}><strong>{getCatalogEntry(resource)?.title ?? resource}</strong><div><a href={ebook(resource, "movil")}>Versión móvil ↓</a><a href={ebook(resource, "a4")}>Versión A4 ↓</a></div></div>)}</div></article>
      <article><span>02</span><h2>Slides y hoja de trabajo</h2><p>Revisa la presentación completa y descarga la hoja práctica para aplicar el método.</p><div className="workshop-room-links">{assetStatus.slides ? <a href={material("slides")} target="_blank" rel="noreferrer">Ver slides ↗</a> : <span className="is-pending">Slides en preparación.</span>}{assetStatus.handout ? <a href={material("handout")}>Descargar hoja de trabajo ↓</a> : <span className="is-pending">Hoja de trabajo en preparación.</span>}</div></article>
      <article><span>03</span><h2>Pack de cinco skills</h2><p>Un solo archivo ZIP para instalar, adaptar y reutilizar después de la sesión.</p>{assetStatus.skills ? <a href={material("skills")}>Descargar pack .zip ↓</a> : <span className="is-pending">Pack en preparación.</span>}</article>
      <article><span>04</span><h2>Comunidad SKOOL</h2><p>Tu entrada incluye un mes gratuito en la nueva comunidad de CrececonIA.</p>{skoolUrl ? <a href={skoolUrl} target="_blank" rel="noreferrer">Activar acceso ↗</a> : <span className="is-pending">Pendiente de lanzamiento. La invitación aparecerá aquí y también se enviará por correo a todas las personas.</span>}</article>
    </section>
    <footer>¿Necesitas ayuda? <a href={`mailto:${supportEmail}`}>{supportEmail}</a></footer>
  </main>;
}
