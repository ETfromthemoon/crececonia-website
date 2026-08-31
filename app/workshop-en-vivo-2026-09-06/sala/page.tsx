import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkshopRoom from "@/components/WorkshopRoom";
import { verifyWorkshopAccessToken } from "@/lib/workshop-access";
import { WORKSHOP_PRODUCT_KEY, WORKSHOP_TITLE } from "@/lib/workshop-product";
import { getWorkshopSettings } from "@/lib/workshop-settings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Sala privada · ${WORKSHOP_TITLE}`, robots: { index: false, follow: false } };

export default async function WorkshopRoomPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const commerceOrder = verifyWorkshopAccessToken(token);
  if (!commerceOrder || !token) notFound();
  const [{ data, error }, settings] = await Promise.all([
    getSupabaseAdmin().rpc("get_workshop_room_access", { p_product_key: WORKSHOP_PRODUCT_KEY, p_commerce_order: commerceOrder }),
    getWorkshopSettings(),
  ]);
  const access = data?.[0];
  if (error || !access?.flow_token || !settings.roomEnabled) notFound();
  return <WorkshopRoom token={token} flowToken={access.flow_token} sessionUrl={settings.sessionUrl} recordingUrl={settings.recordingUrl} skoolUrl={settings.skoolUrl} skillsReady={Boolean(settings.skillsStoragePath)} supportEmail={settings.supportEmail} />;
}
