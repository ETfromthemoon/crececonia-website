import { safeAdminDestination } from "@/lib/admin-session";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const destination = safeAdminDestination(params.next);
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="admin-login-title">
      <p className={styles.label}>CrececonIA · Administración</p>
      <h1 id="admin-login-title">Entrar a CrececonIA</h1>
      <p className={styles.intro}>Usa tu clave administrativa. La sesión dura ocho horas.</p>
      {params.error && <p role="alert" className={styles.error}>No pudimos validar la clave. Inténtalo nuevamente.</p>}
      <form action="/api/admin/session/login" method="post" className={styles.form}>
        <input type="hidden" name="next" value={destination} />
        <label htmlFor="admin-password">Clave administrativa</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} />
        <button type="submit">Entrar al panel</button>
      </form>
    </section>
  </main>;
}
