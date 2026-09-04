# Base de datos de producción

## Proyecto vigente

- Sitio: `www.crececonia.cl`
- Proveedor: Supabase
- Project ref: `axiarbujhaurlljmpcel`
- Host: `axiarbujhaurlljmpcel.supabase.co`
- Configuración de runtime: variables `NEXT_PUBLIC_SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` del entorno **Production** en Vercel.

La URL del proyecto es un identificador público. La service role key es un
secreto y nunca debe copiarse a documentación, código, logs ni variables
cliente.

## Acceso operativo

La cuenta `sergio.bkg@gmail.com` no tenía acceso a este proyecto al
2026-09-04. Antes de ejecutar migraciones, la cuenta propietaria debe invitarla
desde Supabase en Project Settings > Team, o debe iniciarse sesión con la cuenta
propietaria.

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
