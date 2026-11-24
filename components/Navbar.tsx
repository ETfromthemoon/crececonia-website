import { marketplacePublicAvailable } from "@/lib/marketplace-demo";
import NavbarClient from "./NavbarClient";

export default function Navbar() {
  return <NavbarClient showMarketplace={marketplacePublicAvailable()} />;
}
