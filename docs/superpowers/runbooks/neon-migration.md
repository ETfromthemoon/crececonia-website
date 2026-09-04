# Runbook: migración verificable de Supabase a Neon

## Estado actual

- Neon PostgreSQL `crececonia-migration` existe en São Paulo, PostgreSQL 17.
- Neon Object Storage `crececonia-storage` existe en Ohio con el bucket privado `ebooks`.
- La copia inicial fue reconciliada: 69/69 tablas idénticas.
- Los 14 PDF (51.894.146 bytes) fueron copiados y verificados por tamaño y SHA-256.
- La Preview validó consultas/RPC y descargas reales móvil/A4 desde Neon.
- Supabase se conserva intacto únicamente como rollback durante la observación posterior al corte.

## Reglas

1. Nunca pegar URLs con contraseña en comandos ni en este repositorio.
2. Guardar credenciales solo en `.env.local` o un almacén cifrado.
3. Mantener Supabase intacto hasta que la reconciliación sea idéntica y el usuario confirme el corte.
4. Ejecutar primero en Neon/Preview. No usar `--allow-nonempty` salvo investigación explícita.
5. El rollback de aplicación nunca borra Neon; conservar ambas copias.

## Variables locales

```dotenv
SOURCE_DATABASE_URL=postgresql://...supabase.../postgres?sslmode=require
TARGET_DATABASE_URL=postgresql://...neon.tech/crececonia?sslmode=require
MIGRATION_SCHEMAS=agent_memory,auth,automation,carousel_library,commerce,private,public
```

La URL de origen debe usar una conexión directa/no pooler con un rol que pueda leer todos los esquemas seleccionados y omitir RLS. La URL de destino debe apuntar a la base aislada de Neon. La contraseña debe copiarse desde el panel correspondiente directamente a `.env.local`, nunca al chat.

## 1. Instalar cliente PostgreSQL 17 o superior

Los scripts requieren `psql`, `pg_dump` y `pg_restore`. Verificar sus versiones antes de continuar. El dump excluye las extensiones no portables `pg_net` y `supabase_vault`.

## 2. Inventariar sin datos

```bash
npm run db:inventory
```

Guarda en `.migration-private/` columnas, defaults, relaciones, funciones, índices, constraints, triggers, RLS, extensiones y secuencias. No guarda filas ni secretos.

## 3. Exportar PostgreSQL y Storage

```bash
npm run db:export
npm run storage:export
```

El dump usa una única instantánea consistente. Cada exportación incluye un manifiesto SHA-256. Los resultados contienen datos personales y están ignorados por Git.

## 4. Importar en Neon aislado

Revisar `schema.sql` y el manifiesto. Después:

```bash
npm run db:import -- --apply
```

El importador se niega a tocar un destino con tablas existentes y solo acepta hosts Neon por defecto. Crea roles NOLOGIN de compatibilidad y extensiones portables antes del restore. No usa `--clean` ni borra objetos.

Aplicar **solo en Neon** el SQL pendiente:

```text
docs/superpowers/plans/2026-09-03-workshop-admin-sales-controls.sql
```

No aplicarlo en Supabase como parte de este rescate.

## 5. Reconciliar

```bash
npm run db:reconcile
```

Compara todas las tablas físicas seleccionadas por conteo exacto y por checksum multiconjunto de las filas. Un reporte diferente de cero bloquea el avance.

Para Storage, importar a un bucket privado S3-compatible y verificar tamaño + metadata SHA-256:

```bash
npm run storage:import -- --apply
```

La estructura destino es `<bucket-origen>/<ruta>`, por ejemplo `ebooks/de-cero-a-claude-en-una-semana-movil.pdf`.

## 6. Evitar pérdida durante el corte

Un dump inicial no basta porque Flow puede confirmar ventas después de la instantánea. Para un corte sin pérdida hay dos opciones:

1. **Replicación lógica Supabase → Neon (preferida):** crear publicación/slot en el origen, suscripción en Neon, esperar lag cero y cambiar la aplicación cuando ambas estén alineadas. Esto modifica el origen y requiere confirmación explícita.
2. **Ventana final controlada:** detener temporalmente la creación de nuevas órdenes, esperar y procesar todos los webhooks de Flow, ejecutar un dump incremental/final, reconciliar y cambiar. Es más simple, pero sí introduce una pausa breve.

No activar `DATABASE_URL` en producción después de un dump inicial sin una de estas dos garantías.

## 7. Probar en Preview

Configurar únicamente en Preview:

- `DATABASE_URL`: conexión Neon.
- Todas las variables `STORAGE_S3_*` del proyecto Neon Storage.

Con `DATABASE_URL`, tablas/RPC usan Neon. Con `STORAGE_S3_*`, los objetos privados usan Neon Object Storage y no se inicializa Supabase.

Ejecutar:

```bash
npm test
npm run build
npm run flow:contract
npm run ebook:verificar
```

Además, probar en la Preview protegida: precios/cupos, código de descuento, creación de orden Flow sandbox, confirmación idempotente, recuperación por email, descargas de ambos formatos, aula y workshop.

## 8. Corte final — confirmado el 2026-09-04

1. Confirmar reconciliación sin diferencias y lag cero.
2. Confirmar descarga byte a byte de todos los objetos.
3. Confirmar que ningún webhook pendiente escribe solo en Supabase.
4. Registrar la confirmación explícita del usuario.
5. Recién entonces agregar/cambiar `DATABASE_URL` en Production y desplegar.

No borrar Supabase inmediatamente después del corte. Mantenerlo disponible durante el período de observación y retirar sus variables de Vercel para confirmar que la aplicación ya no depende de él.

## Rollback

```bash
npm run db:rollback
```

El comando comprueba que Supabase responde y muestra el procedimiento; no modifica Vercel automáticamente. Antes de quitar `DATABASE_URL`, reconciliar hacia Supabase cualquier escritura que exista solo en Neon. Luego redeployar el último commit estable. No eliminar el proyecto Neon.
