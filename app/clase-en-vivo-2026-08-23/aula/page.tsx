import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClassAula from "@/components/ClassAula";
import { CLASS_HUB_PATH, CLASS_SLIDES_PATH, CLASS_TITLE } from "@/lib/class-product";
import { verifyClassHubToken } from "@/lib/class-hub-access";
import { getClassAulaSettings } from "@/lib/class-aula-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Aula · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function ClassAulaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!verifyClassHubToken(token)) notFound();
  const safeToken = token as string;
  const settings = await getClassAulaSettings();
  if (!settings.classroomEnabled) notFound();
  return <ClassAula token={safeToken} sessionUrl={settings.sessionUrl} groupUrl={settings.whatsappGroupUrl} recordingUrl={settings.recordingUrl} supportEmail={settings.supportEmail} presentationHref={`${CLASS_SLIDES_PATH}?token=${encodeURIComponent(safeToken)}`} />;
}
