# Base de datos de Crece con IA

La aplicación usa **Neon PostgreSQL** mediante `DATABASE_URL`. El esquema productivo se divide por dominio; el centro de lanzamientos nuevo vive en `public.launches`, `public.launch_products`, `public.launch_price_tiers`, `public.launch_tasks` y `public.launch_activity`.

## Cambios de esquema

Cada cambio debe tener dos archivos inmutables en `database/migrations/`: `*.up.sql` para avanzar y `*.down.sql` para revertir. Nunca se modifica una migración que ya fue aplicada. Primero se prueba en una rama temporal de Neon y, sólo después de aprobación explícita, se aplica a producción.

## Límites importantes

- El workshop del 6 de septiembre de 2026 conserva sus tablas, funciones y páginas actuales; el centro de lanzamientos no las modifica.
- `launches` guarda configuración y ciclo de vida.
- `launch_products` guarda una fotografía de los ebooks elegidos desde el catálogo del código.
- `launch_price_tiers` administra tramos propios de la plantilla.
- `launch_tasks` convierte CERNEO, publicaciones, DM, anuncios, automatización, entrega y medición en requisitos visibles.
- `launch_activity` mantiene la trazabilidad de cambios administrativos.

Los secretos no se guardan en SQL ni en el repositorio. La aplicación sólo accede desde el servidor.
