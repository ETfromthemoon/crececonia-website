import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClassAula from "@/components/ClassAula";
import { CLASS_HUB_PATH, CLASS_SLIDES_PATH, CLASS_TITLE } from "@/lib/class-product";
import { verifyClassHubToken } from "@/lib/class-hub-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Aula · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function ClassAulaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!verifyClassHubToken(token)) notFound();
  const safeToken = token as string;
  return <ClassAula token={safeToken} sessionUrl={process.env.CLASS_SESSION_URL?.trim()} groupUrl={process.env.CLASS_WHATSAPP_GROUP_URL?.trim()} supportEmail={process.env.CLASS_SUPPORT_EMAIL?.trim() || "sergio@crececonia.cl"} presentationHref={`${CLASS_SLIDES_PATH}?token=${encodeURIComponent(safeToken)}`} />;
}
