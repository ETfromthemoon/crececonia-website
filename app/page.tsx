import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Beliefs from "@/components/ProblemBar";
import BPIProtocol from "@/components/HowItWorks";
import AntiPositioning from "@/components/AntiPositioning";
import SocialProof from "@/components/SocialProof";
import SergioStory from "@/components/UseCases";
import Investment from "@/components/Services";
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
        <Beliefs />
        <BPIProtocol />
        <AntiPositioning />
        <SocialProof />
        <SergioStory />
        <Investment />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyWABar />
    </>
  );
}
