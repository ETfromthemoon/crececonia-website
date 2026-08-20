import type { Metadata } from "next";
import ClassCheckout from "@/components/ClassCheckout";
import { ClassBookFan, ClassProcessVisual } from "@/components/ClassProductMotion";
import Footer from "@/components/Footer";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
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
  "Colección de cuatro libros Creación de Webs con IA · Partes 1 a 4.",
];

const BOOKS = [
  "Creación de Webs con IA · Parte 1",
  "Creación de Webs con IA · Parte 2: Sitios Corporativos",
  "Creación de Webs con IA · Parte 3: eCommerce",
  "Creación de Webs con IA · Parte 4: SaaS y Dashboards",
];

const STREAM_IMAGES = [
  { src: "/clases/clase-construye-pagina-portada.png", alt: "Portada de la clase" },
  { src: "/ebooks/creacion-de-webs-con-ia.jpg", alt: "Creación de Webs con IA" },
  { src: "/ebooks/creacion-de-webs-con-ia-parte-2.png", alt: "Sitios Corporativos con IA" },
  { src: "/ebooks/previews/creacion-webs/metodologia-8-iteraciones.webp", alt: "Metodología de las ocho iteraciones" },
  { src: "/ebooks/creacion-de-webs-con-ia-parte-3.png", alt: "eCommerce con IA" },
  { src: "/ebooks/previews/creacion-webs/proyecto-appflow.webp", alt: "Proyecto AppFlow" },
  { src: "/ebooks/creacion-de-webs-con-ia-parte-4.png", alt: "SaaS y Dashboards con IA" },
];

const BOOK_COVERS = [
  "/ebooks/creacion-de-webs-con-ia.jpg",
  "/ebooks/creacion-de-webs-con-ia-parte-2.png",
  "/ebooks/creacion-de-webs-con-ia-parte-3.png",
  "/ebooks/creacion-de-webs-con-ia-parte-4.png",
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
        <ImageStreamHero
          images={STREAM_IMAGES}
          cards={10}
          speed={15}
          axis={52}
          path={{ perspective: 24, cardWidth: 16, cardHeight: 23, exitHeight: 52, railExit: 49, fan: 3.7, turnExit: 36 }}
          className="class-stream-hero"
        >
          <div className="class-stream-grid" aria-hidden />
          <div className="class-stream-glow" aria-hidden />
          <section className="class-hero site-container">
            <div className="class-hero-copy">
              <span className="class-live-pill"><i /> CrececonIA · Clase práctica en vivo</span>
              <h1>Construye una página desde cero <em>con inteligencia artificial.</em></h1>
              <p className="hero-lead">
                Vamos a partir desde cero y convertir una referencia —una web, redes sociales, screenshots o un mapa de información— en una primera versión funcional. Después la conectaremos a GitHub, la desarrollaremos en Vercel y la iremos editando hasta dejar una web completa.
              </p>
              <div className="class-meta" aria-label="Detalles de la clase">
                <div><span>Fecha</span><strong>{CLASS_DATE_LABEL}</strong></div>
                <div><span>Horario</span><strong>18:00 a 20:30 h</strong></div>
                <div><span>Modalidad</span><strong>Online · 2 a 3 horas</strong></div>
              </div>
              <div className="class-hero-actions">
                <a className="class-primary-cta" href="#reservar">Reservar mi cupo <span>↘</span></a>
                <p className="class-note">Máximo 3 horas para que puedas planificar tu domingo.</p>
              </div>
            </div>
            <div className="class-hero-foot" aria-hidden="true"><span>DESDE LA REFERENCIA</span><span>HASTA UNA WEB PUBLICADA</span></div>
          </section>
        </ImageStreamHero>

        <section className="class-signal" aria-label="Resumen de la experiencia">
          <div className="site-container class-signal-inner">
            <span><b>01</b> En vivo y paso a paso</span>
            <span><b>02</b> Claude Code o Codex</span>
            <span><b>03</b> GitHub + Vercel</span>
            <span><b>04</b> Cuatro libros incluidos</span>
          </div>
        </section>

        <section className="class-content site-container">
          <div className="class-content-heading"><span className="eyebrow">Qué vamos a construir</span><h2>Una página real, con un método que puedas volver a usar.</h2><p className="class-section-note">Referencia → agente → código → publicación.</p></div>
          <div className="class-topic-list">{TOPICS.map((topic, index) => <div className="class-topic" key={topic}><span>0{index + 1}</span><p>{topic}</p><i>↗</i></div>)}</div>
          <ClassProcessVisual />
        </section>

        <section className="class-includes site-container">
          <div className="class-includes-card"><span className="eyebrow">Además te llevas</span><h2>Más que una demostración.</h2><div className="class-included-list">{INCLUDED.map((item, index) => <p key={item}><span>0{index + 1}</span>{item}</p>)}</div></div>
          <div className="class-books-card">
            <ClassBookFan covers={BOOK_COVERS} />
            <span className="eyebrow">Pack incluido</span><h3>Cuatro libros para seguir construyendo.</h3>
            <div className="class-book-list">{BOOKS.map((book, index) => <div key={book}><span>0{index + 1}</span>{book}</div>)}</div>
          </div>
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
