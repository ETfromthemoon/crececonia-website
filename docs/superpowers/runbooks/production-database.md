# Base de datos de producción

## Backend vigente

- Sitio: `www.crececonia.cl`
- Base: Neon `crececonia-migration`, PostgreSQL 17, São Paulo.
- Archivos privados: Neon Object Storage `crececonia-storage`, Ohio, bucket `ebooks`.
- Configuración de runtime: `DATABASE_URL` y `STORAGE_S3_*` en Vercel Production.

Las credenciales de PostgreSQL y Object Storage son secretos de servidor y
nunca deben copiarse a documentación, código, logs ni variables cliente.

## Origen legado y rollback

La cuenta `sergio.bkg@gmail.com` no veía el proyecto desde el dashboard al
inicio del 2026-09-04. Más tarde ese mismo día, el conector autenticado de
Supabase sí listó `axiarbujhaurlljmpcel` y ejecutó una consulta de catálogo como
rol `postgres`. El ticket de recuperación sigue siendo `SU-463990`; verificar
ambas rutas antes de asumir que el acceso quedó recuperado de forma permanente.

Supabase project ref `axiarbujhaurlljmpcel` se conserva temporalmente intacto
como rollback, pero la aplicación no debe requerir sus variables después del corte.

La auditoría y el procedimiento de migración están en:

- `docs/superpowers/audits/2026-09-04-production-database-recovery.md`
- `docs/superpowers/runbooks/neon-migration.md`

## Verificación antes de una migración

1. Confirmar que Neon está en el proyecto `crececonia-migration` y que la rama
   elegida es la correcta para el entorno.
2. Confirmar que existen el esquema `commerce` y las tablas
   `class_orders`, `product_offers` y `ebook_purchases`.
3. Ejecutar primero cualquier consulta de diagnóstico de solo lectura.
4. Crear una rama temporal de Neon desde producción y aplicar allí el archivo
   `*.up.sql` correspondiente de `database/migrations/`.
5. Verificar los RPC y el comportamiento de la aplicación contra esa rama.
6. Sólo con aprobación explícita, aplicar el mismo `*.up.sql` en producción.
7. Mantener disponible el `*.down.sql` de la misma versión para un rollback
   inmediato y verificar de nuevo los RPC después de cualquier reversión.

## Entornos

No asumir que Preview y Production usan la misma base. Para evitar diagnósticos
engañosos, revisar siempre `DATABASE_URL` y `STORAGE_S3_*` en el entorno indicado
de Vercel y mantener documentada cualquier separación entre Preview y Production.
