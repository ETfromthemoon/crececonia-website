# Operación del marketplace de ebooks

Actualizado: 15 de noviembre de 2026. Alcance inicial: autores de Chile, precios CLP y ebooks de IA, tecnología y negocios. CrececonIA cobra en su cuenta Flow existente, retiene el 5 % del precio final y carga el costo real de Flow al vendedor. Las boletas o vouchers se emiten o validan manualmente y su referencia se registra en el panel.

## Estado técnico comprobado

- Neon producción tiene las migraciones `20261112_001`, `20261113_001`–`003`, `20261115_001`–`006` y `20261116_001`–`006`. Las migraciones financieras se probaron primero en una rama aislada con compras, reembolsos y liquidaciones sintéticos revertidos. No había pedidos ni autores de terceros previos a la apertura.
- Respaldo previo: snapshot `snap-noisy-poetry-ack3ftal` de la rama principal, creado el 15 de noviembre de 2026. Neon rechazó un segundo snapshot por límite de cuota; conservar el primero y las migraciones reversibles versionadas.
- La tienda y el checkout se activan por separado mediante `MARKETPLACE_PUBLIC_ENABLED` y `MARKETPLACE_LIVE_ENABLED` en Vercel. `FLOW_SANDBOX=false`, `MARKETPLACE_SITE_URL=https://www.crececonia.cl`, `MARKETPLACE_DOWNLOAD_SECRET`, `MARKETPLACE_SESSION_SECRET` y `MARKETPLACE_HEALTH_SECRET` están configurados para producción. No guardar sus valores en Git.
- El panel [Administración del marketplace](https://www.crececonia.cl/admin/marketplace) usa la sesión administrativa existente. Las identidades de vendedores, pedidos, pagos, evidencias y liquidaciones quedan en Neon; los PDF y portadas quedan en almacenamiento S3 privado.
- El vendedor puede registrarse con enlace por correo, completar RUT y perfil, subir PDF y portada privados, y enviar un libro a revisión. Cada archivo admite hasta 4 MiB en esta versión. Nadie publica directamente: se exige revisión de identidad, situación tributaria, derechos, contenido, PDF y portada, seguida de una comprobación final registrada. Las ventas se ocultan si la verificación tributaria supera seis meses sin renovarse.
- El pago Flow se confirma en una única transacción PostgreSQL. La tarifa real se descuenta del saldo del vendedor; si Flow no la informa, el panel permite conciliarla contra el estado de cuenta. Un pago sin tarifa completa o sin respaldo fiscal no se puede liquidar. Reembolsos y contracargos confirmados externamente se registran con reverso y revocación de descarga.

## Verificación de apertura

1. Desplegar la rama a producción con ambos flags apagados y comprobar el build y CI.
2. Ejecutar `POST /api/admin/marketplace/health` con `x-marketplace-health-key`: confirma escritura, lectura y borrado de un objeto S3 temporal, contrato de un pago anterior en la cuenta Flow de producción y dominio verificado en Resend. Exigir respuesta HTTP 200 con todos los indicadores verdaderos; no compartir la clave ni rutas de archivos.
3. Activar primero `MARKETPLACE_PUBLIC_ENABLED=true` y después `MARKETPLACE_LIVE_ENABLED=true`, con un único redespliegue controlado. Comprobar `/ebooks/mercado`, `/ebooks/vender` y `/admin/marketplace`; el último redirige a `/admin/login` sin sesión.
4. Antes de aprobar el primer libro: comprobar RUT, inicio de actividades y cumplimiento tributario del autor, derechos sobre texto/portada, y revisar el PDF de forma segura. Determinar si la venta corresponde a `tax_inclusive` o `exempt`; para el caso afecto el precio incluye el IVA de 19 %. Repetir la verificación tributaria al menos semestralmente, según el [SII](https://www.sii.cl/destacados/ley_cumplimiento_obligaciones_tributarias/incumplimiento_inicio.html).
5. En la primera venta real, verificar callback, correo, descarga, evidencia de boleta o voucher, tarifa Flow y saldo del autor antes de transferir dinero. Registrar cada transferencia bancaria en el panel después de ejecutarla externamente. Las devoluciones se ejecutan fuera de la aplicación y luego se registran con la referencia de Flow; las notas de crédito se gestionan en contabilidad manual.

## Límites operativos

- La aplicación no emite DTE ni transfiere fondos automáticamente. El administrador debe conciliar cada venta, documento, reverso y pago al autor. El [SII explica](https://www.sii.cl/destacados/operacion_iva/) que el voucher puede reemplazar la boleta según el modelo de emisión declarado; no duplicar documentos.
- Los archivos se inspeccionan manualmente antes de publicar; no hay escaneo antimalware automático ni subida de archivos mayores de 4 MiB. Si un autor necesita un ebook más grande, ampliar la carga privada antes de aceptarlo.
- El marketplace puede abrir sin libros publicados. El catálogo se llenará solo después de las aprobaciones finales; los ebooks propios siguen disponibles en `/ebooks`.
