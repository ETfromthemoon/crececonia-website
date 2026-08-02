/**
 * Sube los PDFs de los ebooks a Supabase Storage (bucket privado).
 *
 * Por qué existe: los PDFs viven en /private, que está en .gitignore porque
 * este repo es PÚBLICO y son un producto pago. Había un .vercelignore que
 * intentaba incluirlos en el deploy, pero .vercelignore solo aplica a subidas
 * por CLI (`vercel --prod`): con la integración de Git —que es el camino normal
 * de deploy— Vercel construye desde el repositorio, y un archivo gitignoreado
 * simplemente no está ahí.
 *
 * Resultado: cada deploy por git dejaba la producción sin PDFs y
 * /api/ebook/download respondía 503 "se está preparando" a compradores que ya
 * habían pagado.
 *
 * Con los archivos en Storage, la entrega no depende del método de deploy.
 *
 * Uso:  npm run ebook:subir-pdfs      (sube y después verifica)
 *       npm run ebook:verificar      (solo verifica, no escribe nada)
 *
 * Es idempotente: vuelve a subir (upsert) y no falla si ya existen.
 *
 * Termina siempre verificando que TODO libro activo del catálogo tenga sus dos
 * formatos en Storage. Un libro se pone a la venta cambiando `active: true` en
 * lib/ebook-catalog.ts, y nada obligaba a que sus PDFs estuvieran arriba: el
 * error se descubría recién cuando alguien pagaba y recibía un 503. Acá falla
 * el comando, no la venta.
 */
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  EBOOK_STORAGE_BUCKET,
  EBOOK_FORMATS as FORMATOS,
  findMissingEbookFiles,
  storageObjectName,
} from "../lib/ebook-storage";
import { EBOOK_CATALOG, getActiveCatalogEntries } from "../lib/ebook-catalog";

async function main() {
  const soloVerificar = process.argv.includes("--solo-verificar");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  if (soloVerificar) {
    await reportarVerificacion(db);
    return;
  }

  // El bucket debe ser privado: los PDFs se sirven solo a través de
  // /api/ebook/download, que valida que exista la compra.
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some((b) => b.name === EBOOK_STORAGE_BUCKET)) {
    const { error } = await db.storage.createBucket(EBOOK_STORAGE_BUCKET, { public: false });
    if (error) {
      console.error(`No se pudo crear el bucket ${EBOOK_STORAGE_BUCKET}:`, error.message);
      process.exit(1);
    }
    console.log(`Bucket "${EBOOK_STORAGE_BUCKET}" creado (privado).`);
  } else {
    console.log(`Bucket "${EBOOK_STORAGE_BUCKET}" ya existe.`);
  }

  let subidos = 0;
  let faltantes = 0;

  for (const entry of EBOOK_CATALOG) {
    const slug = entry.resource.replace(/^ebook:/, "");
    for (const format of FORMATOS) {
      // El libro 1 usa el nombre histórico `libro-{format}.pdf` en disco.
      const nombreLocal =
        entry.resource === "ebook:de-cero-a-claude-en-una-semana"
          ? `libro-${format}.pdf`
          : `${slug}-${format}.pdf`;
      const rutaLocal = path.join(process.cwd(), "private", nombreLocal);

      if (!fs.existsSync(rutaLocal)) {
        console.log(`  (falta en disco, se omite) ${nombreLocal}`);
        faltantes++;
        continue;
      }

      const destino = storageObjectName(entry.resource, format);
      const { error } = await db.storage
        .from(EBOOK_STORAGE_BUCKET)
        .upload(destino, fs.readFileSync(rutaLocal), {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        console.error(`  FALLÓ ${destino}: ${error.message}`);
        continue;
      }
      const kb = Math.round(fs.statSync(rutaLocal).size / 1024);
      console.log(`  OK ${destino}  (${kb} KB)`);
      subidos++;
    }
  }

  console.log(`\nSubidos: ${subidos}${faltantes ? ` · Omitidos por no estar en disco: ${faltantes}` : ""}`);

  // No se falla por `subidos === 0`: si los PDFs ya están en Storage y no están
  // en este disco, la venta funciona igual. Lo que importa no es cuánto se
  // subió, sino que todo libro activo quede descargable — eso es lo que se
  // verifica ahora.
  await reportarVerificacion(db);
}

async function reportarVerificacion(db: SupabaseClient): Promise<void> {
  const faltan = await findMissingEbookFiles(db);
  const activos = getActiveCatalogEntries();

  if (faltan.length > 0) {
    console.error(
      `\nFALTAN PDFs de libros que están A LA VENTA — quien compre no va a poder descargar:`
    );
    faltan.forEach((f) => console.error(`  - ${f}`));
    console.error(
      `\nDejá el archivo en private/ con ese nombre y corré: npm run ebook:subir-pdfs`
    );
    process.exit(1);
  }

  console.log(
    `\nEntrega OK: los ${activos.length} libro(s) a la venta tienen sus dos formatos en Storage.`
  );
}

main().catch((err) => {
  console.error("Falló la subida:", err instanceof Error ? err.message : err);
  process.exit(1);
});
