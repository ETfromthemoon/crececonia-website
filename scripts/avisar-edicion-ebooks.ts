import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { buildNotice, planNotices, validateEdition, type Purchase } from "../lib/ebook-edition-notice";

type Mode = "preview" | "test" | "send";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runEdition(args: string[]) {
  const [file, mode = "preview", testEmail] = args;
  if (!file || !["preview", "test", "send"].includes(mode) || (mode === "test" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail ?? "")) || (mode !== "test" && testEmail)) throw new Error("Uso: npm run ebook:avisar-edicion -- editions/<id>.json preview|test <email>|send");
  const resolved = path.resolve(file);
  if (path.dirname(resolved) !== path.resolve("editions") || !/^[a-z0-9-]+\.json$/.test(path.basename(resolved))) throw new Error("El manifiesto debe estar en editions/<id>.json.");
  const raw = await fs.readFile(resolved, "utf8");
  const edition = validateEdition(JSON.parse(raw));
  if (path.basename(resolved) !== `${edition.id}.json`) throw new Error("El nombre del manifiesto debe coincidir con su id.");
  const digest = createHash("sha256").update(raw).digest("hex");
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
  const sql = neon(process.env.DATABASE_URL);
  const purchases = await sql`select email, resource, flow_token, purchased_at from commerce.ebook_purchases` as Purchase[];
  const notices = planNotices(purchases, edition);
  console.log(`Edición ${edition.id}: ${notices.length} persona(s).`);
  for (const book of edition.books) console.log(`${book.resource}: ${notices.filter((n) => n.grants.some((g) => g.resource === book.resource)).length}`);

  // Only a successfully authenticated production download proves what buyers receive.
  for (const book of edition.books) {
    const token = notices.flatMap((n) => n.grants).find((g) => g.resource === book.resource && g.token)?.token;
    if (!token) throw new Error(`No hay compra con token para verificar ${book.resource}.`);
    for (const format of ["a4", "movil"] as const) {
      const url = new URL("/api/ebook/download", "https://www.crececonia.cl");
      url.searchParams.set("token", token);
      url.searchParams.set("resource", book.resource);
      url.searchParams.set("format", format);
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000), cache: "no-store" });
      if (!response.ok) throw new Error(`Descarga ${book.resource}/${format}: HTTP ${response.status}.`);
      const actual = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
      if (actual !== book.sha256[format]) throw new Error(`Huella incorrecta: ${book.resource}/${format}.`);
      console.log(`PDF OK ${book.resource}/${format}`);
    }
  }

  const rows = await sql`select email, manifest_sha256, status from commerce.ebook_edition_notices where edition_id = ${edition.id}` as { email: string; manifest_sha256: string; status: string }[];
  if (rows.some((r) => r.manifest_sha256 !== digest)) throw new Error("El manifiesto cambió después de iniciar los envíos. Usa otro id de edición.");
  const recorded = new Set(rows.map((r) => r.email));
  console.log(`Registrados: ${recorded.size}; pendientes: ${notices.length - notices.filter((n) => recorded.has(n.email)).length}.`);
  if (mode === "preview") return;
  if (!process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY.");
  if (mode === "test") {
    const sample = [...notices].sort((a, b) => b.grants.length - a.grants.length)[0];
    if (!sample) throw new Error("No hay compradores para la prueba.");
    await send(buildNotice(edition, sample, testEmail!), `${edition.id}/test/${testEmail}`);
    console.log(`Prueba aceptada para ${testEmail}.`);
    return;
  }
  let accepted = 0;
  for (const notice of notices) {
    if (recorded.has(notice.email)) continue;
    const claim = await sql`insert into commerce.ebook_edition_notices (edition_id,email,manifest_sha256,status) values (${edition.id},${notice.email},${digest},'sending') on conflict do nothing returning email`;
    if (!claim.length) continue;
    try {
      const id = await send(buildNotice(edition, notice), `${edition.id}/${createHash("sha256").update(notice.email).digest("hex")}`);
      await sql`update commerce.ebook_edition_notices set status='accepted', provider_message_id=${id}, updated_at=now() where edition_id=${edition.id} and email=${notice.email}`;
      accepted++;
    } catch (error) {
      await sql`update commerce.ebook_edition_notices set status='review', updated_at=now() where edition_id=${edition.id} and email=${notice.email}`;
      throw new Error(`Envío detenido; revisar el estado del proveedor antes de reintentar. ${error instanceof Error ? error.message : String(error)}`);
    }
    await pause(600);
  }
  console.log(`Aceptados ahora: ${accepted}.`);
}

async function send(payload: ReturnType<typeof buildNotice>, key: string): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(20_000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `ebook-edition/${key}` }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !body.id) throw new Error(`Resend HTTP ${response.status}: ${body.message ?? "sin confirmación"}`);
  return body.id;
}

if (process.argv[1]?.endsWith("avisar-edicion-ebooks.ts")) runEdition(process.argv.slice(2)).catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
