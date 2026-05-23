import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoBar from "@/components/LogoBar";
import ProblemBar from "@/components/ProblemBar";
import UseCases from "@/components/UseCases";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import Services from "@/components/Services";
import Guarantee from "@/components/Guarantee";
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
        {/* <LogoBar /> */}
        <ProblemBar />
        <UseCases />
        <HowItWorks />
        <SocialProof />
        <Services />
        <Guarantee />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyWABar />
    </>
  );
}
