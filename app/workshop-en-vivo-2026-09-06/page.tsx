import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import WorkshopCheckout from "@/components/WorkshopCheckout";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import {
  WORKSHOP_DATE_LABEL,
  WORKSHOP_END,
  WORKSHOP_INCLUDED,
  WORKSHOP_RECORDING_INCLUDED,
  WORKSHOP_OUTCOME,
  WORKSHOP_PATH,
  WORKSHOP_PRICE,
  WORKSHOP_START,
  WORKSHOP_TITLE,
  isWorkshopRecordingOnSale,
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
  const isRecording = isWorkshopRecordingOnSale();
  const included = isRecording ? WORKSHOP_RECORDING_INCLUDED : WORKSHOP_INCLUDED;
  return (
    <main className="workshop-page">
      <JsonLd data={eventJsonLd} />
      <header className="workshop-brand"><a href="/">Crececon<span>IA</span></a><span>Workshop / 06.09.2026</span></header>
      {success === "1" && <div className="workshop-success" role="status"><strong>Estamos verificando tu pago.</strong> La confirmación y el acceso personal llegarán a tu correo en unos instantes.</div>}

      <section className="workshop-hero">
        <div className="workshop-hero-copy">
          <p className="workshop-kicker"><i /> {isRecording ? "Clase grabada · acceso inmediato" : `En vivo · ${WORKSHOP_DATE_LABEL} · 17:00 h`}</p>
          <h1>Claude aplicado.<br/><em>Hazlo sistema.</em></h1>
          <p className="workshop-lead">{WORKSHOP_OUTCOME}</p>
          <p className="workshop-decision-copy">{isRecording ? "Aprende a tu ritmo con la grabación, recursos descargables y una sala privada para tenerlo todo a mano." : "Sal de la clase con una forma concreta de trabajar con IA, recursos para repetirla y una sala privada para tenerlo todo a mano."}</p>
          <ul className="workshop-quick-value">
            {isRecording ? <li>Clase grabada</li> : <><li>Clase en vivo</li><li>Grabación</li></>}<li>2 ebooks</li><li>5 skills</li><li>1 mes en SKOOL</li>
          </ul>
          <a className="workshop-mobile-cta" href="#comprar">Ver precio vigente <span>↓</span></a>
        </div>
        <WorkshopCheckout />
      </section>

      <section className="workshop-final">
        <p>{isRecording ? "Acceso inmediato · pago único" : "Pocos cupos · acceso personal"}</p>
        <h2>Menos que una salida.<br/><em>Una habilidad que puede ahorrarte horas y abrir nuevas fuentes de ingreso.</em></h2>
        <a href="#comprar">{isRecording ? "Comprar acceso completo" : "Reservar al precio vigente"} <span>↑</span></a>
      </section>

      <section className="workshop-value">
        <div className="workshop-section-index">01 / TU ENTRADA</div>
        <div>
          <h2>{isRecording ? "Todo el workshop, disponible cuando lo necesites." : "Todo queda contigo después del directo."}</h2>
          <p>{isRecording ? "Entra a la sala privada, mira la clase a tu ritmo y vuelve a los recursos cada vez que quieras aplicar lo aprendido." : "No dependes de tomar apuntes perfectos ni de estar disponible para volver a ejecutar lo aprendido."}</p>
        </div>
        <ol>{included.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
      </section>

      <section className="workshop-process">
        <div className="workshop-section-index">02 / ¿ES PARA TI?</div>
        <div className="workshop-fit-intro">
          <h2>Compra con claridad, no por impulso.</h2>
          <p>Este workshop funciona mejor cuando vienes con ganas de aplicar, no sólo de mirar.</p>
        </div>
        <div className="workshop-fit-grid">
          <article className="is-for">
            <span>ES PARA TI SI</span>
            <ul>
              <li>Usas herramientas de IA, pero todavía de forma aislada o improvisada.</li>
              <li>Estás recién comenzando con IA o tienes curiosidad por aprender Claude rápidamente.</li>
              <li>Quieres transformar tareas repetitivas en un método que puedas reutilizar.</li>
              <li>Prefieres aprender haciendo y quedarte con materiales concretos.</li>
              <li>Eres profesional, emprendedor o lideras procesos en un equipo.</li>
            </ul>
          </article>
          <article className="is-not-for">
            <span>NO ES PARA TI SI</span>
            <ul>
              <li>Buscas una charla pasiva, sólo teórica o llena de tendencias.</li>
              <li>Esperas que alguien implemente todo por ti después de la clase.</li>
              <li>No quieres probar herramientas ni ajustar tu forma de trabajar.</li>
            </ul>
          </article>
        </div>
        <a className="workshop-inline-cta" href="#comprar">Sí, quiero aplicarlo <span>→</span></a>
      </section>

      <section className="workshop-process">
        <div className="workshop-section-index">03 / CÓMO FUNCIONA</div>
        <div className="workshop-process-grid">
          <article><span>ANTES</span><h3>Reserva en menos de un minuto.</h3><p>Escribe tu correo, paga con Flow y recibe tu acceso personal.</p></article>
          <article><span>{isRecording ? "APRENDE" : "EN VIVO"}</span><h3>{isRecording ? "Avanza a tu ritmo." : "Construye con nosotros."}</h3><p>{isRecording ? "Reproduce la clase, pausa y aplica cada decisión en tu propio contexto." : "Una sesión práctica, directa y enfocada en decisiones que puedes aplicar."}</p></article>
          <article><span>DESPUÉS</span><h3>Repite a tu ritmo.</h3><p>Grabación, ebooks, skills y comunidad reunidos en una mini sala privada.</p></article>
        </div>
      </section>

      <section className="workshop-faq">
        <div className="workshop-section-index">04 / PREGUNTAS FRECUENTES</div>
        <div className="workshop-faq-content">
          <div>
            <h2>Lo importante, antes de pagar.</h2>
            <p>Sin letra pequeña ni pasos innecesarios.</p>
          </div>
          <div className="workshop-faq-list">
            <details>
              <summary>{isRecording ? "¿Por cuánto tiempo puedo ver la clase?" : "¿Qué pasa si no puedo asistir en vivo?"}<b>+</b></summary>
              <p>{isRecording ? "Tu acceso personal queda disponible en la sala privada para que puedas volver a la grabación y los materiales cuando lo necesites." : "La clase quedará grabada en tu sala privada para que puedas verla después y volver a consultarla."}</p>
            </details>
            <details>
              <summary>¿Cuándo recibo los ebooks y el acceso?<b>+</b></summary>
              <p>Al confirmarse el pago recibirás por correo tu acceso personal. Ahí reuniremos los ebooks y la información del workshop.</p>
            </details>
            <details>
              <summary>¿Cuándo se entrega el pack de cinco skills?<b>+</b></summary>
              <p>El archivo ZIP se habilitará al finalizar el workshop, dentro de la misma sala privada.</p>
            </details>
            <details>
              <summary>¿Necesito conocimientos técnicos avanzados?<b>+</b></summary>
              <p>No. La sesión está pensada para aplicar IA al trabajo real. Lo más útil es llegar con una tarea o proceso que quieras mejorar.</p>
            </details>
            <details>
              <summary>¿El pago es seguro?<b>+</b></summary>
              <p>Sí. El pago se procesa mediante Flow y CrececonIA no almacena los datos de tu tarjeta.</p>
            </details>
          </div>
        </div>
      </section>

      <footer className="workshop-footer"><span>CrececonIA · Santiago, Chile</span><a href="mailto:sergio@crececonia.cl">¿Tienes una pregunta?</a></footer>
    </main>
  );
}
