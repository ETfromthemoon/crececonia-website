import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import WorkshopCheckout from "@/components/WorkshopCheckout";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import {
  WORKSHOP_DATE_LABEL,
  WORKSHOP_END,
  WORKSHOP_INCLUDED,
  WORKSHOP_OUTCOME,
  WORKSHOP_PATH,
  WORKSHOP_PRICE,
  WORKSHOP_START,
  WORKSHOP_TITLE,
} from "@/lib/workshop-product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: `${WORKSHOP_TITLE} | CrececonIA`,
  description: `${WORKSHOP_OUTCOME} En vivo el ${WORKSHOP_DATE_LABEL.toLowerCase()} a las 17:00.`,
  path: WORKSHOP_PATH,
  image: "/og-image.png",
});

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: WORKSHOP_TITLE,
  description: WORKSHOP_OUTCOME,
  url: absoluteUrl(WORKSHOP_PATH),
  startDate: WORKSHOP_START,
  endDate: WORKSHOP_END,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  organizer: { "@type": "Organization", name: "CrececonIA", url: absoluteUrl("/") },
  offers: { "@type": "Offer", price: String(WORKSHOP_PRICE), priceCurrency: "CLP", availability: "https://schema.org/LimitedAvailability", url: absoluteUrl(`${WORKSHOP_PATH}#comprar`) },
};

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  return (
    <main className="workshop-page">
      <JsonLd data={eventJsonLd} />
      <header className="workshop-brand"><a href="/">Crececon<span>IA</span></a><span>Workshop / 06.09.2026</span></header>
      {success === "1" && <div className="workshop-success" role="status"><strong>Estamos verificando tu pago.</strong> La confirmación y el acceso personal llegarán a tu correo en unos instantes.</div>}

      <section className="workshop-hero">
        <div className="workshop-hero-copy">
          <p className="workshop-kicker"><i /> En vivo · {WORKSHOP_DATE_LABEL} · 17:00 h</p>
          <h1>IA aplicada.<br/><em>Sin relleno.</em></h1>
          <p className="workshop-lead">{WORKSHOP_OUTCOME}</p>
          <ul className="workshop-quick-value">
            <li>Clase en vivo</li><li>Grabación</li><li>2 ebooks</li><li>5 skills</li><li>1 mes en SKOOL</li>
          </ul>
          <a className="workshop-mobile-cta" href="#comprar">Ver precio vigente <span>↓</span></a>
        </div>
        <WorkshopCheckout />
      </section>

      <section className="workshop-value">
        <div className="workshop-section-index">01 / TU ENTRADA</div>
        <div>
          <h2>Todo queda contigo después del directo.</h2>
          <p>No dependes de tomar apuntes perfectos ni de estar disponible para volver a ejecutar lo aprendido.</p>
        </div>
        <ol>{WORKSHOP_INCLUDED.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
      </section>

      <section className="workshop-process">
        <div className="workshop-section-index">02 / CÓMO FUNCIONA</div>
        <div className="workshop-process-grid">
          <article><span>ANTES</span><h3>Reserva en menos de un minuto.</h3><p>Escribe tu correo, paga con Flow y recibe tu acceso personal.</p></article>
          <article><span>EN VIVO</span><h3>Construye con nosotros.</h3><p>Una sesión práctica, directa y enfocada en decisiones que puedes aplicar.</p></article>
          <article><span>DESPUÉS</span><h3>Repite a tu ritmo.</h3><p>Grabación, ebooks, skills y comunidad reunidos en una mini sala privada.</p></article>
        </div>
      </section>

      <section className="workshop-final">
        <p>Pocos cupos · acceso personal</p>
        <h2>Una tarde para avanzar.<br/>Materiales para seguir.</h2>
        <a href="#comprar">Quiero reservar mi entrada <span>↑</span></a>
      </section>
      <footer className="workshop-footer"><span>CrececonIA · Santiago, Chile</span><a href="mailto:sergio@crececonia.cl">¿Tienes una pregunta?</a></footer>
    </main>
  );
}
