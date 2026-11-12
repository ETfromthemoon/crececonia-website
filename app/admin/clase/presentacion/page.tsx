import { requireAdminSession } from "@/lib/admin-auth";
import ClassPresentation from "@/components/ClassPresentation";
import { CLASS_TITLE } from "@/lib/class-product";

export const dynamic = "force-dynamic";
export const metadata = { title: `Relator · ${CLASS_TITLE}`, robots: { index: false, follow: false } };

export default async function AdminClassPresentationPage() {
  await requireAdminSession();
  return <ClassPresentation aulaHref={`/admin/clase`} />;
}
