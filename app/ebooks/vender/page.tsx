import SellerPortal from "./SellerPortal";
import { marketplaceDemoAvailable } from "@/lib/marketplace-demo";

export const dynamic = "force-dynamic";

export default function SellerPortalPage() {
  return <SellerPortal demoAvailable={marketplaceDemoAvailable()} />;
}
