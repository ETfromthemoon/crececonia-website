import { acknowledgeNitidoJob, handleSyncRequest } from "@/lib/nitido-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleSyncRequest(request, acknowledgeNitidoJob);
}
