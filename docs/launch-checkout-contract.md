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
