import { getCatalogEntry } from "@/lib/ebook-catalog";
import { WORKSHOP_EBOOK_RESOURCES, WORKSHOP_SESSION_LABEL, WORKSHOP_TITLE } from "@/lib/workshop-product";

type Props = { token: string; flowToken: string; sessionUrl: string; recordingUrl: string; skoolUrl: string; skillsReady: boolean; supportEmail: string };

export default function WorkshopRoom({ token, flowToken, sessionUrl, recordingUrl, skoolUrl, skillsReady, supportEmail }: Props) {
  return <main className="workshop-room">
    <header><a href="/">Crececon<span>IA</span></a><small>Sala privada</small></header>
    <section className="workshop-room-hero">
      <p>Tu acceso · {WORKSHOP_SESSION_LABEL}</p>
      <h1>{WORKSHOP_TITLE}</h1>
      <div className="workshop-room-actions">
        {sessionUrl ? <a className="is-primary" href={sessionUrl} target="_blank" rel="noreferrer">Entrar a la clase en vivo ↗</a> : <span>El enlace en vivo aparecerá aquí antes del workshop.</span>}
        {recordingUrl ? <a href={recordingUrl} target="_blank" rel="noreferrer">Ver grabación ↗</a> : <span>La grabación se publicará después de la clase.</span>}
      </div>
    </section>
    <section className="workshop-room-grid">
      <article><span>01</span><h2>Tus dos ebooks</h2><p>Descarga cada libro en formato móvil. Los enlaces también llegaron a tu correo.</p><div className="workshop-room-links">{WORKSHOP_EBOOK_RESOURCES.map((resource) => <a key={resource} href={`/api/ebook/download?token=${encodeURIComponent(flowToken)}&resource=${encodeURIComponent(resource)}`}>{getCatalogEntry(resource)?.title ?? resource} ↓</a>)}</div></article>
      <article><span>02</span><h2>Pack de cinco skills</h2><p>Un solo archivo ZIP para instalar, adaptar y reutilizar después de la sesión.</p>{skillsReady ? <a href={`/api/workshop/skills?token=${encodeURIComponent(token)}`}>Descargar pack .zip ↓</a> : <span className="is-pending">Disponible al finalizar el workshop.</span>}</article>
      <article><span>03</span><h2>Comunidad SKOOL</h2><p>Tu entrada incluye un mes gratuito en la nueva comunidad de CrececonIA.</p>{skoolUrl ? <a href={skoolUrl} target="_blank" rel="noreferrer">Activar acceso ↗</a> : <span className="is-pending">La invitación aparecerá aquí durante el lanzamiento.</span>}</article>
    </section>
    <footer>¿Necesitas ayuda? <a href={`mailto:${supportEmail}`}>{supportEmail}</a></footer>
  </main>;
}
