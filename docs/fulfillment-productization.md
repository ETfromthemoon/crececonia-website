# Productización del Fulfillment — Sistema Interno

> Documento estratégico complementario a [`fulfillment-process.md`](./fulfillment-process.md).
> Define cómo convertir el proceso operativo manual en un servicio productificado donde Sergio hace inputs y el sistema entrega automáticamente al cliente.

---

## 1. Principio rector

> **Sergio interviene en decisiones, no en ejecución.**

Cada hora del consultor debe ir a: pensar, decidir, validar o vender. Todo lo demás (redactar, enviar, agendar, formatear, recordar, medir) lo hace el sistema.

### Tres tipos de tarea

| Tipo | Quién lo hace | Ejemplo |
|---|---|---|
| **Decisión** | Sergio (alto valor cognitivo) | Priorizar procesos por ROI, validar alcance, ajustar roadmap |
| **Generación** | Sistema (con AI + templates) | Redactar process map, calcular ROI, armar deck |
| **Logística** | Sistema (puro) | Agendar, enviar, recordar, facturar, medir |

**Objetivo cuantitativo:** reducir horas-Sergio por proyecto en ~60% sin reducir valor percibido.

| Servicio | Horas actuales (estimado) | Horas con sistema | Ahorro |
|---|---|---|---|
| Auditoría Express | ~30 h | ~12 h | 60% |
| Implementación | ~80 h | ~35 h | 56% |
| Implementación + 90 días | ~140 h | ~55 h | 60% |

---

## 2. Arquitectura del sistema interno

```
┌──────────────────────────────────────────────────────────────┐
│                  SERGIO (panel /admin)                       │
│   Inputs: formularios cortos, validaciones, decisiones       │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  ENGINE (Next.js + Supabase)                 │
│  • Estado del proyecto (máquina de estados)                  │
│  • Triggers por hito (cron + webhook)                        │
│  • AI generation (Claude API) con templates                  │
│  • PDF/Slide builder                                         │
│  • Scheduler (Cal.com)                                       │
└──────────────────────┬───────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  CLIENTE (canales automatizados)             │
│  • Email transaccional (Resend)                              │
│  • WhatsApp Business API                                     │
│  • Portal cliente (Notion auto-generado o /portal en app)    │
│  • Calendar invites                                          │
│  • PDFs y decks personalizados                               │
└──────────────────────────────────────────────────────────────┘
```

### Stack recomendado (coherente con lo ya instalado)

| Capa | Tool | Estado |
|---|---|---|
| Frontend admin | Next.js 16 (ya en uso) | ✅ Listo |
| Base de datos | Supabase (ya en uso) | ✅ Listo |
| Email | Resend (ya en uso) | ✅ Listo |
| AI generation | Anthropic API (Claude Sonnet 4.6) | 🆕 Integrar |
| Scheduling | Cal.com self-hosted o API | 🆕 Integrar |
| WhatsApp automation | WhatsApp Business Cloud API + n8n | 🆕 Integrar |
| PDF generation | `@react-pdf/renderer` o Puppeteer | 🆕 Integrar |
| Portal cliente | Página dinámica `/c/[client-slug]` en la misma app | 🆕 Construir |
| Forms intake | Forms nativos en Next.js + Supabase | 🆕 Construir |
| E-signature | PandaDoc API o DocuSeal (self-hosted) | 🆕 Integrar |
| Pagos | Stripe + MercadoPago | 🆕 Integrar |

---

## 3. Matriz INPUT → ENGINE → OUTPUT por servicio

### 3.1 Servicio 1 — Auditoría Express

#### Fase A — Onboarding

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Crear proyecto: nombre, contacto, WA, email, monto | Crea registro Supabase, slug único, link de portal | • Email de bienvenida con video personalizado<br>• Link al portal cliente `/c/empresa-acme`<br>• Acceso a cuestionario pre-auditoría<br>• Link Cal.com para agendar kick-off<br>• Mensaje WhatsApp de confirmación |
| (nada más) | Si cliente no completa cuestionario en 48 h → recordatorio automático | Recordatorio WA + email a las 48 h |

**Tiempo Sergio:** 5 min (vs 45 min manual)

#### Fase B — Levantamiento

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Lista de 3–5 personas a entrevistar (nombre, rol, email) | Engine envía invitaciones individuales con Cal.com | Cada entrevistado recibe link para auto-agendar entrevista 30 min |
| Tras cada entrevista: subir grabación o transcripción | • Transcripción AI (Whisper/Claude)<br>• Extracción estructurada: procesos mencionados, tiempo, frecuencia, herramientas | (interno, no se envía aún) |
| Validar/editar datos extraídos | Compila inventario consolidado de procesos candidatos | Update en portal cliente: "Levantamiento completado, análisis en curso" |

**Tiempo Sergio:** 4 h (vs 12 h manual) — la AI hace el primer draft estructurado, Sergio solo valida

#### Fase C — Análisis y entrega

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Priorizar top 3 procesos del listado | Engine ejecuta calculadora ROI con fórmulas definidas (tiempo × frecuencia × costo/hora del rol) | (interno) |
| Ajustar multiplicadores ROI si aplica | • AI genera process map por proceso (template + datos)<br>• AI genera hoja de ruta priorizada<br>• AI genera deck de presentación (8–12 slides)<br>• PDF builder consolida documento final | (interno, listo para revisión) |
| Revisar y aprobar deliverables (1 ronda de edits máx) | Engine versiona y empaca | • Email "Tu auditoría está lista" con PDFs adjuntos<br>• Update portal cliente con todos los assets<br>• Cal.com link para agendar presentación 60 min |
| Realizar presentación (única tarea no automatizable de esta fase) | Engine envía grabación + resumen post-meeting | • Email post-meeting con grabación, slides actualizados, próximos pasos<br>• NPS automático a las 24 h<br>• Si NPS ≥ 9 → pedir testimonial<br>• Si NPS < 7 → alerta interna a Sergio |

**Tiempo Sergio:** 3 h (vs 12 h manual)

---

### 3.2 Servicio 2 — Implementación

#### Fase A — Onboarding

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Aceptar propuesta (genera SOW desde template) | • Genera SOW desde plantilla<br>• Genera link de e-signature (PandaDoc/DocuSeal)<br>• Genera link de pago Stripe/MercadoPago (50% inicial) | • Email con propuesta firmable<br>• Link de pago<br>• Tras firma + pago: portal cliente activado |
| (nada hasta pago) | Detecta pago, dispara onboarding | • Email "Bienvenido, así trabajaremos"<br>• Cuestionario técnico (auto-form)<br>• Link Cal.com kick-off<br>• Acceso al portal con timeline visible |

**Tiempo Sergio:** 10 min

#### Fase B — Diagnóstico técnico

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Subir notas/grabación de kick-off | AI extrae: stakeholders, herramientas, restricciones, alcance preliminar | (interno) |
| Confirmar alcance del MVP | • AI redacta "Documento de validación de alcance"<br>• Genera diagrama técnico simple | • Email con doc de alcance<br>• Botón de aprobación en portal |
| Aprobación cliente recibida → engine avanza estado | Crea checklist de accesos requeridos | • Email con lista de accesos necesarios<br>• Tracker en portal: ✅ pendientes |

**Tiempo Sergio:** 3 h (de 8 h manuales)

#### Fase C — Construcción

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Updates semanales: "Esta semana construí X, Y, Z" (texto corto) | • AI redacta update profesional desde el bullet point<br>• Captura métricas de avance | • Email semanal "Reporte de avance semana N"<br>• Update visible en portal con % de progreso |
| Marcar hito "Demo lista" | Engine dispara invitación a demo | • Cal.com link para demo<br>• Recordatorio 24 h antes |

**Tiempo Sergio:** trabajo técnico (no automatizable) + 30 min/semana en updates (vs 2 h manual)

#### Fase D — Implementación y capacitación

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Confirmar fecha go-live | • Genera documento operativo desde template (datos del proyecto)<br>• Genera guía de usuario con AI<br>• Programa 2 sesiones de capacitación | • Email "Vamos a producción el día X"<br>• Documentación adjunta<br>• Calendar invites de capacitación |
| Marcar capacitaciones completadas | • Inicia período marcha blanca<br>• Activa daily check automático del sistema (uptime, errores) | • Mensaje WA diario solo si hay incidente |

**Tiempo Sergio:** sesiones de capacitación (2 h) + setup (no automatizable)

#### Fase E — Cierre

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Marcar "Listo para cierre" | • Genera informe de adopción semana 1 con datos del sistema<br>• Genera factura final 50% | • Email "Tu sistema está listo, aquí va el informe"<br>• PDF informe<br>• Link de pago final<br>• Cal.com cierre 30 min<br>• NPS survey a las 48 h |

**Tiempo Sergio:** 30 min (vs 4 h)

#### Fase F — Soporte 30 días

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| (solo si entra ticket) | • Cron semanal envía check-in WA<br>• Tracking de tickets vía form en portal<br>• Día 30: genera informe final desde datos | • Check-in WA semanal (template personalizado)<br>• Informe día 30 automático<br>• NPS final |

**Tiempo Sergio:** reactivo a tickets, ~1 h/semana en promedio (vs 4 h)

---

### 3.3 Servicio 3 — Implementación + 90 días

Idéntico al Servicio 2 hasta Fase F. Agregar:

#### Fases G/H/I — Seguimiento 90 días

| Sergio INPUT | Engine procesa | Cliente recibe (automático) |
|---|---|---|
| Configurar dashboard de adopción una vez (template) | • Cron quincenal lee métricas del sistema cliente vía API/webhook<br>• Actualiza dashboard automáticamente<br>• Programa 6 sesiones quincenales fijas en Cal.com | • Acceso a dashboard live<br>• Calendar invites de las 6 sesiones<br>• Recordatorios 24 h antes |
| Notas post-sesión (5 bullets) | AI redacta minuta + acciones | Email "Minuta sesión N + próximos pasos" |
| (sin input) | • Día 30, 60, 90: genera informe mensual con datos<br>• Día 90: calcula adopción final → si ≥70% genera certificado de cierre exitoso; si <70% genera plan de iteración | • Informes mensuales por email<br>• Día 90: certificado o plan según métrica<br>• NPS final |

**Tiempo Sergio:** 6 sesiones × 30 min + 6 × 5 min de notas = ~3.5 h en 90 días (vs 20 h)

---

## 4. Activos reutilizables a construir una sola vez

Estos son los "moldes" del sistema. Se construyen una vez y se llenan dinámicamente por proyecto.

### Templates de documentos (en `/templates`)

- [ ] `welcome-email-{servicio}.html` — email de bienvenida con video personalizado
- [ ] `proposal-{servicio}.mdx` — propuesta editable que se firma
- [ ] `sow-{servicio}.mdx` — Statement of Work con cláusulas estándar
- [ ] `audit-questionnaire.json` — schema del cuestionario pre-auditoría
- [ ] `tech-questionnaire.json` — schema del cuestionario técnico
- [ ] `interview-guide-{rol}.mdx` — guía por rol (operativo, gerencial, técnico)
- [ ] `process-map-template.mdx` — plantilla de mapa de proceso individual
- [ ] `roadmap-template.mdx` — plantilla de hoja de ruta
- [ ] `deck-template.pptx` o estructura JSON para slides
- [ ] `adoption-report-template.mdx` — informe mensual de adopción
- [ ] `final-report-90d.mdx` — informe final 90 días
- [ ] `nps-survey-config.json` — preguntas y triggers
- [ ] `weekly-update-prompt.txt` — prompt para AI que convierte bullets en update profesional
- [ ] `whatsapp-templates.json` — templates aprobados de WA Business

### Calculadoras

- [ ] **ROI Calculator** — fórmula: `(tiempo_proceso × frecuencia × costo_hora_rol × % automatizable) - costo_implementacion`
- [ ] **Adoption Calculator** — `usuarios_activos / usuarios_objetivo × 100`
- [ ] **Pricing Engine** — sugiere precio según industria, tamaño empresa, complejidad

### Portal cliente (`/c/[slug]`)

Página única por proyecto, accesible por link mágico (sin login). Muestra:
- Timeline visual del servicio con fase actual destacada
- Próximo paso y CTA (firmar, agendar, completar form)
- Documentos entregados (descargables)
- Métricas en vivo (adopción, tickets, próximas sesiones)
- Contacto rápido (botón WA directo a Sergio)

---

## 5. Máquina de estados del proyecto

Cada proyecto avanza por estados. Cada transición dispara automatizaciones.

```
prospecto
  → (llamada agendada) → diagnostico
    → (propuesta enviada) → propuesta_enviada
      → (pago recibido) → onboarding
        → (cuestionario completado) → diagnostico_tecnico [solo impl]
        → (cuestionario completado) → levantamiento [solo audit]
          → (datos validados) → analisis [audit] / construccion [impl]
            → (deliverables aprobados internamente) → entrega
              → (presentación realizada) → cierre
                → soporte [impl] / seguimiento_90d [90d] / cerrado [audit]
                  → (día 30 / día 90) → cerrado
```

Cada flecha = trigger de automatización (email, WA, calendar, doc generation, etc.).

---

## 6. Roadmap de construcción del sistema interno

Priorizado por **impacto en horas-Sergio × frecuencia de uso**.

### Sprint 1 — Foundation (semana 1–2)
**Meta:** poder operar un proyecto end-to-end con templates en vez de manual.

- [ ] Schema Supabase: `projects`, `clients`, `tasks`, `documents`, `events`
- [ ] Admin: CRUD de proyectos con estado y timeline
- [ ] Portal cliente `/c/[slug]` (read-only, sin autenticación, magic link)
- [ ] Templates de email transaccional en Resend (welcome, recordatorios)
- [ ] Integración Cal.com para scheduling

**Quick win:** onboarding y kick-off totalmente automatizados.

### Sprint 2 — AI Generation Layer (semana 3–4)
**Meta:** documentos del 80% de la calidad sin esfuerzo de Sergio.

- [ ] Integración Anthropic API
- [ ] Pipeline: transcripción → extracción estructurada → process map
- [ ] Generador de ROI calculator (página interactiva en portal cliente)
- [ ] PDF builder (react-pdf) para deliverables
- [ ] Auto-redactor de weekly updates desde bullets

**Quick win:** auditoría completa se genera sola con inputs mínimos.

### Sprint 3 — Sales Loop (semana 5)
**Meta:** cerrar ventas sin redactar propuestas a mano.

- [ ] Generador de propuestas desde formulario
- [ ] Integración e-signature (DocuSeal self-hosted recomendado)
- [ ] Integración pagos (Stripe + MercadoPago)
- [ ] Trigger: pago → activación de proyecto

### Sprint 4 — Engagement Loop (semana 6)
**Meta:** mantener contacto valioso sin trabajo manual.

- [ ] WhatsApp Business API + n8n para mensajes programados
- [ ] Cron jobs: check-ins, recordatorios, NPS
- [ ] Dashboard de adopción auto-actualizable
- [ ] Generador de informes mensuales

### Sprint 5 — Optimización y métricas (semana 7–8)
**Meta:** medir y mejorar el sistema mismo.

- [ ] Dashboard interno: horas-Sergio por proyecto, NPS promedio, tasa de adopción
- [ ] A/B testing de templates de email
- [ ] Análisis de fricción: ¿dónde abandonan los clientes el flujo?

---

## 7. Métricas del sistema (no del cliente)

Indicadores que miden si la productización está funcionando.

| Métrica | Target | Cómo se mide |
|---|---|---|
| Horas-Sergio por proyecto | -60% vs baseline | Tracking en tasks |
| % deliverables auto-generados | ≥ 80% | Documents tagged `ai_generated` / total |
| Touchpoints automatizados | ≥ 70% | Events tipo `auto` / total events |
| Tiempo entre "pago" y "primer entregable" | ≤ 24 h | Timestamps |
| NPS promedio | ≥ 9 | Survey aggregate |
| % proyectos sin escalación manual urgente | ≥ 85% | Tickets marcados `urgent` |
| MRR de servicios recurrentes (post-90d) | crecimiento mensual | Stripe revenue |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Cliente percibe que "es todo bot"** | Mantener video personal en welcome + 1 reunión humana clave por fase (kick-off, presentación, cierre) |
| **AI redacta algo incorrecto** | Sergio aprueba antes de enviar cualquier deliverable client-facing (1 click de aprobación, no edición) |
| **Sistema falla en momento crítico** | Fallback manual claro: si engine no genera doc en 1 h, alerta a Sergio para hacerlo manual |
| **Lock-in con vendors externos** | Preferir tools self-hostables o con export limpio (DocuSeal vs DocuSign, Cal.com vs Calendly) |
| **Datos sensibles del cliente** | Cifrar at-rest en Supabase, no enviar grabaciones a Anthropic API (solo transcripción) |
| **Sobre-automatización mata el toque consultor** | Reservar 3 momentos "humanos premium" por proyecto: kick-off, presentación, cierre — todo el resto puede ser automatizado sin perder valor |

---

## 9. Asimetría clave de la productización

> El **cliente** debe sentir más atención, no menos.

La automatización bien hecha aparece como:
- "Wow, qué rápido respondieron"
- "Tienen el proceso súper claro"
- "Cada cosa llegó cuando la necesitaba"

La automatización mal hecha aparece como:
- "Esto se siente impersonal"
- "Me mandaron un email genérico"
- "Se nota que es plantilla"

**Diferencia:** la buena automatización usa los datos del cliente para parecer hecha a mano. Cada email menciona su empresa, su industria, su contacto específico, la fase actual. El video de bienvenida tiene el nombre del cliente al inicio (grabado por Sergio una vez por persona, no por cliente).

---

## 10. Próximos pasos sugeridos

1. **Validar el approach con un cliente real** — correr un proyecto en paralelo (manual + sistema parcial) y medir tiempo y NPS
2. **Construir Sprint 1** — sin AI, solo templates + estados + portal. Ya capturas 30% de los ahorros
3. **Sumar capa AI cuando el flujo manual ya funciona** — no automatizar el caos
4. **Iterar templates con datos reales** — los primeros 3 proyectos definen los moldes definitivos
