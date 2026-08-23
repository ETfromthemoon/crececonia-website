import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClassPresentation from "@/components/ClassPresentation";
import { CLASS_HUB_PATH, CLASS_PATH, CLASS_TITLE } from "@/lib/class-product";
import { verifyClassPresentationAccess } from "@/lib/class-hub-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Presentación · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function ClassPresentationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const access = verifyClassPresentationAccess(token);
  if (!access) notFound();
  const aulaHref = access === "presenter" ? CLASS_PATH : `${CLASS_HUB_PATH}?token=${encodeURIComponent(token as string)}`;
  return <ClassPresentation aulaHref={aulaHref} />;
}
