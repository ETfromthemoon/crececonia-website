# Proceso de Fulfillment — CrececonIA

> **Consultor:** Sergio Astudillo  
> **Negocio:** Consultoría de implementación de IA en empresas medianas  
> **Contacto comercial:** WhatsApp +56 9 6194 5206 | hola@crececonia.cl  
> **Plataforma:** crececonia.cl

---

## Contexto del modelo de negocio

Sergio vende tres servicios de consultoría IA. El ciclo de venta inicia cuando el prospecto escribe por WhatsApp o completa el formulario de la landing. Todos los servicios se pagan **contra entregables**, no contra horas.

| Servicio | Precio | Duración |
|---|---|---|
| Auditoría Express | USD 500 | 2 semanas |
| Implementación | desde USD 1.200 | 6–8 semanas |
| Implementación + 90 días | desde USD 3.000 | ~5 meses |

---

## Flujo de entrada (pre-venta, común a todos los servicios)

```
WhatsApp / Formulario web
        ↓
Llamada de diagnóstico (30 min, gratuita)
        ↓
Propuesta enviada por WhatsApp/email
        ↓
Pago confirma inicio del servicio
```

### Checklist: Llamada de diagnóstico (Step 0 — gratuito)

> Guía completa del proceso de diagnóstico en [`diagnostic-process.md`](./diagnostic-process.md).

- [ ] Enviar cuestionario pre-llamada automático al agendar (8 preguntas, ~5 min)
- [ ] Revisar respuestas y buscar empresa 15 min antes de conectarse
- [ ] Ejecutar la llamada de 30 min en 5 segmentos (apertura, descubrimiento, técnico, estratégico, cierre)
- [ ] Completar Matriz de Puntuación de Fit post-llamada (score 0–45)
- [ ] Registrar resultado en sistema interno: `fit-alto / fit-medio / fit-bajo / no-fit / pendiente`
- [ ] Enviar WhatsApp de seguimiento inmediato
- [ ] Enviar propuesta personalizada dentro de las 24 h si aplica

---

## Servicio 1: Auditoría Express

**Precio:** USD 500  
**Duración:** 2 semanas  
**Entregable final:** Mapa de procesos priorizado + ROI estimado + hoja de ruta ejecutable

### Fase A — Onboarding (Día 0–2)

- [ ] Recibir confirmación de pago (100% por adelantado)
- [ ] Crear registro del cliente en sistema interno con fecha de inicio
- [ ] Enviar cuestionario pre-auditoría (herramientas usadas, tamaño equipo, industria, principales cuellos de botella)
- [ ] Agendar kick-off call (60 min) con dueño o gerente
- [ ] Confirmar disponibilidad de 3–5 personas del equipo para entrevistas

### Fase B — Levantamiento (Semana 1)

- [ ] **Kick-off call** con dueño/gerente: confirmar alcance, definir áreas a auditar, establecer canal de comunicación
- [ ] **Entrevistas individuales** con 3–5 personas clave del equipo (30 min c/u) — preguntas tipo: qué haces en un día típico, qué te quita más tiempo, qué repetirías si pudieras automatizarlo
- [ ] **Observación de proceso en vivo** (videollamada o grabación de pantalla) de los 2–3 procesos más mencionados
- [ ] **Inventario de herramientas**: CRM, ERP, hojas de cálculo, apps de comunicación, herramientas ad-hoc
- [ ] **Mapeo inicial**: listar todos los procesos candidatos a IA con frecuencia, volumen y tiempo invertido

### Fase C — Análisis y entrega (Semana 2)

- [ ] **Priorización** por matriz impacto × esfuerzo × ROI real
- [ ] Seleccionar los **3 procesos de mayor impacto** a documentar en profundidad
- [ ] Redactar **mapa de procesos candidatos**: descripción, actores, herramientas involucradas, fricción actual
- [ ] Calcular **ROI estimado** por área (tiempo ahorrado × costo/hora del rol)
- [ ] Construir **hoja de ruta priorizada** con orden de implementación sugerido
- [ ] Preparar presentación ejecutiva (deck de 8–12 slides o documento)
- [ ] **Reunión de presentación de resultados** (60 min) con cliente
- [ ] Enviar documento final (PDF + acceso editable si aplica) dentro de las 24 h post-presentación
- [ ] Enviar **encuesta de satisfacción NPS** (3 preguntas, link)
- [ ] Registrar resultado en sistema interno: `entregado / revisión pendiente / cierre`

### Criterio de calidad — Auditoría Express

| Métrica | Umbral mínimo |
|---|---|
| Procesos documentados | ≥ 3 |
| ROI estimado calculado | Sí (en USD o % reducción de tiempo) |
| Hoja de ruta entregada | Sí, con orden de prioridad |
| NPS del cliente | ≥ 8 |
| Días de entrega desde pago | ≤ 14 |

---

## Servicio 2: Implementación

**Precio:** desde USD 1.200  
**Duración:** 6–8 semanas  
**Entregable final:** Sistema IA en producción + equipo capacitado + 30 días de soporte + métricas de adopción

### Estructura de pago

| Hito | % | Momento |
|---|---|---|
| Inicio | 50% | Al firmar el acuerdo |
| Cierre | 50% | Al entregar el sistema en producción |

### Fase A — Onboarding (Días 0–3)

- [ ] Recibir pago inicial (50%)
- [ ] Crear registro del proyecto en sistema interno con: cliente, servicio, fecha inicio, fecha estimada cierre, monto total
- [ ] Enviar y firmar **acuerdo de servicio** (alcance, hitos, condiciones de pago)
- [ ] Enviar **cuestionario técnico**: herramientas en uso, accesos disponibles, restricciones de seguridad/privacidad, stack técnico actual
- [ ] Agendar **kick-off call** con stakeholders (dueño + responsable técnico del lado del cliente)

### Fase B — Diagnóstico técnico (Semana 1–2)

- [ ] **Kick-off call** con stakeholders: validar alcance, definir MVP del sistema IA, alinear expectativas
- [ ] **Inventario de integraciones**: CRM, ERP, bases de datos, APIs disponibles, hojas de cálculo clave
- [ ] Recibir y validar **accesos a sistemas** necesarios (solo los mínimos necesarios)
- [ ] **Mapeo técnico del proceso target**: inputs, outputs, actores, volumen, frecuencia
- [ ] Definir **alcance del MVP**: qué entra, qué queda fuera para una fase 2
- [ ] Enviar **documento de validación de alcance** al cliente para firma/aprobación
- [ ] Establecer **canal de comunicación principal** (WhatsApp Business, Slack, email)

### Fase C — Construcción (Semana 3–5)

- [ ] Desarrollo o configuración del sistema IA (LLM, automatización, agente, etc.)
- [ ] Configurar integraciones con herramientas del cliente
- [ ] Pruebas internas (QA): casos base + casos borde
- [ ] **Demo al cliente** (semana 5): mostrar MVP en funcionamiento, recoger feedback
- [ ] Ajustes post-demo (máximo 2 rondas de revisión dentro del alcance)

### Fase D — Implementación y capacitación (Semana 6–7)

- [ ] **Instalación en entorno de producción** del cliente
- [ ] **Sesión de capacitación 1** (60 min): uso básico del sistema, flujo de trabajo, preguntas frecuentes
- [ ] **Sesión de capacitación 2** (45 min): casos avanzados, troubleshooting, cómo escalar
- [ ] Entrega de **documentación operativa**: guía de uso, preguntas frecuentes, contacto de soporte
- [ ] Inicio de **período de marcha blanca** (1 semana con supervisión activa)

### Fase E — Cierre (Semana 8)

- [ ] Reunión de cierre (30 min): revisión de métricas de adopción semana 1
- [ ] Recibir **pago final** (50%)
- [ ] Enviar **informe de adopción** (% de uso, errores detectados, ajustes realizados)
- [ ] Entregar repositorio/accesos finales del sistema
- [ ] Confirmar inicio del **período de soporte post-lanzamiento** (30 días calendario)
- [ ] Enviar **encuesta de satisfacción NPS**

### Fase F — Soporte post-lanzamiento (Días 1–30)

- [ ] Check-in por WhatsApp semana 1 (¿está funcionando? ¿algún bloqueo?)
- [ ] Check-in por WhatsApp semana 2
- [ ] Check-in por WhatsApp semana 3
- [ ] Resolver bugs y ajustes menores (sin costo si están dentro del alcance original)
- [ ] **Métricas de adopción al día 30**: % de uso del equipo, tickets/errores reportados
- [ ] Entregar **informe final de soporte** (adopción %, incidencias, recomendaciones)
- [ ] Registrar proyecto como `cerrado` en sistema interno

### Criterio de calidad — Implementación

| Métrica | Umbral mínimo |
|---|---|
| Sistema en producción | Sí, funcional al 100% del alcance acordado |
| Sesiones de capacitación | ≥ 2 completadas |
| Documentación operativa entregada | Sí |
| Adopción día 30 | ≥ 50% del equipo objetivo usando el sistema |
| NPS del cliente | ≥ 8 |
| Semanas de entrega desde pago inicial | ≤ 8 |

---

## Servicio 3: Implementación + 90 días

**Precio:** desde USD 3.000  
**Duración:** ~5 meses (implementación 6–8 semanas + seguimiento 90 días)  
**Entregable final:** Sistema consolidado + adopción medida ≥70% al día 90 o iteración sin costo

### Estructura de pago

| Hito | % | Momento |
|---|---|---|
| Inicio | 40% | Al firmar el acuerdo |
| Sistema en producción | 30% | Semana 8 (cierre de implementación) |
| Cierre de seguimiento | 30% | Día 90 |

### Fases A–F (idénticas al Servicio 2)

Seguir el checklist completo del **Servicio 2: Implementación** (Fases A–F).

> **Diferencia clave:** El acuerdo de servicio y la propuesta deben especificar explícitamente la cláusula de adopción: *"Si la métrica de adopción al día 90 es inferior al 70%, se realiza una iteración adicional sin costo."*

---

### Fase G — Seguimiento mes 1 (Días 1–30 post-lanzamiento)

- [ ] **Dashboard de adopción configurado** (Notion, Google Sheets, o herramienta acordada) con métricas clave visibles para el cliente
- [ ] **Sesión quincenal #1** (30 min, día ~15): revisión de métricas, bloqueos, ajustes de usabilidad
- [ ] **Sesión quincenal #2** (30 min, día ~30): revisión de adopción, ajustes de proceso si hay fricción
- [ ] Resolver incidencias reportadas entre sesiones (soporte prioritario por WhatsApp, SLA 4 h hábiles)
- [ ] Actualizar dashboard con datos mes 1
- [ ] **Informe mensual #1**: adopción actual, tendencia, próximos pasos

### Fase H — Seguimiento mes 2 (Días 31–60)

- [ ] **Sesión quincenal #3** (30 min, día ~45): ¿el equipo está usando el sistema solo? ¿hay dependencia del consultor?
- [ ] **Sesión quincenal #4** (30 min, día ~60): revisión de casos de uso expandidos, nuevas ideas de mejora
- [ ] Si adopción < 50% al día 45: sesión adicional de reentrenamiento del equipo (sin costo)
- [ ] Actualizar dashboard con datos mes 2
- [ ] **Informe mensual #2**: tendencia de adopción, incidencias resueltas, recomendaciones de evolución

### Fase I — Seguimiento mes 3 y cierre (Días 61–90)

- [ ] **Sesión quincenal #5** (30 min, día ~75): revisión de indicadores, plan de continuidad autónoma
- [ ] **Sesión quincenal #6** (30 min, día ~90): reunión de cierre del programa
- [ ] Actualizar dashboard con datos mes 3
- [ ] **Medir adopción día 90**: % del equipo objetivo usando el sistema regularmente
  - Si adopción ≥ 70% → **Cierre exitoso**
  - Si adopción < 70% → Activar ciclo adicional de iteración gratuita (definir alcance en reunión)
- [ ] Recibir **pago final** (30%)
- [ ] Entregar **informe final día 90**: adopción, impacto medido, ROI real vs estimado, recomendaciones de fase 2
- [ ] Enviar **encuesta de satisfacción NPS**
- [ ] Registrar proyecto como `cerrado` en sistema interno
- [ ] Evaluar si el cliente tiene potencial para **Fase 2** (nuevos procesos, expansión del sistema)

### Criterio de calidad — Implementación + 90 días

| Métrica | Umbral mínimo |
|---|---|
| Sistema en producción | Sí, funcional al 100% del alcance acordado |
| Sesiones de seguimiento completadas | ≥ 6 (2 por mes) |
| Dashboard de adopción activo | Sí, con datos actualizados cada 15 días |
| Adopción día 90 | ≥ 70% del equipo objetivo |
| NPS del cliente | ≥ 9 |
| SLA de respuesta soporte | ≤ 4 horas hábiles |

---

## Estados de proyecto en sistema interno

Cada proyecto debe tener uno de los siguientes estados en cualquier momento:

| Estado | Descripción |
|---|---|
| `prospecto` | Hubo contacto inicial, pendiente llamada de diagnóstico |
| `diagnóstico` | Llamada de diagnóstico completada, propuesta pendiente |
| `propuesta-enviada` | Propuesta enviada, esperando decisión del cliente |
| `en-onboarding` | Pago recibido, iniciando proceso |
| `en-ejecución` | Trabajo activo en curso |
| `en-soporte` | Sistema entregado, dentro del período de soporte |
| `en-seguimiento` | Solo para Servicio 3: dentro de los 90 días de seguimiento |
| `cerrado-exitoso` | Proyecto completado, métricas cumplidas |
| `cerrado-cancelado` | Cliente canceló o no se completó el servicio |
| `iteración` | Ciclo de mejora activado por no cumplir métrica de adopción |

---

## Campos mínimos por proyecto en sistema interno

```
id               — UUID único
cliente_nombre   — Nombre de la empresa o persona
cliente_contacto — Nombre del contacto principal
cliente_wa       — Número WhatsApp (+56...)
cliente_email    — Email de facturación
servicio         — "auditoria" | "implementacion" | "implementacion-90"
precio_usd       — Monto total acordado en USD
fecha_inicio     — Fecha de primer pago
fecha_estimada   — Fecha estimada de cierre
fecha_cierre     — Fecha real de cierre (null si activo)
estado           — Ver tabla de estados arriba
adopcion_d30     — % adopción al día 30 (null si no aplica)
adopcion_d90     — % adopción al día 90 (null si no aplica)
nps              — Score NPS del cliente (0-10)
notas            — Campo libre para contexto
checklist_json   — JSON con el estado de cada item del checklist
```

---

## Notas operativas

- **Canal principal:** WhatsApp Business +56 9 6194 5206
- **Email:** hola@crececonia.cl
- **Facturación:** desde Chile, acepta USD y CLP
- **Sin contrato anual:** cada servicio es un engagement independiente
- **Pago contra entregables:** el consultor no cobra por horas sino por resultados verificables
- **Cláusula de adopción (solo Servicio 3):** si adopción día 90 < 70%, hay iteración gratuita hasta lograrlo
