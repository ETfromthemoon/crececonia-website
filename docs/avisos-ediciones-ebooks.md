# Avisos de nuevas ediciones de ebooks

El envío se inicia manualmente, después de publicar y verificar los PDF. No se dispara al actualizar un archivo. Cada campaña tiene un manifiesto versionado en `editions/<id>.json` con los libros afectados, texto del cambio y SHA-256 de ambos formatos.

1. Crear el manifiesto con un ID nuevo; no reutilizar el ID de otra edición. El correo incluye solo los libros comprados por cada persona.
2. Subir los PDF al almacenamiento privado y comprobar su entrega.
3. Ejecutar el workflow **Avisar edición de ebooks** en modo `preview`. Verifica mediante el endpoint de descarga autorizado que los PDF en producción coincidan con las huellas y muestra el número de destinatarios.
4. Ejecutarlo en modo `test` con `test_email` propio. El mensaje de prueba contiene enlaces reales; confirmar recepción y descarga.
5. Ejecutarlo en modo `send` para avisar a compradores. Usa el secreto `RESEND_API_KEY` que ya existe en GitHub Actions y requiere agregar `DATABASE_URL` como secreto del repositorio. Nunca guardar claves en código, manifiestos ni inputs del workflow.

El registro duradero vive en `commerce.ebook_edition_notices`; aplicar primero la migración `20261125_001_ebook_edition_notices.up.sql` en una rama temporal y luego en producción. `edition_id` + email es único. Un envío aceptado queda registrado. Si la llamada a Resend o la actualización del registro falla, la fila queda en `review` o `sending` y el script se detiene. **No borrar ni reintentar esas filas automáticamente:** comprobar en Resend si el mensaje fue aceptado antes de resolverlas. Al repetir `send`, solo se envía a personas que aún no tienen fila. Cambiar el manifiesto tras iniciar una campaña está bloqueado; crear otra edición con otro ID.

Localmente: `npm run ebook:avisar-edicion -- editions/<id>.json preview|test <email>|send`, con `DATABASE_URL` y, para test/send, `RESEND_API_KEY` en el entorno. El script anterior `scripts/avisar-nueva-edicion.ts` queda como legado y no debe ejecutarse para esta campaña: usa un registro local distinto y podría duplicar mensajes.
