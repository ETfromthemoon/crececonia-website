import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MarketplacePaymentReturnPage() {
  return <>
    <Navbar />
    <main style={{ minHeight: "70vh", maxWidth: 720, margin: "0 auto", padding: "120px 24px 80px" }}>
      <p className="eyebrow">Compra de ebook</p>
      <h1>Estamos confirmando tu pago.</h1>
      <p>Flow nos avisará cuando termine la confirmación. Si se aprobó, recibirás un correo con el enlace de descarga. Revisa también la carpeta de spam.</p>
      <p>Si no recibes el acceso, escríbenos a <a href="mailto:sergio@crececonia.cl">sergio@crececonia.cl</a> con el correo usado al pagar. No necesitas comprar otra vez.</p>
      <Link href="/ebooks/mercado">Volver al catálogo de autores →</Link>
    </main>
    <Footer />
  </>;
}
