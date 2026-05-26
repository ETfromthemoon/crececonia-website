import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemBar from "@/components/ProblemBar";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import Services from "@/components/Services";
import UseCases from "@/components/UseCases";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyWABar from "@/components/StickyWABar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemBar />
        <SocialProof />
        <HowItWorks />
        <Services />
        <UseCases />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyWABar />
    </>
  );
}
