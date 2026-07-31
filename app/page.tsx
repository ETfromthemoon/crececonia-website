import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PainPoints from "@/components/PainPoints";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import Pricing from "@/components/Pricing";
import Objections from "@/components/Objections";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

/**
 * Orden pensado como arco: dolor → cómo se resuelve → prueba → oferta →
 * autoselección → objeciones finales → cierre.
 *
 * Dos cosas cambiaron respecto de la versión anterior:
 *
 * 1. `Objections` ("Esto NO es para ti si:") estaba en posición 2, apenas
 *    después del hero. Descalificar al visitante antes de que le duela algo
 *    y antes de generar deseo corta el momentum: la autoselección recién
 *    funciona cuando el lector ya quiere el producto y necesita permiso
 *    para descartarse. Ahora va después del precio.
 *
 * 2. `UseCases` y `Services` salieron. `Services` era `Pricing` escrito de
 *    nuevo (mismos features, y su bloque de Garantía ya vive en Pricing).
 *    `UseCases` repetía los mismos rubros que `SocialProof` pero sin
 *    números — su única función real ("¿aplica a mi rubro?") la resuelve
 *    una línea en el hero.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <Objections />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
