-- Motor de bundles/combo entre ebooks — migración de schema
--
-- Correr a mano en el SQL Editor del dashboard de Supabase (este repo no
-- versiona migraciones — ver AGENTS.md). Aditivo y sin downtime: agregar una
-- columna con DEFAULT + NOT NULL en Postgres es instantáneo y backfillea las
-- filas existentes sin reescribir la tabla.
--
-- Antes de correr el paso 2 y 3: confirmar en el dashboard los nombres reales
-- de los constraints únicos existentes sobre ebook_purchases.flow_token y
-- ebook_cupos.tier — los nombres de abajo son el default de Postgres/Supabase
-- (<tabla>_<columna>_key), pero pueden diferir si se crearon a mano con otro
-- nombre. El código de la app (app/api/flow/confirm/route.ts) funciona igual
-- sin importar el nombre exacto del constraint — solo importa que el índice
-- compuesto termine existiendo.

-- 1. Columna resource en las 2 tablas existentes.
alter table ebook_purchases
  add column if not exists resource text not null default 'ebook:de-cero-a-claude-en-una-semana';

alter table ebook_cupos
  add column if not exists resource text not null default 'ebook:de-cero-a-claude-en-una-semana';

-- 2. Reemplazar el único sobre flow_token por uno compuesto (flow_token,
--    resource), para permitir varias filas por orden combo (una por libro).
alter table ebook_purchases drop constraint if exists ebook_purchases_flow_token_key;
create unique index if not exists ebook_purchases_flow_token_resource_key
  on ebook_purchases (flow_token, resource);

-- 3. Cupos ahora se identifican por (resource, tier), no solo por tier.
alter table ebook_cupos drop constraint if exists ebook_cupos_tier_key;
create unique index if not exists ebook_cupos_resource_tier_key
  on ebook_cupos (resource, tier);

-- 4. Función RPC de incremento de cupo, actualizada para recibir resource.
--    Reemplaza la firma anterior increment_cupo_used(p_tier text). El default
--    de p_resource es a propósito: durante la ventana entre correr este SQL y
--    que el deploy del código nuevo termine, el código VIEJO todavía en
--    producción sigue llamando increment_cupo_used con un solo argumento
--    (p_tier) — sin el default, esa llamada rompería apenas se corra este
--    script, antes incluso de que el código nuevo exista.
create or replace function increment_cupo_used(
  p_tier text,
  p_resource text default 'ebook:de-cero-a-claude-en-una-semana'
)
returns void as $$
  update ebook_cupos
  set used = used + 1
  where resource = p_resource and tier = p_tier;
$$ language sql;

-- 5. ebook_pending_orders: nueva columna para el detalle del combo (array de
--    {resource, tier, amount} por libro del carrito). El código nuevo ya no
--    escribe la columna `tier` existente en cada insert (el detalle vive en
--    `resources`) — si `tier` es NOT NULL, todo insert a esta tabla fallaría
--    en silencio (el create-order lo tolera y sigue cobrando igual, pero el
--    detalle del combo nunca quedaría guardado). Confirmar en el dashboard si
--    tier es NOT NULL; si lo es, correr la línea de abajo.
alter table ebook_pending_orders
  add column if not exists resources jsonb;

alter table ebook_pending_orders
  alter column tier drop not null;

-- Nada de esto activa el libro 2 ni el 3 — eso es un paso de negocio
-- separado (agregar la entrada a lib/ebook-catalog.ts con active: true y sus
-- tierPrices, más las filas de cupos correspondientes en ebook_cupos).
--
-- ORDEN DE DEPLOY: correr este SQL completo ANTES de mergear/deployar el
-- código de esta rama a main. Los dos pasos de arriba (RPC con default, tier
-- nullable) hacen que sea seguro correr este script mientras el código VIEJO
-- todavía está en producción. Lo que NO es seguro es el orden inverso: si el
-- código nuevo llega a producción antes que este SQL, CUALQUIER compra
-- (no solo combos) falla en silencio, porque el webhook de confirmación
-- referencia una columna `resource` que todavía no existiría — Flow ya cobró,
-- pero no se guarda la compra ni se manda el email de descarga.
