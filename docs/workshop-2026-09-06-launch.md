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
2. Faltan los nombres y contenidos definitivos de las cinco skills.

Todos los datos editoriales están centralizados en `lib/workshop-product.ts`.

## Activación técnica

1. Ejecutar `docs/superpowers/plans/2026-08-31-workshop-2026-09-06.sql` en Supabase y después `docs/superpowers/plans/2026-08-31-workshop-escalating-pricing.sql`.
2. Crear cinco carpetas dentro de `private/workshop-skills-2026-09-06/`. Cada carpeta debe contener un `SKILL.md` válido.
3. Ejecutar `npm run workshop:subir-skills`. El comando exige exactamente cinco skills, genera el ZIP, lo sube al bucket privado y verifica el objeto.
4. En Vercel configurar `WORKSHOP_ACCESS_SECRET` y `RESEND_WEBHOOK_SECRET`. Las demás variables `WORKSHOP_*` son respaldo; los enlaces también se pueden administrar desde el dashboard.
5. Después del primer deploy, crear en Resend un webhook para `https://www.crececonia.cl/api/webhooks/resend` con eventos `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.suppressed`, `email.opened` y `email.clicked`. Copiar su signing secret a `RESEND_WEBHOOK_SECRET`.
6. Abrir `/admin/workshop-2026-09-06?key=ADMIN_SECRET` y configurar Meet. Grabación, SKOOL y ZIP pueden publicarse después.
7. Realizar una compra real de monto bajo sólo si Flow permite un entorno sandbox separado; verificar pago, dos emails, sala, dos PDFs y dashboard. No probar el webhook final con una orden inventada.
8. Crear la rama, PR y revisar exclusivamente la Vercel Preview. El merge a `main` despliega producción.

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
