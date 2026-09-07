import type { Metadata } from "next";
import WorkshopAccessRecovery from "@/components/WorkshopAccessRecovery";

export const metadata: Metadata = { title: "Recuperar acceso al workshop | CrececonIA", robots: { index: false, follow: false } };

export default function WorkshopAccessPage() {
  return <WorkshopAccessRecovery />;
}
