# UI pública unificada

Implementación del plan aprobado el 29 de septiembre de 2026. Solo presentación y navegación: no cambia rutas, catálogo, APIs, base de datos, precios ni reglas de pago.

- Cabecera común en catálogo y fichas de ebooks; Recursos activo en guías/skills/ebooks.
- Navegación secundaria compartida y selector plegable de ebooks.
- Inicio más compacto, biblioteca integrada; se retira el popup automático global.
- Catálogo muestra libros antes de la explicación de modalidades; tarjetas alineadas.
- Guías con índice generado desde títulos existentes, lectura abierta y código copiable intacto.
- Skills con resumen breve, descarga directa y procedencia plegable; recursos sin ZIP se presentan como lectura.
- Ficha Claude con muestra e índice antes de compra; información ampliada conservada en desplegable.
- Extras de compra plegables; combos preseleccionados siguen visibles. Estado de precio pendiente/error sin cifra provisional, reintento y bloqueo del botón hasta disponer de precio válido.
- Ayuda móvil integrada al final del documento, no flotando sobre la lectura. Panel abierto sigue disponible con cierre y Escape.

## Verificación

Ejecutar `npm test` y `npm run build`. Revisar exclusivamente en Vercel Preview (no servidor local): inicio, /ebooks, /centro/guias, /centro/skills, una guía, una skill y ficha de ebook en 375/768/1280 px; menú móvil, índice, extras, precio y ayuda. No enviar una compra real.

No fusionar automáticamente: Sergio revisa el PR y su previsualización antes de producción. Reversión: revertir el commit UI, sin migraciones ni operaciones sobre datos.
