import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_STORAGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan las credenciales operativas de Supabase.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.from("ebook_purchases").select("id", { head: true, count: "exact" });
  if (error) throw new Error(`Supabase no está listo para rollback: ${error.message}`);

  console.log("Supabase responde y puede volver a ser el backend de base de datos.");
  console.log("Rollback de aplicación: quitar DATABASE_URL del entorno afectado y redeployar el último commit estable.");
  console.log("No se modificó Vercel, Neon ni Supabase. Los datos escritos solo en Neon deben reconciliarse antes del rollback.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

