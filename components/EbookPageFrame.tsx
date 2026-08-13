import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EbookCatalogNav from "@/components/EbookCatalogNav";

type EbookPageFrameProps = {
  currentResource: string;
  children: ReactNode;
};

export default function EbookPageFrame({ currentResource, children }: EbookPageFrameProps) {
  return (
    <>
      <Navbar />
      <main className="monad ebook-detail-page">
        <EbookCatalogNav currentResource={currentResource} />
        {children}
      </main>
      <Footer />
    </>
  );
}
