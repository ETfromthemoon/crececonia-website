/**
 * IDs de recursos que es seguro importar desde código de cliente.
 *
 * Existe separado de lib/ebook-catalog.ts a propósito: ese archivo también
 * exporta EBOOK_CATALOG con los precios por tramo y el instante `visibleFrom`
 * de cada libro. Cualquier "use client" que importe algo de ebook-catalog.ts
 * —aunque sea solo esta constante— hace que el bundler incluya el array
 * completo en el JS que se manda al navegador: cualquier visitante puede
 * abrir devtools en la página YA EN VENTA del libro 1 y leer en texto plano
 * el precio y la hora exacta de lanzamiento de los libros que todavía no se
 * anunciaron. Pasó de verdad en el lanzamiento de 2026-08-07 (confirmado
 * grepeando el chunk generado por el build) — ver el fix en el mismo commit.
 *
 * Regla: código "use client" solo importa de acá. La info sensible
 * (tierPrices, visibleFrom, el grafo de cross-sell completo) se resuelve
 * SIEMPRE en un Server Component y llega al cliente ya filtrada a lo que
 * corresponde mostrar — nunca como el array crudo.
 */
export const DEFAULT_EBOOK_RESOURCE = "ebook:de-cero-a-claude-en-una-semana";
