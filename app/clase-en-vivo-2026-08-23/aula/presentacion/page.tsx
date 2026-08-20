import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClassPresentation from "@/components/ClassPresentation";
import { CLASS_HUB_PATH, CLASS_TITLE } from "@/lib/class-product";
import { verifyClassHubToken } from "@/lib/class-hub-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Presentación · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function ClassPresentationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!verifyClassHubToken(token)) notFound();
  return <ClassPresentation aulaHref={`${CLASS_HUB_PATH}?token=${encodeURIComponent(token as string)}`} />;
}
