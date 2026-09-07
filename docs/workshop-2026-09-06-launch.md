# Lanzamiento · Workshop 6 de septiembre de 2026

## Decisiones confirmadas

- Inicio: domingo 6 de septiembre, 17:00 hora de Chile (`UTC-3` ese día).
- Precio escalonado sin techo: cinco cupos por tramo, comienza en `$20.000 CLP` y sube `$5.000 CLP` cada vez.
- La página comunica "pocos cupos" y nunca publica la capacidad.
- La prueba social muestra ventas pagadas del día sólo cuando son mayores que cero.
- Incluye sesión en vivo, grabación, los ebooks De cero a Claude en una semana y Claude a Nivel Experto, cinco skills y un mes de SKOOL.
- No se replica la presentación del relator ni el currículo extenso de la clase anterior.

## Supuestos que deben confirmarse antes de publicar

1. Fin: se configuró a las 20:00 (tres horas) para automatizaciones y metadatos.

Las cinco skills definitivas ya están empaquetadas: iniciar proyecto, armar contexto, investigar con evidencia, construir y verificar, y programar trabajo.

Todos los datos editoriales están centralizados en `lib/workshop-product.ts`.

## Activación técnica

1. La base vigente es Neon. Todo cambio nuevo se agrega como migración reversible en `database/migrations/` y se prueba primero en una rama temporal.
2. Crear cinco carpetas dentro de `private/workshop-skills-2026-09-06/`. Cada carpeta debe contener un `SKILL.md` válido.
3. Dejar los slides finales en `private/workshop-2026-09-06/slides-taller-claude-desktop.html` y la hoja de alumnos en `private/workshop-2026-09-06/HANDOUT-ALUMNOS.md`. No publicar `GUIA-RELATOR.md` ni `*.original.html`.
4. Ejecutar `npm run workshop:subir-recursos`. El comando exige exactamente cinco skills, genera el ZIP, sube ZIP + slides + hoja al Storage privado y verifica los tres objetos. `workshop:subir-skills` se conserva como alias compatible.
5. En Vercel configurar `WORKSHOP_ACCESS_SECRET` y `RESEND_WEBHOOK_SECRET`. Las demás variables `WORKSHOP_*` son respaldo; los enlaces también se administran desde el dashboard.
6. Después del primer deploy, crear en Resend un webhook para `https://www.crececonia.cl/api/webhooks/resend` con eventos `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.suppressed`, `email.opened` y `email.clicked`. Copiar su signing secret a `RESEND_WEBHOOK_SECRET`.
7. Abrir `/admin/workshop-2026-09-06?key=ADMIN_SECRET`. Pegar el enlace de la grabación en **Grabación del taller** y verificar que el archivo acepte lectores externos con el enlace. Configurar también SKOOL y correo de soporte.
8. En el bloque **Verificación operativa**, pulsar **Verificar ahora**. No enviar correos ni tráfico hasta que todos los controles estén verdes.
   La venta evergreen tiene además una barrera técnica: `/api/workshop/availability`, `/api/workshop/create`, los enlaces de recuperación de checkout y las altas manuales permanecen cerrados si falta sala, grabación públicamente accesible, slides, hoja, ZIP o SKOOL. Una grabación de Drive que redirija al login de Google se considera privada y bloquea ventas.
9. Para alumnos que perdieron el correo, compartir `/workshop-en-vivo-2026-09-06/acceso`; allí recuperan un enlace personal sin revelar si otro correo está registrado.
10. Cuando grabación y archivos estén verdes, usar **Enviar recursos a todos**. La entrega queda registrada y los eventos de Resend actualizan el dashboard.
11. Realizar una compra real de monto bajo sólo si Flow permite un entorno sandbox separado; verificar pago, correo de acceso, correo de ebooks, sala, grabación, slides, hoja, ZIP y dos PDFs. No probar el webhook final con una orden inventada.
12. Crear la rama, PR y revisar exclusivamente la Vercel Preview. El merge a `main` despliega producción.

## Ubicación y visibilidad de los archivos

| Recurso | Fuente local | Objeto privado | Visible para alumnos |
| --- | --- | --- | --- |
| Grabación | Google Drive u otro host de video | URL guardada desde el panel | Sí, sólo mediante la sala; el host debe permitir “cualquier persona con el enlace” |
| Slides finales | `private/workshop-2026-09-06/slides-taller-claude-desktop.html` | `workshop-assets/workshop-2026-09-06/slides-taller-claude-desktop.html` | Sí, con token de compra |
| Hoja de trabajo | `private/workshop-2026-09-06/HANDOUT-ALUMNOS.md` | `workshop-assets/workshop-2026-09-06/hoja-de-trabajo.md` | Sí, con token de compra |
| Cinco skills | `private/workshop-skills-2026-09-06/<skill>/SKILL.md` | `workshop-assets/workshop-2026-09-06/crececonia-pack-5-skills.zip` | Sí, como ZIP con token de compra |
| Guía del relator | `private/workshop-2026-09-06/GUIA-RELATOR.md` | No se sube | No |
| Slides originales | `private/workshop-2026-09-06/*.original.html` | No se suben | No |

Los objetos viven dentro del bucket privado configurado por `STORAGE_S3_*`. Nunca se colocan en `public/` ni se enlazan directamente: `/api/workshop/material` valida la firma y que la orden esté pagada antes de entregar bytes.

## Métricas del dashboard

- Visitas únicas por sesión.
- Inicios de checkout.
- Conversión visita → checkout.
- Conversión visita → venta.
- Finalización reserva → pago.
- Entradas pagadas y ventas del día.
- Recaudación total y del día.
- Ventas de la última hora.
- Ventas y recaudación por `utm_source`.
- Correos aceptados, entregados, rebotados y fallidos.
- Detalle por comprador y tipo de mensaje.

Para campañas usar enlaces con `utm_source`, por ejemplo `?utm_source=instagram&utm_medium=story&utm_campaign=workshop-septiembre`.
