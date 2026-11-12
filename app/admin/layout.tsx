import type { Metadata } from "next";
import { hasAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const signedIn = await hasAdminSession();
  return <div className="ph-no-capture ph-mask">{signedIn && <nav aria-label="Sesión administrativa" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
    <a href="/admin/ebook">Administración</a><a href="/admin/ebook/entregas">Entregas de ebooks</a><a href="/admin/postulaciones">Postulaciones</a><form action="/api/admin/session/logout" method="post"><button type="submit">Cerrar sesión</button></form>
  </nav>}{children}</div>;
}
