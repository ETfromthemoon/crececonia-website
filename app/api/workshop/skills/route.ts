import { serveWorkshopAsset } from "@/lib/workshop-asset-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return serveWorkshopAsset(request, "skills");
}
