# Posventa del marketplace: contrato de integración

`lib/marketplace/post-sale.ts` decide qué mensajes están permitidos y construye el texto. No envía correos ni toca la base de datos. Debe conectarse cuando existan identidad, derechos de descarga, preferencias y rutas de biblioteca.

- `purchase-access`: generar solo después de confirmar el pago y crear el derecho de acceso. El email destinatario debe ser el fijado en la orden. Si el correo falla, la compra y el derecho siguen vigentes; la cola lo reintenta.
- `access-recovery`: generar solo después de verificar que quien pide la recuperación controla el email original y que el derecho continúa activo. La respuesta pública de recuperación no debe enumerar compras.
- `review-invitation`: generar como mínimo 14 días después de la compra, con email verificado, consentimiento explícito para este tipo de comunicación y sin baja. La baja se comprueba justo antes del envío; el enlace de preferencias debe estar operativo antes de habilitar el evento.

La clave `marketplace:<orderId>:<kind>` identifica un evento lógico. Al crear un mensaje, insertar en `marketplace_outbox` en la misma transacción que el hecho que lo origina, con restricción única de clave. El ejecutor reclama filas con bloqueo/lease, reintenta errores temporales con límite y consulta el identificador de envío del proveedor tras timeout. La clave evita duplicación de intención, pero una llamada al proveedor que termina en timeout requiere conciliación adicional para evitar dos emails. Nunca incluir tokens de descarga en este mensaje; la biblioteca exige autenticación o verificación. `libraryUrl` y `preferenceUrl` son entradas del integrador, restringidas al dominio del sitio, y no se deben configurar hasta que esas rutas existan.

Medir entrega, apertura y clic solo con el consentimiento y configuración de privacidad aplicables. Analizar por evento agregado, sin emails, tokens ni identificadores personales en PostHog. No añadir una invitación promocional a correos transaccionales. Las recomendaciones entre libros requieren una decisión de consentimiento independiente y deben usar solo publicaciones aprobadas.
