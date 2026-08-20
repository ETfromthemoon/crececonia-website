import { notFound } from "next/navigation";
import ClassPresentation from "@/components/ClassPresentation";
import { CLASS_TITLE } from "@/lib/class-product";

export const dynamic = "force-dynamic";
export const metadata = { title: `Relator · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function AdminClassPresentationPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) notFound();

  return <ClassPresentation aulaHref={`/admin/clase?key=${encodeURIComponent(key)}`} />;
}
