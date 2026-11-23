# Promoción de ebooks — 7 de noviembre de 2026

Promoción aprobada para producción: desde que se despliegue el 7 de noviembre hasta `2026-11-08T00:00:00-03:00` (Santiago). Fuera de esa ventana el motor conserva las tarifas habituales. No requiere cron, cupón ni modificación de tablas.

- Individuales: 50% sobre bases fijas de $17.900 / $13.700 / $9.700.
- Todos los bundles: 50% sobre el precio habitual del combo.
- Colección Web: antes $32.100, hoy $16.050.
- Bases fijadas en `lib/ebook-promotion.ts`, sin cambiar cupos ni precios de los tiers. La mitad se calcula sobre el total habitual; no admite códigos adicionales.
- Totales: individuales $8.950 / $6.850 / $4.850; Operador, Constructor y Automatización $14.220; Negocio $16.110; pack original $25.280; colección Web $16.050.

Catálogo, heroes y checkout usan la misma regla. La API de precios conserva `price` como precio de tramo y añade `salePrice`, `pricingTime` y `promotionEndsAt`, con `Cache-Control: no-store`. El formulario manda `expectedAmount`: el servidor rechaza con 409 un total desactualizado antes de persistir una orden o llamar a Flow. La confirmación y la entrega siguen leyendo el manifiesto con el monto real, sin recalcular promociones.

El cierre se aplica a nuevas órdenes. Una orden ya creada en Flow antes del cierre puede pagarse después: no se implementa cancelación retroactiva de pagos. Los eventos de creación de checkout incluyen `promotion_id: flash-2026-11-07`.

Para publicar: seguir el flujo Git/PR del proyecto con autorización explícita de publicación del usuario. Verificar catálogo, precio individual y bundles en Vercel Preview y después en producción. No iniciar cobros reales de prueba. Reversión anticipada: retirar la ventana de promoción y desplegar; los manifiestos de órdenes previas permanecen válidos.

## Verificación local

- `npm test`: 460 pruebas aprobadas, 55 archivos.
- `npm run build`: aprobado, incluyendo TypeScript.
- `git diff --check`: aprobado.
- `npm run ebook:verificar`: no completado por ausencia de credenciales de Storage en el entorno local (el adaptador cae al fallback Supabase). No demuestra un fallo de entrega en producción.
- El estado final de Preview y producción se registra en la PR de la promoción.
