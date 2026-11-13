import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Simulador de ingresos para autores — CrececonIA",
  description: "Explora un ejemplo de cómo se desglosaría una venta de ebook en CLP.",
  path: "/ebooks/vender/simulador",
});

export default function SellerPayoutSimulatorPage() {
  return (
    <><Navbar /><main className="marketplace-calculator-page"><PayoutCalculator /></main><Footer /></>
  );
}
