/**
 * Avisa por email a quienes ya compraron un ebook que hay una edición nueva
 * (noviembre de 2026: la app de escritorio de Claude) y les manda sus enlaces.
 *
 * Por defecto NO envía nada: solo muestra cuántas personas y libros hay.
 *
 *   npm run ebook:avisar-edicion                        simulación (solo lectura)
 *   npm run ebook:avisar-edicion -- --prueba=tu@mail.cl un único correo de prueba a esa dirección
 *   npm run ebook:avisar-edicion -- --enviar            envío real a todos los compradores
 *
 * Requisitos: DATABASE_URL (Neon) y RESEND_API_KEY de producción. Los PDF
 * nuevos ya tienen que estar en Storage (npm run ebook:verificar) ANTES de
 * enviar: los enlaces descargan lo que haya en ese momento.
 *
 * Seguridad:
 *   - Un correo por persona, con todos sus libros (ver lib/ebook-new-edition-email.ts).
 *   - Idempotente: cada envío lleva una Idempotency-Key estable y se registra en
 *     .avisos-nueva-edicion/<campaña>.jsonl (ignorado por git). Si el script se
 *     corta, al repetirlo se salta a quienes ya recibieron el aviso.
 *   - Se detiene tras 5 errores seguidos para no quemar la cuota ni la reputación
 *     del dominio.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Resend } from "resend";
import { getSupabaseAdmin } from "../lib/supabase";
import {
  NEW_EDITION_ID,
  buildNewEditionEmail,
  newEditionIdempotencyKey,
  planNewEditionNotices,
  type NewEditionNotice,
  type PurchaseRow,
} from "../lib/ebook-new-edition-email";
import { getActiveCatalogEntries } from "../lib/ebook-catalog";

const PAUSA_MS = 600; // Resend admite ~2 envíos por segundo en el plan estándar.
const MAX_ERRORES_SEGUIDOS = 5;
// Se resuelve en cada llamada (no al cargar el módulo) para que el registro
// quede siempre junto al repo desde donde se ejecuta el script.
const registroDir = () => path.join(process.cwd(), ".avisos-nueva-edicion");
const registroPath = () => path.join(registroDir(), `${NEW_EDITION_ID}.jsonl`);

function enmascarar(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

function yaEnviados(): Set<string> {
  if (!fs.existsSync(registroPath())) return new Set();
  return new Set(
    fs.readFileSync(registroPath(), "utf8").split(/\r?\n/).filter(Boolean)
      .map((line) => (JSON.parse(line) as { email: string }).email),
  );
}

function registrar(email: string, id: string): void {
  fs.mkdirSync(registroDir(), { recursive: true });
  fs.appendFileSync(registroPath(),`${JSON.stringify({ email, id, at: new Date().toISOString() })}\n`);
}

async function leerCompras(): Promise<PurchaseRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("ebook_purchases")
    .select("email, resource, flow_token, purchased_at");
  if (error) throw new Error(`No se pudieron leer las compras: ${error.message}`);
  return (data ?? []) as PurchaseRow[];
}

function resumen(notices: NewEditionNotice[], skipped: { reason: string; count: number }[]): void {
  const porLibro = new Map<string, number>();
  for (const n of notices) for (const g of n.grants) porLibro.set(g.resource, (porLibro.get(g.resource) ?? 0) + 1);
  console.log(`Campaña: ${NEW_EDITION_ID}`);
  console.log(`Personas a avisar: ${notices.length}`);
  for (const entry of getActiveCatalogEntries()) {
    console.log(`  ${String(porLibro.get(entry.resource) ?? 0).padStart(4)}  ${entry.title}`);
  }
  const sinToken = notices.filter((n) => n.grants.some((g) => !g.token)).length;
  if (sinToken) console.log(`  (${sinToken} persona(s) con algún libro sin token: recibirán el enlace de recuperación)`);
  for (const s of skipped) console.log(`  Omitidas: ${s.count} fila(s) — ${s.reason}`);
}

async function enviarUno(resend: Resend, notice: NewEditionNotice, to = notice.email): Promise<string> {
  const payload = { ...buildNewEditionEmail(notice), to };
  const { data, error } = await resend.emails.send(payload, {
    idempotencyKey: to === notice.email ? newEditionIdempotencyKey(notice.email) : undefined,
  });
  if (error || !data?.id) throw new Error(error?.message ?? "Resend no confirmó el envío.");
  return data.id;
}

export type ResultadoAviso = { modo: "simulacion" | "prueba" | "envio"; enviados: number; fallidos: number };

export async function avisarNuevaEdicion(args: string[]): Promise<ResultadoAviso> {
  const enviar = args.includes("--enviar");
  const prueba = args.find((a) => a.startsWith("--prueba="))?.slice("--prueba=".length);
  if (enviar && prueba) throw new Error("Usa --prueba o --enviar, no ambos.");
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL (Neon de producción).");

  const { notices, skipped } = planNewEditionNotices(await leerCompras());
  resumen(notices, skipped);
  if (!enviar && !prueba) {
    console.log("\nSimulación: no se envió nada. Usa --prueba=<email> y luego --enviar.");
    return { modo: "simulacion", enviados: 0, fallidos: 0 };
  }

  if (!process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY.");
  const resend = new Resend(process.env.RESEND_API_KEY);

  if (prueba) {
    // La prueba usa los libros de la persona con más compras, para ver el caso más largo.
    const muestra = [...notices].sort((a, b) => b.grants.length - a.grants.length)[0];
    if (!muestra) throw new Error("No hay compras para armar la prueba.");
    const id = await enviarUno(resend, muestra, prueba);
    console.log(`\nPrueba enviada a ${prueba} (id ${id}) con ${muestra.grants.length} libro(s). Los enlaces son reales: no reenvíes este correo.`);
    return { modo: "prueba", enviados: 1, fallidos: 0 };
  }

  const enviados = yaEnviados();
  const pendientes = notices.filter((n) => !enviados.has(n.email));
  console.log(`\nYa avisadas antes: ${notices.length - pendientes.length}. Pendientes: ${pendientes.length}.`);
  let ok = 0;
  let seguidos = 0;
  for (const notice of pendientes) {
    try {
      const id = await enviarUno(resend, notice);
      registrar(notice.email, id);
      ok++;
      seguidos = 0;
      console.log(`  OK ${enmascarar(notice.email)} (${notice.grants.length} libro/s)`);
    } catch (reason) {
      seguidos++;
      console.error(`  FALLÓ ${enmascarar(notice.email)}: ${reason instanceof Error ? reason.message : reason}`);
      if (seguidos >= MAX_ERRORES_SEGUIDOS) {
        throw new Error(`${MAX_ERRORES_SEGUIDOS} errores seguidos: me detengo. Revisa y vuelve a correr --enviar; retoma donde quedó.`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, PAUSA_MS));
  }
  console.log(`\nEnviados ahora: ${ok} de ${pendientes.length}. Registro: ${path.relative(process.cwd(), registroPath())}`);
  return { modo: "envio", enviados: ok, fallidos: pendientes.length - ok };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  avisarNuevaEdicion(process.argv.slice(2)).then((resultado) => {
    if (resultado.fallidos > 0) process.exitCode = 1;
  }).catch((err) => {
    console.error("Falló el aviso:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
