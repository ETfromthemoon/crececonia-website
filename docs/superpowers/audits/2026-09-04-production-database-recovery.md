# Auditoría de recuperación de la base productiva — 2026-09-04

## Respuesta ejecutiva

**La `SUPABASE_SERVICE_ROLE_KEY` por sí sola no permite copiar todo el proyecto sin pérdidas.**
Permite leer filas y RPC expuestos por PostgREST, omite RLS al operar como service role y permite listar/descargar objetos de Storage. No expone de forma completa `pg_catalog`, por lo que no basta para recuperar definiciones de funciones, índices, constraints, triggers, políticas, extensiones y secuencias.

**El acceso disponible hoy sí incluye una vía administrativa adicional.** El conector autenticado de Supabase listó el proyecto `axiarbujhaurlljmpcel` y ejecutó consultas de catálogo como rol PostgreSQL `postgres`. Con una conexión PostgreSQL directa y de solo lectura, el contenido de PostgreSQL puede copiarse con `pg_dump`/`pg_restore`. Ese acceso no convierte automáticamente en portables los servicios administrados de Supabase.

La respuesta estricta a “¿podemos copiarlo todo?” sigue siendo **no si “todo” significa el proyecto Supabase completo**. Se pueden copiar el esquema y los datos PostgreSQL, y se pueden copiar separadamente los bytes de Storage. Deben reconstruirse o reconfigurarse los servicios de plataforma que Neon no hereda.

## Evidencia observada

- Proyecto: `axiarbujhaurlljmpcel`, activo, PostgreSQL 17, São Paulo.
- Destino aislado creado: Neon `crececonia-migration`, PostgreSQL 17, São Paulo. No está conectado a Vercel.
- El catálogo fuente contiene estos esquemas de aplicación:

| Esquema | Tablas | Vistas | Funciones | Índices | Constraints | Políticas | Filas estimadas |
|---|---:|---:|---:|---:|---:|---:|---:|
| `agent_memory` | 11 | 0 | 0 | 51 | 70 | 11 | 342 |
| `automation` | 2 | 0 | 0 | 6 | 10 | 2 | 0 |
| `carousel_library` | 5 | 0 | 0 | 23 | 28 | 5 | 211 |
| `commerce` | 17 | 0 | 6 | 45 | 77 | 12 | 546 |
| `private` | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `public` | 11 | 5 | 37 | 26 | 43 | 30 | 39 |

- `auth` contiene 23 tablas y unas 93 filas estimadas. Es un esquema administrado por Supabase: sus datos pueden archivarse, pero restaurarlo en Neon no recrea el servicio Supabase Auth.
- Las cinco tablas históricas de ebooks (`ebook_purchases`, `ebook_cupos`, `discount_codes`, `ebook_pending_orders`, `ebook_waitlist`) son tablas en `commerce` y vistas de compatibilidad en `public`.
- El esquema `commerce` también contiene órdenes, ofertas, entregas, atribución, eventos y recuperación del workshop/aula.
- Conteos exactos observados en `commerce`: 49 compras de ebooks, 21 órdenes pendientes, 11 filas de cupos, 8 códigos, 2 waitlist, 39 órdenes de clase, 44 eventos de entrega, 310 eventos de workshop, 14 atribuciones y 9 recuperaciones de checkout. Las demás tablas suman 42 filas.
- Hay 37 RPC en `public` y 6 funciones internas en `commerce`. Las funciones `admin_advance_workshop_tier` y `admin_register_workshop_purchase` del SQL pendiente no existen aún en producción.
- Extensiones instaladas: `pg_cron`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp` y `vector`.
- Neon ofrece las extensiones requeridas por los datos (`pgcrypto`, `uuid-ossp`, `pg_trgm`, `vector`) y también `pg_cron`/`pg_stat_statements`; no ofrece `pg_net` ni `supabase_vault` como extensiones instalables equivalentes.
- Ninguna función de `public`, `commerce` o `private` contiene una referencia directa a `net.*` o `vault.*`; excluir esas dos extensiones no rompe los RPC de CrececonIA observados.
- Storage tiene cuatro buckets privados registrados. Se observaron 14 objetos, todos en `ebooks`, con 51.894.146 bytes según metadata. Las filas `storage.objects` son solo metadata; los bytes deben descargarse por la API de Storage.

Los conteos anteriores son evidencia de catálogo, no una reconciliación final. El corte exige conteos exactos y hashes por tabla producidos por `npm run db:reconcile`.

## Qué puede recuperarse

### Con Data API + service role

- Filas de tablas/vistas expuestas por PostgREST, paginando hasta EOF.
- Firmas de RPC expuestas por el OpenAPI de PostgREST y resultados de RPC autorizados.
- Buckets, nombres de objetos, metadata y bytes descargables de Storage.

### Con conexión PostgreSQL administrativa

- Esquemas, tablas, vistas y datos.
- Relaciones, columnas, defaults, constraints e índices.
- Funciones/procedimientos y sus definiciones.
- Triggers y políticas RLS.
- Secuencias y valores vigentes.
- Extensiones instaladas y su versión.
- Tablas administradas como `auth` y metadata de `storage`, si se incluyen expresamente.

## Qué no se obtiene de la Data API/service role

- Un dump completo y ordenado de DDL.
- Definiciones exhaustivas de funciones, triggers, índices, constraints, secuencias, políticas y extensiones.
- Roles globales y atributos de roles (`pg_dump` tampoco los incluye; eso corresponde a `pg_dumpall --globals-only`).
- Configuración de proveedores Auth, SMTP, JWT, dominios permitidos y ajustes del proyecto.
- Backups/PITR administrados, logs históricos y métricas de plataforma.
- Código fuente de Edge Functions y sus secretos.
- Secretos externos o claves de plataforma. No deben exportarse a Git.
- Bytes de Storage leyendo solamente las tablas `storage.*`.

## Objetos no portables uno a uno

- `pg_net` y sus trabajos HTTP deben reemplazarse por Vercel Cron, una cola o llamadas desde la aplicación.
- `supabase_vault` debe reemplazarse por variables cifradas de Vercel/u otro gestor; no se migrarán secretos desde tablas.
- Supabase Auth necesita una migración de identidad separada o conservarse temporalmente. Copiar `auth.*` no levanta un servicio Auth.
- Supabase Storage necesita mantenerse durante la transición o copiarse a un servicio S3-compatible. PostgreSQL no contiene los PDFs.
- Realtime, logs, backups y configuración del gateway son servicios, no filas portables.

## Riesgo de alcance compartido

El proyecto fuente se llama `niguel-command-center` y contiene datos que exceden CrececonIA. El alcance conservador de los scripts incluye los esquemas de aplicación y `auth`, pero excluye por defecto `storage`, `realtime`, `cron`, `net`, `vault` y esquemas internos. `MIGRATION_SCHEMAS` permite reducir o ampliar el alcance. No se debe decidir eliminar datos compartidos durante una migración de rescate.
