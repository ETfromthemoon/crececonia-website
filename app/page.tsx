import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Objections from "@/components/Objections";
import PainPoints from "@/components/PainPoints";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import UseCases from "@/components/UseCases";
import Pricing from "@/components/Pricing";
import Services from "@/components/Services";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Objections />
        <PainPoints />
        <HowItWorks />
        <SocialProof />
        <UseCases />
        <Pricing />
        <Services />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
