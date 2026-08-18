import type { Metadata } from "next";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

const PATH = "/clase-en-vivo-2026-08-23";
const TITLE = "Clase en vivo · Domingo 23 de agosto";
const DESCRIPTION =
  "Reserva tu lugar para la clase en vivo de CrececonIA del domingo 23 de agosto. Inversión: $25.000 CLP.";

export const metadata: Metadata = createPageMetadata({
  title: `${TITLE} | CrececonIA`,
  description: DESCRIPTION,
  path: PATH,
  image: "/clases/clase-en-vivo-2026-08-23.png",
});

const classJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: TITLE,
  description: DESCRIPTION,
  url: absoluteUrl(PATH),
  startDate: "2026-08-23",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  organizer: { "@type": "Organization", name: "CrececonIA", url: absoluteUrl("/") },
  offers: {
    "@type": "Offer",
    price: "25000",
    priceCurrency: "CLP",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(PATH),
  },
};

export default function ClassPage() {
  return (
    <>
      <Navbar />
      <JsonLd data={classJsonLd} />
      <main className="class-page">
        <section className="class-hero site-container">
          <div className="class-hero-copy">
            <span className="eyebrow">CrececonIA · Clase especial</span>
            <h1>Clase en vivo.<br /><em>Un domingo para avanzar.</em></h1>
            <p className="hero-lead">
              Una sesión en vivo para aprender junto a la comunidad de CrececonIA.
              El contenido específico y los detalles de conexión se compartirán antes de la sesión.
            </p>
            <div className="class-meta" aria-label="Detalles de la clase">
              <div><span>Fecha</span><strong>Domingo 23 de agosto</strong></div>
              <div><span>Modalidad</span><strong>En vivo · online</strong></div>
              <div><span>Inversión</span><strong>$25.000 CLP</strong></div>
            </div>
            <a
              className="button button-dark class-cta"
              href="https://wa.me/56961945206?text=Hola%2C%20quiero%20inscribirme%20a%20la%20clase%20en%20vivo%20del%20domingo%2023%20de%20agosto."
              target="_blank"
              rel="noreferrer"
            >
              Quiero reservar mi lugar <span>↗</span>
            </a>
            <p className="class-note">La inscripción se coordina de forma manual por WhatsApp.</p>
          </div>
          <div className="class-cover-wrap">
            <img
              src="/clases/clase-en-vivo-2026-08-23.png"
              alt="Portada de la clase en vivo del domingo 23 de agosto"
              className="class-cover"
            />
          </div>
        </section>
        <section className="class-bottom-band">
          <div className="site-container class-bottom-inner">
            <span>Una experiencia breve, concreta y compartida.</span>
            <span>CrececonIA / aprendizaje aplicado</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

