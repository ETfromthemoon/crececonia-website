# Checkout del Centro de Lanzamientos — contrato E10

La landing pública ya puede mostrar el tramo activo, pero ese tramo todavía no está conectado al checkout estándar de ebooks. E10 prepara una venta Flow separada para `ebook_release`, donde el servidor fija el precio y el recurso desde Neon. La v1 admite exactamente un ebook principal; no distribuye un precio único entre bundles.

## Etapa A: reservas persistentes

La migración `20261112_007_launch_checkout` agrega `commerce.launch_checkout_orders` y RPC privadas para reservar capacidad, relacionar la orden Flow y registrar estados verificados. La operación reserva bloquea el lanzamiento y el tramo activo, comprueba que sea un `ebook_release` publicado con un solo producto, y guarda snapshots inmutables del producto, tier, email e importe. También crea el manifiesto de entrega para el contrato E05.

La llave de idempotencia sólo se conserva como hash SHA-256. `creating` pasa a `creation_submitted` antes de iniciar la petición de red. Si se pierde la respuesta, `creation_unknown` conserva el cupo: una segunda petición no debe crear otra orden Flow a ciegas. Un rechazo/anulación verificado libera una sola vez sólo si no existe evidencia de pago; si Flow informó pago, pero el email o importe no coinciden, queda en `needs_review` y retiene cupo incluso ante un estado terminal posterior, hasta reconciliación. Un pago que aparezca después de liberar una orden terminal queda en `needs_review` con el payer/importe observados; si no se puede volver a reservar capacidad, `capacity_exception` también cuenta como ocupación para impedir más ventas.

No hay expirador ni reconciliador en esta etapa. Las reservas desconocidas o abandonadas pueden ocupar capacidad hasta intervención operativa; **ese estado impide activar el checkout** hasta implementar un job que consulte Flow y reconcilie sin liberar pagos válidos. Una fecha `starts_at` futura bloquea la reserva aunque el lanzamiento esté marcado `published`.

## Gates previos a venta

- La migración 007 se probó y revirtió sólo en la rama Neon temporal autorizada; no se aplicó a producción. La prueba de contrato y las pruebas manuales de concurrencia con dos sesiones pasaron allí. El harness del repositorio en #112 aún no se ha ejecutado contra Neon porque falta `NEON_API_KEY` local.
- Implementar el endpoint Flow y la rama de confirmación; nunca usar el total enviado por el navegador.
- Las RPC de esta etapa devuelven columnas de la orden que incluyen `buyer_email` y, tras consultar Flow, `observed_payment_payer`. Todo endpoint futuro debe construir una proyección explícita de campos permitidos; no serializar ni devolver directamente el resultado completo de la RPC al navegador.
- Finalizar pago, grants y outbox E05 en una transacción común; E05 y su worker siguen desactivados hasta rollout coordinado.
- Implementar recuperación de `creation_unknown`, pagos confirmados y expiraciones antes de abrir tráfico.
- La landing debe mostrar el precio sólo con checkout de lanzamiento habilitado y quitar CTA cuando el cupo esté agotado.
- Mantener la flag de checkout apagada por defecto. Este SQL no crea endpoint, cron ni envío.

## Prueba aislada

`database/tests/20261112_007_launch_checkout.sql` contiene una prueba transaccional de contrato para fechas de apertura, snapshots, replay y conflicto de idempotencia, estados ambiguos, pagos discrepantes/tardíos, liberación terminal única, bloqueo por cupo/excepción, inmutabilidad de snapshots y privilegios. No demuestra concurrencia multi-sesión; la prueba manual de dos sesiones en la rama Neon temporal observó el lock, confirmó replay idempotente con una orden/reserva y verificó rechazo por capacidad agotada.

### Concurrencia entre sesiones

`npm run launch:checkout:concurrency -- --self-test` ejecuta sólo comprobaciones locales del guard de URLs, ramas y endpoints: no lee variables de entorno ni conecta a Neon. `--help` también es local.

La prueba real requiere que la migración 007 y sus prerrequisitos estén ya instalados en una rama Neon temporal. Se invoca explícitamente con:

```text
npm run launch:checkout:concurrency -- --confirm-temporary-neon
```

El proceso requiere `LAUNCH_CHECKOUT_TEMP_DATABASE_URL`, `DATABASE_URL` (sólo referencia para comparar host; nunca se conecta), `NEON_API_KEY`, `LAUNCH_CHECKOUT_NEON_PROJECT_ID` y `LAUNCH_CHECKOUT_NEON_BRANCH_ID`. No carga `.env.local` automáticamente ni imprime valores de esas variables. Verifica mediante llamadas GET a la API que la rama esté `ready`, no sea default, derive directamente de la default, no esté protegida, tenga un nombre explícito que incluya `validation`, haya sido creada durante las últimas 72 horas y que el host corresponda a un endpoint `read_write` habilitado de esa rama. Los contratos de Neon usados son [Retrieve branch details](https://neon.com/docs/reference/api/branches/get-project-branch) y [List compute endpoints](https://neon.com/docs/reference/api/endpoints/list-project-endpoints).

Con tres sesiones PostgreSQL distintas, el harness mantiene abierta la primera reserva, observa la segunda bloqueada en `pg_stat_activity` y recién entonces libera la primera. Comprueba idempotencia simultánea con la misma llave y rechazo `launch_checkout_sold_out` con llaves distintas y capacidad uno. Los fixtures usan UUIDs aleatorios, se insertan en transacciones y se registran antes de escribir para que el `finally` pueda recuperar una respuesta de commit ambigua. La limpieza valida que cada orden, tramo, lanzamiento y manifiesto corresponda a esos UUIDs/IDs y sólo elimina órdenes en `creation_failed` sin Flow order; ante cualquier estado o propiedad inesperados, conserva los datos y falla.

El harness **no aplica migraciones ni ejecuta `down.sql`**. La prueba SQL de contrato/ACL y el rollback permanecen pasos separados, también limitados a una rama temporal. Una ejecución fallida de limpieza necesita inspección antes de volver a correr la prueba.
