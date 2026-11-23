# Entradas comerciales retiradas

`/protocolo-bpi` y `/solicitar-llamada` conservan una página explicativa para enlaces antiguos. Remiten a `/ia`, que permite elegir aprendizaje, mentoría o implementación. No reservan reuniones, ofrecen Test de Fit ni prometen duración o tiempo de respuesta. Se usa aviso, no redirección automática, para explicar el cambio a quienes llegan desde un correo antiguo.

La decisión comercial local del 20/09/2026 retiró BPI/Test de Fit. Este cambio no altera compras, historial de evaluaciones o llamadas, ni workshop. Se retiraron las referencias comerciales desde inicio, footer, llms.txt y sitemap. El modal de evaluación y su provider ya no se montan en el layout; sus archivos y componentes auxiliares se conservan, sin consumidores activos. ChatWidget funciona independientemente; sus respuestas de precio, plazo y orientación ya no ofrecen diagnóstico BPI.

Los eventos históricos de evaluación/agenda y su clasificación analítica se conservan. Las páginas nuevas no emiten eventos de solicitud o reserva. El flujo vigente sigue siendo ServiceLanding → QualificationForm → postulación persistida → conversación opcional por WhatsApp, sin reserva automática.

## Límite de esta etapa

Las APIs legacy `/api/public/evaluacion` y `/api/public/solicitar-llamada` conservan su contrato para evitar cambiar integraciones externas no inventariadas. Siguen admitiendo solicitudes directas; esta etapa retira las entradas de la interfaz, no desactiva esos endpoints. La notificación administrativa antigua puede incluir el enlace a la página retirada. Antes de cerrar esas APIs, revisar consumidores externos y definir una transición explícita. Ningún dato existente se borra.

Una agenda nueva requiere calendario comercial autorizado, duración, disponibilidad, buffers, antelación y política de cancelación. El antiguo texto de 30 minutos no define esos acuerdos.
