# Motor de bundles/combo entre ebooks — Design Spec

Fecha: 2026-07-28
Estado: Aprobado por el usuario (enfoque A — extender el esquema actual con dimensión `resource`)

## Contexto

Hoy `crececonia.cl` vende un solo ebook con checkout real ("De cero a Claude en una semana",
`resource: ebook:de-cero-a-claude-en-una-semana`), con descuento por tramos según cupos vendidos
(`super-early` / `early` / `regular`) y códigos de descuento de un solo uso. Otros dos ebooks
("Agentes de IA", "Sitios web con IA") existen solo como páginas "Próximamente" con waitlist —
sin precio, sin checkout.

El objetivo de este trabajo es construir el **motor extensible** de combos/bundles entre ebooks
para subir el valor promedio de compra (AOV), de forma que:

- Comprar 1 ebook → precio normal (con su propio tramo early-bird).
- Comprar 2 → 10% de descuento extra sobre la suma.
- Comprar 3 → 20% de descuento extra sobre la suma.
- Al agregar un ebook nuevo al catálogo, se suma automáticamente a la dinámica de combos sin
  tocar el motor.

**Explícitamente fuera de alcance de este trabajo:** activar precio/checkout real para el libro 2
o 3. Este trabajo deja el motor listo; "encender" el combo real es una decisión de negocio
posterior (agregar la entrada al catálogo + cupos en Supabase).

## Decisiones confirmadas con el usuario

1. Alcance: solo el motor extensible, no lanzar el libro 2 todavía.
2. UX: selector de checkboxes en la página de precio del libro (pre-checkout), no upsell
   post-compra. Un solo cargo en Flow por el total ya con el descuento de combo aplicado.
3. Cada libro (incluidos los futuros) usa el mismo sistema de tramos por cupos que el libro 1,
   no un precio fijo único.
4. El descuento de combo y los códigos de descuento **no se combinan**: si se seleccionan 2+
   libros, el código de descuento se rechaza/deshabilita.
5. Enfoque de esquema: **A** — extender `ebook_purchases`/`ebook_cupos` con una columna
   `resource`, en vez de tablas nuevas en paralelo (opción B, descartada por duplicar reportes).

## 1. Catálogo (`lib/ebook-catalog.ts`, nuevo)

Array tipado en código, uno por libro: `resource`, `title`, `subject` (para Flow), `href`,
`active: boolean` (comprable) vs `coming-soon`. Los montos de cada tramo viven en Supabase
(`ebook_cupos`), no en el catálogo — cada libro define los suyos cuando se activa. El selector de
combo se arma filtrando `active`; hoy solo hay 1 entrada activa, así que no cambia nada visible
hasta que se agregue la segunda.

## 2. Migración de datos

- `ebook_purchases` y `ebook_cupos` suman `resource text not null default
  'ebook:de-cero-a-claude-en-una-semana'`. En Postgres esto es instantáneo (no reescribe la
  tabla) y backfillea las filas existentes automáticamente y correctamente — 100% de las ventas
  pasadas son de ese libro.
- El índice único existente sobre `ebook_purchases.flow_token` (protección de idempotencia del
  webhook) se reemplaza por uno compuesto `(flow_token, resource)`: sigue evitando duplicados,
  pero permite varias filas por orden combo. Cambio de schema reversible, sin pérdida de datos.
- Esta migración se entrega como SQL para correr a mano en el dashboard de Supabase (no hay
  migraciones versionadas en este repo — convención existente del proyecto).

## 3. Motor de descuento (`lib/ebook-bundles.ts`, nuevo)

```
BUNDLE_DISCOUNT_RULES = [
  { minItems: 1, discountPercent: 0 },
  { minItems: 2, discountPercent: 10 },
  { minItems: 3, discountPercent: 20 },
];
```

`computeBundleTotal(items: { resource: string; price: number }[])` suma el precio por tramo de
cada libro, aplica el % del tramo que corresponde a la cantidad de items, y reparte el total
final proporcionalmente entre los libros (para que la suma de filas insertadas en
`ebook_purchases` cuadre exacto con el monto cobrado). Función pura — se testea sin mocks de red
ni de DB.

## 4. Checkout (`/api/flow/create`)

Pasa a aceptar `{ email, resources: string[], discountCode? }`.

- Valida que cada `resource` exista en el catálogo y esté `active` — rechaza con 400 si no
  (nunca confía en lo que mande el cliente).
- Si `resources.length > 1` y viene `discountCode`, rechaza con 400 explícito.
- Por cada resource: `getCurrentPrice(resource)` (tramo propio). `computeBundleTotal(...)` da el
  monto final.
- Un solo cargo en Flow por el total.
- `ebook_pending_orders` guarda el detalle del combo (resources + tramos + % descuento) en una
  columna `jsonb`, para que el webhook de confirmación no tenga que re-derivar tramos que
  pudieron cambiar entre crear y confirmar la orden (misma protección que ya existe hoy para el
  caso de 1 libro).

## 5. Confirmación (`/api/flow/confirm`)

- Inserta una fila en `ebook_purchases` **por libro** del combo, todas con el mismo
  `flow_token`. Cada una es idempotente por separado gracias al índice compuesto — un reintento
  del webhook de Flow no duplica nada.
- Decrementa cupos de cada libro+tramo.
- Manda **un solo correo** con los links de descarga de todos los libros comprados.
- El camino de "1 solo libro" queda igual al de hoy en comportamiento — el mismo código, con un
  loop de longitud 1 en vez de un caso especial.

## 6. Impacto en reportes/admin

- `getEbookSoldCount()` sigue contando filas de `ebook_purchases`: un combo de 3 libros suma 3,
  no 1 ("N ebooks vendidos", no "N compradores"). Documentado explícitamente como decisión — si
  se prefiere contar órdenes (`flow_token` distintos) en el futuro, es un cambio de una línea.
- `/admin/ebook` necesita desglosar por `resource` en vez de asumir un solo libro.

## 7. UI (`components/EbookPricing.tsx`, generalizado)

Checkboxes para sumar los otros libros `active` del catálogo, con el total recalculado en vivo
(subtotal → % de combo según cantidad → total). El campo de código de descuento se oculta al
seleccionar un segundo libro. Hoy, sin libro 2 activo, no se ve ningún cambio.

## 8. Testing

- Unit tests puros para `lib/ebook-bundles.ts` (matemática de descuento, sin mocks).
- Extensión de `tests/create.test.ts` y `tests/confirm.test.ts` para combos de 2 y 3 libros,
  tramos mixtos, código de descuento rechazado en combo, reintento idempotente del webhook.
- Los tests existentes del camino de 1 libro deben seguir pasando sin modificarlos — es la
  prueba de que no se rompió nada.

## 9. Rollout seguro

1. Migración de schema (columna + índice) — no requiere downtime, sin cambio de comportamiento
   visible.
2. Deploy del código — como ningún libro 2 está `active`, las rutas de combo no reciben tráfico
   real todavía.
3. Verificar en preview que comprar el libro 1 solo sigue funcionando de punta a punta
   (checkout → Flow sandbox → confirm → email).
4. Activar el libro 2 (catálogo + cupos reales) es un paso posterior y separado, fuera de este
   trabajo.

## Fuera de alcance

- Lanzar precio/checkout real para "Agentes de IA" o "Sitios web con IA".
- Upsell post-compra (order bump). Se puede agregar después como una fase 2 si el selector
  pre-checkout no alcanza para el AOV que se busca.
- Cambiar de pasarela de pago o adoptar un framework de e-commerce externo (Medusa/Vendure/etc.)
  — el patrón de "catálogo + reglas de descuento" se implementa en código propio, sin
  dependencias nuevas.
