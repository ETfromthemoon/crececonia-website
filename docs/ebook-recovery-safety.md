# Conciliación de ebooks: límites operativos

`npm run ebook:recuperar` consulta Flow y la base vigente mediante `DATABASE_URL`. No acepta credenciales legacy de Supabase como sustituto: no debe confundirse una base retirada con la producción actual. El modo predeterminado no escribe ni envía correos.

La conciliación paginada y el uso de manifiestos ya existían en main desde a44634f. Este cambio endurece la aplicación de reparaciones:

- El producto, tramo y monto provienen del manifiesto pendiente, nunca de inferir un libro por el total pagado.
- Un manifiesto inválido, pago sin manifiesto suficiente, recursos registrados contradictorios o descuento pendiente se dejan para revisión.
- `--aplicar` inserta juntos los recursos faltantes de una orden. El adaptador Neon emite una sola sentencia SQL; un conflicto revierte ese lote completo. Ante un fallo, volver a ejecutar primero el diagnóstico. No sobrescribe compras existentes.
- Los nuevos tokens de descarga usan 32 bytes aleatorios, no el número predecible de Flow. No se imprimen tokens ni correos de compradores. Los enlaces históricos no se rotan en este cambio.
- `--enviar-email` requiere `--aplicar`. El correo se intenta después de registrar la compra. Resend aceptado no equivale a correo entregado.

## Lo que este comando no garantiza

No es una cola durable de correo ni concilia automáticamente cupos o códigos de descuento. Si falla un correo tras la inserción, las compras quedan registradas y una nueva ejecución de `--aplicar` no las reenvía. Para obtener enlaces de esas compras, usar `/ebook/descargar`. No borrar compras para forzar el reenvío.

El resumen “registrada” indica presencia de compras en la base, no recepción de correo, descarga o completitud histórica de una orden cuyo manifiesto ya no existe. La recuperación automática de esos casos requiere evidencia adicional.

El cambio no se prueba haciendo compras, enviando emails reales ni alterando datos productivos. Las pruebas usan respuestas sintéticas y verifican no escritura por defecto, fallos de lectura, manifiestos, combos incompletos, tokens y conflicto de inserción.
