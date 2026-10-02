import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import EbookCatalogNav from "@/components/EbookCatalogNav";
import Navbar from "@/components/Navbar";
import ResourceNav from "@/components/ResourceNav";

type EbookPageFrameProps = {
  currentResource: string;
  children: ReactNode;
};

export default function EbookPageFrame({ currentResource, children }: EbookPageFrameProps) {
  return (
    <>
      <Navbar />
      <main className="monad ebook-detail-page">
        <ResourceNav />
        <EbookCatalogNav currentResource={currentResource} />
        {children}
      </main>
      <Footer />
    </>
  );
}
