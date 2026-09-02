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

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ success?: string; meta_test?: string }> }) {
  const { success, meta_test: metaTest } = await searchParams;
  const isRecording = isWorkshopRecordingOnSale();
  const included = isRecording ? WORKSHOP_RECORDING_INCLUDED : WORKSHOP_INCLUDED;
  return (
    <main className="workshop-page">
      <JsonLd data={eventJsonLd} />
      <header className="workshop-brand">
        <a href="/">Crececon<span>IA</span></a>
        <div className="workshop-brand-actions"><span>Dom. 06.09 · 17:00 h</span><a href="#comprar">Reservar cupo</a></div>
      </header>
      {success === "1" && <div className="workshop-success" role="status"><strong>Estamos verificando tu pago.</strong> La confirmación y el acceso personal llegarán a tu correo en unos instantes.</div>}

      <section className="workshop-hero">
        <div className="workshop-hero-copy">
          <p className="workshop-kicker"><i /> {isRecording ? "Clase grabada · acceso inmediato" : `En vivo · ${WORKSHOP_DATE_LABEL} · 17:00 h`}</p>
          <h1>Claude e IA.<br/><em>Desde cero.</em></h1>
          <p className="workshop-lead">{isRecording ? "Aprende a usar Claude Chat, Claude Cowork y Claude Code mientras ves cómo se construyen una página web y un CRM desde cero." : "En una tarde aprenderás a usar Claude Chat, Claude Cowork y Claude Code mientras construimos una página web y un CRM en vivo."}</p>
          <p className="workshop-decision-copy">Una clase para principiantes, práctica y sin requisitos técnicos. Saldrás entendiendo qué herramienta usar, cómo pedirle mejores resultados y cómo pasar de una idea a algo funcionando.</p>
          <ul className="workshop-quick-value">
            <li>Claude Chat</li><li>Claude Cowork</li><li>Claude Code</li><li>Web + CRM</li>{!isRecording && <li>Máx. 3 horas</li>}
          </ul>
          <a className="workshop-mobile-cta" href="#comprar">Ver precio y reservar <span>↓</span></a>
        </div>
        <WorkshopCheckout showTestDiscount={metaTest === "1"} />
      </section>

      <section id="programa" className="workshop-outcomes">
        <div className="workshop-section-index">01 / LO QUE HARÁS</div>
        <div className="workshop-outcomes-intro">
          <h2>No vienes solo a mirar. Vienes a ver cómo se construye.</h2>
          <p>Recorreremos las tres formas de trabajar con Claude y las conectaremos en un flujo real, explicado paso a paso.</p>
        </div>
        <div className="workshop-tools-grid">
          <article><span>01</span><h3>Claude Chat</h3><p>Para pensar, investigar, redactar y convertir una necesidad difusa en instrucciones claras.</p></article>
          <article><span>02</span><h3>Claude Cowork</h3><p>Para trabajar con archivos, organizar información y avanzar tareas completas con contexto.</p></article>
          <article><span>03</span><h3>Claude Code</h3><p>Para construir y automatizar con lenguaje natural, incluso si no vienes del mundo técnico.</p></article>
        </div>
        <div className="workshop-build-grid">
          <article><span>CONSTRUCCIÓN EN VIVO 01</span><h3>Una página web funcional</h3><p>De la idea y el contenido a una página publicada, tomando decisiones reales frente a ti.</p></article>
          <article><span>CONSTRUCCIÓN EN VIVO 02</span><h3>Un CRM para ordenar clientes</h3><p>Crearemos una herramienta práctica para registrar, organizar y dar seguimiento a oportunidades.</p></article>
        </div>
      </section>

      <section id="incluye" className="workshop-value">
        <div className="workshop-section-index">02 / TODO LO QUE RECIBES</div>
        <div>
          <h2>{isRecording ? "La clase y los recursos quedan contigo." : "El directo termina. El aprendizaje se queda contigo."}</h2>
          <p>{isRecording ? "Accede a la sala privada, mira la clase a tu ritmo y vuelve a los materiales cuando quieras aplicar lo aprendido." : "Recibirás una sala privada con la grabación y materiales para repetir el método después del workshop."}</p>
        </div>
        <ol>{included.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
      </section>

      <section className="workshop-process workshop-fit">
        <div className="workshop-section-index">03 / ¿ES PARA TI?</div>
        <div className="workshop-fit-intro">
          <h2>Diseñado para empezar sin sentirte atrás.</h2>
          <p>No necesitas saber programar ni haber usado Claude antes. Solo trae una tarea, idea o proceso que te gustaría mejorar.</p>
        </div>
        <ul className="workshop-fit-list">
          <li><strong>Estás comenzando</strong><span>y quieres una explicación clara, sin jerga ni saltos.</span></li>
          <li><strong>Ya pruebas herramientas de IA</strong><span>pero todavía trabajas de forma aislada o improvisada.</span></li>
          <li><strong>Eres profesional o emprendedor</strong><span>y quieres ahorrar tiempo o crear nuevas soluciones con IA.</span></li>
        </ul>
        <a className="workshop-inline-cta" href="#comprar">Quiero reservar mi cupo <span>↑</span></a>
      </section>

      <section className="workshop-process">
        <div className="workshop-section-index">04 / CÓMO FUNCIONA</div>
        <div className="workshop-process-grid">
          <article><span>01 · RESERVA</span><h3>Inscríbete en un minuto.</h3><p>Ingresa tu correo, paga de forma segura con Flow y recibe tu acceso personal.</p></article>
          <article><span>02 · {isRecording ? "APRENDE" : "CONECTA"}</span><h3>{isRecording ? "Avanza a tu ritmo." : "Entra este domingo."}</h3><p>{isRecording ? "Reproduce, pausa y aplica cada decisión en tu propio contexto." : "Conéctate a las 17:00 h. La sesión dura un máximo de tres horas."}</p></article>
          <article><span>03 · APLICA</span><h3>Vuelve cuando quieras.</h3><p>La grabación, los ebooks, las skills y la comunidad quedan reunidos en tu sala privada.</p></article>
        </div>
      </section>

      <section className="workshop-faq">
        <div className="workshop-section-index">05 / PREGUNTAS FRECUENTES</div>
        <div className="workshop-faq-content">
          <div>
            <h2>Lo importante, antes de pagar.</h2>
            <p>Sin letra pequeña ni pasos innecesarios.</p>
          </div>
          <div className="workshop-faq-list">
            <details>
              <summary>¿Qué versiones de Claude veremos?<b>+</b></summary>
              <p>Trabajaremos con Claude Chat, Claude Cowork y Claude Code. Verás para qué sirve cada uno y cómo combinarlos mientras construimos una página web y un CRM en vivo.</p>
            </details>
            <details>
              <summary>{isRecording ? "¿Por cuánto tiempo puedo ver la clase?" : "¿Qué pasa si no puedo asistir en vivo?"}<b>+</b></summary>
              <p>{isRecording ? "Tu acceso personal queda disponible en la sala privada para que puedas volver a la grabación y los materiales cuando lo necesites." : "La clase quedará grabada en tu sala privada para que puedas verla después y volver a consultarla."}</p>
            </details>
            <details>
              <summary>¿Cuándo recibo el acceso y los materiales?<b>+</b></summary>
              <p>Al confirmarse el pago recibirás por correo tu acceso personal y los ebooks. El pack de cinco skills se habilitará al finalizar el workshop dentro de la misma sala.</p>
            </details>
            <details>
              <summary>¿Necesito saber programar?<b>+</b></summary>
              <p>No. Partiremos desde cero y explicaremos cada decisión en lenguaje simple. Lo más útil es llegar con una tarea, idea o proceso que quieras mejorar.</p>
            </details>
            <details>
              <summary>¿El pago es seguro?<b>+</b></summary>
              <p>Sí. El pago se procesa mediante Flow y CrececonIA no almacena los datos de tu tarjeta.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="workshop-final">
        <p>{isRecording ? "Acceso inmediato · pago único" : `${WORKSHOP_DATE_LABEL} · 17:00 h`}</p>
        <h2>{isRecording ? "Mira el proceso completo y conviértelo en tu forma de trabajar." : <>Este domingo puedes dejar de probar IA al azar y empezar a <em>construir con ella.</em></>}</h2>
        <a href="#comprar">{isRecording ? "Comprar acceso completo" : "Reservar mi cupo"} <span>↑</span></a>
      </section>

      <footer className="workshop-footer"><span>CrececonIA · Santiago, Chile</span><a href="mailto:sergio@crececonia.cl">¿Tienes una pregunta?</a></footer>
    </main>
  );
}
