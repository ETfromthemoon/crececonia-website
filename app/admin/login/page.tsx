import { safeAdminDestination } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="site-container" style={{ maxWidth: 520, paddingTop: 100, paddingBottom: 100 }}>
    <p className="eyebrow">Administración</p><h1>Entrar a CrececonIA</h1>
    <p>Usa tu clave administrativa. La sesión dura ocho horas.</p>
    {params.error && <p role="alert">No pudimos validar la clave. Inténtalo nuevamente.</p>}
    <form action="/api/admin/session/login" method="post">
      <input type="hidden" name="next" value={safeAdminDestination(params.next)} />
      <label htmlFor="admin-password">Clave administrativa</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} style={{ display: "block", width: "100%", margin: "12px 0 24px", padding: 12, border: "1px solid var(--border)" }} />
      <button type="submit" className="button button-dark">Entrar</button>
    </form>
  </main>;
}
