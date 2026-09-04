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

1. Confirmar que el navegador está en el project ref `axiarbujhaurlljmpcel`.
2. Confirmar que existen el esquema `commerce` y las tablas
   `class_orders`, `product_offers` y `ebook_purchases`.
3. Ejecutar primero cualquier consulta de diagnóstico de solo lectura.
4. Aplicar la migración versionada correspondiente desde
   `docs/superpowers/plans/`.
5. Verificar los RPC nuevos antes de desplegar el código que los consume.

## Entornos

No asumir que Preview y Production usan la misma base. El entorno Preview
apuntaba anteriormente al proyecto `onhpmxxjnjpjoggabysy` (`ebook`), que estaba
pausado. Para evitar diagnósticos engañosos, revisar siempre el entorno indicado
en Vercel y mantener esta separación documentada.
