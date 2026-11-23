# Ficha comercial de servicios

`lib/service-offers.ts` comparte precios publicados, periodicidad, confirmaciones y opciones de calificación entre `/ia`, las fichas, metadata/JSON-LD y el formulario. `lib/service-qualification.ts` conserva validación, normalización y su export histórico de `SERVICE_BUDGETS`.

- Mentoría: desde $400.000 CLP mensuales. Trabajo y seguimiento semanal; 90 días es el horizonte del objetivo, no una duración contractual nueva. Ciclo, sesiones, calendario, entregables y renovación se acuerdan en propuesta.
- Implementación: desde $500.000 CLP + mantención desde $100.000 CLP mensuales. Alcance, inputs, responsables, aceptación, plazos y cobertura de mantención/soporte se acuerdan en propuesta.
- Precio final, impuestos aplicables y condiciones de pago se detallan antes de contratar; esta ficha no fija tasas, anticipos, SLA ni cantidades de sesiones.

## Compatibilidad

Los textos de rangos de presupuesto, disponibilidad y decisión son valores históricos persistidos de la API. Se conservan literalmente; no deben regenerarse desde el precio ni editarse como simple copy. La función común `qualifiesForService` evalúa las mismas combinaciones válidas que antes, incluido el mínimo de 20 caracteres de contexto sin espacios exteriores. La API sigue validando el payload completo. No cambian payload, UUID, fingerprint ni hash de idempotencia.

Las reservas automáticas están elegidas como siguiente capacidad, pero su configuración está pendiente. Este cambio mantiene registro + WhatsApp y no activa agenda ni inventa horarios. Una integración futura deberá tratar calificación y reserva como estados distintos, confirmar disponibilidad real y ofrecer confirmación de reserva sólo después de persistirla.
