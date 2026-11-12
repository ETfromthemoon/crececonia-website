import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RetiredServiceNotice({ title, scheduling = false }: { title: string; scheduling?: boolean }) {
  return <>
    <Navbar />
    <main className="hub-page hub-page-minimal">
      <div className="hub-shell">
        <section className="hub-intro">
          <span className="eyebrow">Servicios actualizados</span>
          <h1>{title}</h1>
          <p>Retiramos el Protocolo BPI y el Test de Fit. Hoy puedes aprender por tu cuenta, recibir mentoría o evaluar una implementación de IA.</p>
          {scheduling && <p>Este enlace antiguo ya no recibe solicitudes de llamada. Visitar esta página no reserva una reunión. Si ya coordinaste una conversación, confirma sus detalles por el canal que utilizaste.</p>}
          <p>Revisa los requisitos de cada servicio y elige el que corresponde a tu objetivo.</p>
          <a href="/ia" className="button button-dark">Ver servicios vigentes →</a>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
