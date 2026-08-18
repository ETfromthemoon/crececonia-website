import type { Metadata } from "next";
import ClassCheckout from "@/components/ClassCheckout";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import {
  CLASS_DATE_LABEL,
  CLASS_END,
  CLASS_PATH,
  CLASS_SESSION_LABEL,
  CLASS_START,
  CLASS_TITLE,
} from "@/lib/class-product";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Clase online en vivo para construir una página desde cero con inteligencia artificial usando Claude Code o Codex, GitHub y Vercel. Incluye skills, guía completa y pack de cuatro libros.";

export const metadata: Metadata = createPageMetadata({
  title: `${CLASS_TITLE} | CrececonIA`,
  description: DESCRIPTION,
  path: CLASS_PATH,
  image: "/clases/clase-construye-pagina-portada.png",
});

const classJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: CLASS_TITLE,
  description: DESCRIPTION,
  url: absoluteUrl(CLASS_PATH),
  startDate: CLASS_START,
  endDate: CLASS_END,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  organizer: { "@type": "Organization", name: "CrececonIA", url: absoluteUrl("/") },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "20000",
    highPrice: "35000",
    offerCount: "4",
    priceCurrency: "CLP",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`${CLASS_PATH}#reservar`),
  },
};

const TOPICS = [
  "Empezar desde cero, aunque todavía no tengas una web construida.",
  "Conectar Claude Code o Codex como agente de código para trabajar con contexto.",
  "Usar una referencia: una página web, redes sociales, screenshots o un mapeo de información.",
  "Construir una primera versión soportada en GitHub y desarrollada en Vercel.",
  "Iterar, corregir y editar hasta convertirla en una web completa.",
];

const INCLUDED = [
  "Skills para construir y editar la página con un agente de código.",
  "Guía completa del proceso para repetirlo después de la clase.",
  "Pack de cuatro libros de IA para sitios web y e-commerce.",
];

const BOOKS = [
  "De cero a Claude en una semana",
  "Claude a Nivel Experto",
  "Agentes de IA para tu Negocio",
  "Creación de Webs con IA · Parte 1",
];

export default async function ClassPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  return (
    <>
      <Navbar />
      <JsonLd data={classJsonLd} />
      <main className="class-page">
        {success === "1" && (
          <div className="class-success site-container" role="status">
            <strong>Pago recibido.</strong> Revisa tu correo: ahí llegará la confirmación, la invitación al grupo y los próximos detalles.
          </div>
        )}
        <section className="class-hero site-container">
          <div className="class-hero-copy">
            <span className="eyebrow">CrececonIA · Clase práctica en vivo</span>
            <h1>Construye una página desde cero <em>con inteligencia artificial.</em></h1>
            <p className="hero-lead">
              Vamos a partir desde cero y convertir una referencia —una web, redes sociales, screenshots o un mapa de información— en una primera versión funcional. Después la conectaremos a GitHub, la desarrollaremos en Vercel y la iremos editando hasta dejar una web completa.
            </p>
            <div className="class-meta" aria-label="Detalles de la clase">
              <div><span>Fecha</span><strong>{CLASS_DATE_LABEL}</strong></div>
              <div><span>Horario</span><strong>18:00 a 20:30 h</strong></div>
              <div><span>Modalidad</span><strong>Online · 2 a 3 horas</strong></div>
            </div>
            <a className="button button-dark class-cta" href="#reservar">Reservar mi cupo <span>↓</span></a>
            <p className="class-note">Máximo 3 horas para que puedas planificar tu domingo.</p>
          </div>
          <div className="class-cover-wrap">
            <img src="/clases/clase-construye-pagina-portada.png" alt={`Portada: ${CLASS_TITLE}`} className="class-cover" />
          </div>
        </section>

        <section className="class-content site-container">
          <div><span className="eyebrow">Qué vamos a construir</span><h2>Una página real, con un método que puedas volver a usar.</h2></div>
          <div className="class-topic-list">{TOPICS.map((topic, index) => <div className="class-topic" key={topic}><span>0{index + 1}</span><p>{topic}</p></div>)}</div>
        </section>

        <section className="class-includes site-container">
          <div className="class-includes-card"><span className="eyebrow">Además te llevas</span><h2>Más que una demostración.</h2>{INCLUDED.map((item) => <p key={item}>✓ {item}</p>)}</div>
          <div className="class-books-card"><span className="eyebrow">Pack incluido</span><h3>Cuatro libros para seguir construyendo.</h3>{BOOKS.map((book, index) => <div key={book}><span>0{index + 1}</span>{book}</div>)}</div>
        </section>

        <ClassCheckout />

        <section className="class-bottom-band">
          <div className="site-container class-bottom-inner"><span>{CLASS_SESSION_LABEL}</span><span>CrececonIA / aprendizaje aplicado</span></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
