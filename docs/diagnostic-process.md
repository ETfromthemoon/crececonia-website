# Proceso de Diagnóstico Inicial — CrececonIA

> **Consultor:** Sergio Astudillo  
> **Propósito:** Guía completa para la llamada de diagnóstico gratuita (Step 0 del pipeline)  
> **Duración:** 30 minutos  
> **Complementa:** [`fulfillment-process.md`](./fulfillment-process.md)

---

## 1. Posición en el pipeline

La llamada de diagnóstico es el paso que convierte un `prospecto` en un `diagnóstico` y determina si existe fit real para proponer un servicio.

```
WhatsApp / Formulario web
        ↓
[CUESTIONARIO PRE-LLAMADA — automático]
        ↓
LLAMADA DE DIAGNÓSTICO (30 min) ← Este documento
        ↓
        ├── Fit alto/medio → propuesta enviada en 24 h → estado: propuesta-enviada
        └── No-fit          → cierre respetuoso + recomendación alternativa
```

**Resultado esperado de este documento:** al final de la llamada, Sergio puede responder:
1. ¿Hay un problema real que la IA puede resolver?
2. ¿El cliente tiene capacidad técnica y cultural mínima para implementarlo?
3. ¿Qué servicio tiene más sentido proponer?
4. ¿Cuánto puede valer eso para su negocio?

---

## 2. Cuestionario pre-llamada (envío automático al agendar)

El cliente completa este formulario antes de la videollamada. Sergio lo lee 15 minutos antes de conectarse.

### Preguntas del formulario (8 preguntas, ~5 min para responder)

| # | Pregunta | Tipo de campo |
|---|----------|---------------|
| 1 | ¿Cuál es el nombre de tu empresa y a qué se dedica? | Texto corto |
| 2 | ¿Cuántas personas trabajan en la empresa? | Opciones: 1–10 / 11–30 / 31–100 / 100+ |
| 3 | ¿Cuál es tu rol en la empresa? | Texto corto |
| 4 | ¿Cuál es el proceso o tarea que más tiempo le consume a tu equipo hoy? | Texto libre |
| 5 | ¿Ya usan alguna herramienta de IA (ChatGPT, Copilot, etc.)? | Opciones: No / Sí, ocasionalmente / Sí, regularmente |
| 6 | ¿Qué resultado concreto esperarías de trabajar con nosotros? | Texto libre |
| 7 | ¿Cuál es tu horizonte de decisión? | Opciones: Esta semana / Este mes / En 2–3 meses / Solo explorando |
| 8 | ¿Hay algo específico que quieras asegurarte de preguntarme en la llamada? | Texto libre |

**Nota operativa:** si el cliente no completa el formulario 24 h antes de la llamada, enviar recordatorio por WhatsApp. Si tampoco responde 2 h antes, continuar sin él — no cancelar.

---

## 3. Preparación de Sergio (15 min antes de la llamada)

### Checklist pre-llamada

- [ ] Leer respuestas del cuestionario pre-llamada
- [ ] Buscar la empresa en LinkedIn / web corporativa (1–2 min) — entender industria, tamaño real, presencia digital
- [ ] Identificar el proceso mencionado en pregunta 4 y pensar en 2–3 preguntas específicas sobre ese proceso
- [ ] Estimar mentalmente si el caso encaja en Auditoría Express, Implementación u otro
- [ ] Abrir el sistema interno para registrar notas en tiempo real durante la llamada
- [ ] Tener la calculadora de ROI mental: `tiempo × frecuencia × costo hora del rol`

---

## 4. Estructura de la llamada (30 minutos)

### Segmento 1 — Apertura y encuadre (3 min)

**Objetivo:** generar confianza, establecer la agenda, liberar al cliente de tener que vender.

**Guión de apertura:**

> "Hola [nombre], gracias por tomarte el tiempo. Esta llamada es mía para entenderte a ti, no para presentarte nada. Al final de los 30 minutos te digo honestamente si creo que puedo ayudarte, cómo, y con qué inversión — y si no hay fit real, también te lo digo, para no hacerle perder el tiempo a ninguno."

> "Para arrancar, ¿me puedes dar en 2–3 frases qué hace [empresa] y cuál es el momento que está viviendo el negocio?"

**Por qué funciona:** da al cliente espacio para hablar de lo que conoce mejor (su negocio), reduce ansiedad de "me van a vender algo", y posiciona al consultor como alguien que filtra en vez de cerrar a toda costa.

---

### Segmento 2 — Descubrimiento operacional (12 min)

**Objetivo:** entender los procesos reales, cuánto tiempo consumen y cuál es el dolor económico.

**Preguntas de apertura (elegir 1–2 según lo que dijo el cuestionario):**

- "Mencionaste que [proceso X] les quita mucho tiempo. ¿Quién hace ese proceso hoy? ¿Con qué frecuencia?"
- "Descríbeme cómo se ve un día típico para [el rol que hace ese proceso]."
- "Si tuvieras que eliminar una tarea de tu operación mañana, ¿cuál sería?"

**Preguntas de profundización (usar cuando haya un proceso prometedor):**

| Dimensión | Pregunta |
|-----------|----------|
| **Frecuencia** | "¿Cuántas veces a la semana/mes hacen esto?" |
| **Volumen** | "¿Cuántos [documentos / tickets / emails / registros] manejan por ciclo?" |
| **Tiempo real** | "¿Cuántas horas dedica una persona a esto en una semana?" |
| **Costo del rol** | "¿Es un [cargo / rol específico] el que lo hace? ¿Cuántos de ellos tienen?" |
| **Calidad actual** | "¿Cuántos errores o reprocesos genera esto? ¿Hay quejas de clientes o del equipo?" |
| **Herramientas actuales** | "¿Qué usan hoy para hacerlo — Excel, algún sistema, manual?" |
| **Intentos previos** | "¿Han intentado resolverlo antes? ¿Qué pasó?" |

**Señal de que un proceso ES candidato a IA:**
- Se repite más de 10 veces a la semana
- Tiene pasos predecibles (inputs → proceso → output definido)
- Hay un costo medible (horas de persona, errores, velocidad)
- Alguien del equipo ya dijo "esto se podría automatizar"

**Señal de que un proceso NO es candidato (en esta etapa):**
- Requiere criterio humano complejo o contexto político interno
- Volumen muy bajo (< 1 vez/semana)
- No hay datos digitales como insumo
- El proceso en sí mismo está roto (arreglarlo primero, luego automatizarlo)

---

### Segmento 3 — Diagnóstico técnico y cultural (8 min)

**Objetivo:** entender con qué materia prima se trabaja (datos, herramientas, equipo) y si hay condiciones mínimas para implementar.

**Preguntas clave:**

| Área | Pregunta |
|------|----------|
| **Stack de herramientas** | "¿Cuáles son las herramientas principales que usa el equipo? CRM, ERP, hojas de cálculo, apps de comunicación..." |
| **Disponibilidad de datos** | "¿Dónde vive la información de ese proceso hoy? ¿Está digitalizada o parte de ella es papel/verbal?" |
| **Accesos y control** | "¿Tienen acceso al sistema donde vive esa data, o dependen de un proveedor externo?" |
| **Madurez de IA** | "¿El equipo usa ChatGPT u otras herramientas de IA en su trabajo diario?" |
| **Resistencia interna** | "¿Hay alguien en el equipo que podría ser campeón de este proyecto — alguien entusiasmado con tecnología?" |
| **Privacidad / seguridad** | "¿Manejan datos sensibles de clientes o información regulada (financiera, salud, legal)?" |

**Umbrales mínimos para considerar implementación:**

| Condición | Mínimo necesario |
|-----------|-----------------|
| Digitalización de datos | Al menos 60% de los datos del proceso ya están en formato digital |
| Acceso a herramientas | El cliente tiene control o puede obtener acceso a los sistemas clave |
| Campeón interno | Al menos 1 persona del equipo con apertura a cambiar cómo trabaja |
| No hay proceso roto previo | El flujo actual, aunque ineficiente, es predecible y consistente |

---

### Segmento 4 — Evaluación estratégica (4 min)

**Objetivo:** entender el contexto de decisión, el ROI esperado y si hay alineación en inversión.

**Preguntas:**

- "¿Cuál es el mayor riesgo para ti si no resuelves esto en los próximos 3 meses?"
- "Si esto funcionara exactamente como lo imaginas, ¿cómo se vería el negocio en 6 meses?"
- "¿Quién más estaría involucrado en tomar esta decisión?"
- "¿Han trabajado antes con consultores externos? ¿Qué funcionó y qué no?"
- "Hablando de inversión — ¿tienen un rango presupuestario para este tipo de proyectos?"

**Nota:** no preguntar directamente "¿cuánto pueden gastar?" — el framing de "rango presupuestario para proyectos tecnológicos" es más neutro y genera respuesta más honesta.

---

### Segmento 5 — Cierre de la llamada (3 min)

**Objetivo:** dar una respuesta clara sobre el fit y el próximo paso. No dejar la llamada "en el aire".

**Si hay fit (score ≥ 15 — ver sección 6):**

> "Con lo que me contaste, veo que hay una oportunidad real. El proceso [X] es un candidato fuerte para IA por [razón concreta]. Lo que haría yo sería [describir brevemente el approach — auditoría o implementación]. ¿Eso tiene sentido para donde están hoy?"

> "Si estás de acuerdo, te preparo una propuesta en las próximas 24 horas con los detalles de cómo trabajaríamos, qué recibirías y cuánto costaría. ¿Hay algo específico que necesites que esa propuesta responda?"

**Si el fit es incierto (score 10–14):**

> "Hay algo interesante aquí, pero necesito entender mejor [el área de duda]. Mi sugerencia sería arrancar con una Auditoría Express — es el formato que usamos cuando queremos validar el impacto antes de comprometerse con una implementación completa. En dos semanas tendrías un mapa de qué automatizar, en qué orden y con qué ROI real."

**Si no hay fit (score < 10):**

> "Voy a ser honesto contigo, que es lo que más te sirve en este momento: con lo que describes, no creo que tenga sentido arrancar con IA ahora. El problema principal que veo es [razón específica]. Lo que te recomendaría primero es [alternativa concreta]. Si en algún momento [condición que cambiaría el fit], con mucho gusto lo volvemos a ver."

**Por qué cerrar así:** la honestidad en el no-fit genera referidos de alta calidad. Un cliente que no siguió pero fue bien tratado es un embajador futuro.

---

## 5. Matriz de puntuación de fit (completar post-llamada)

Completar en el sistema interno después de la llamada, no durante. Asignar de 1 a 5 en cada dimensión.

### Dimensiones y criterios

#### D1 — Automabilidad del proceso (peso ×2)

| Puntaje | Criterio |
|---------|----------|
| 5 | Proceso altamente repetitivo, inputs/outputs digitales definidos, volumen alto (>50/semana) |
| 4 | Proceso repetitivo con algunas excepciones, datos mayormente digitales |
| 3 | Proceso semi-estructurado, hay variabilidad moderada, datos parcialmente digitales |
| 2 | Proceso con mucha variabilidad, datos fragmentados o semi-digitales |
| 1 | Proceso que requiere criterio humano complejo, datos no disponibles o análogos |

#### D2 — ROI potencial (peso ×2)

| Puntaje | Criterio |
|---------|----------|
| 5 | Ahorro estimado > USD 2.000/mes o impacto en ingresos directamente cuantificable |
| 4 | Ahorro estimado USD 800–2.000/mes o mejora significativa en calidad/velocidad |
| 3 | Ahorro estimado USD 300–800/mes o beneficio cualitativo importante |
| 2 | Ahorro < USD 300/mes o beneficio difícil de cuantificar |
| 1 | No es claro el valor económico o es irrelevante vs. la inversión |

#### D3 — Madurez técnica (peso ×1)

| Puntaje | Criterio |
|---------|----------|
| 5 | Stack digital maduro, APIs disponibles, equipo técnico interno |
| 4 | Herramientas digitales principales, sin equipo técnico pero con apertura |
| 3 | Mix de digital y manual, dispuestos a adoptar nuevas herramientas |
| 2 | Muy dependientes de Excel/papel, resistencia a cambiar herramientas |
| 1 | Sin infraestructura digital relevante, requeriría inversión en pre-requisitos |

#### D4 — Receptividad del equipo (peso ×1.5)

| Puntaje | Criterio |
|---------|----------|
| 5 | Dueño o CEO directamente involucrado y entusiasmado, hay campeón interno |
| 4 | Decisor alineado, hay 1–2 personas del equipo con apertura activa |
| 3 | Decisor alineado pero equipo neutro, sin campeón claro |
| 2 | Hay resistencia interna conocida o decisor inseguro |
| 1 | Equipo activamente reticente o el cliente no tiene autoridad real para decidir |

#### D5 — Claridad del alcance (peso ×1)

| Puntaje | Criterio |
|---------|----------|
| 5 | Proceso específico identificado, dolor cuantificado, expectativas realistas |
| 4 | Proceso claro aunque con algunos supuestos por validar |
| 3 | Proceso general identificado pero requiere exploración para definir alcance |
| 2 | Varias ideas poco concretas, cliente no sabe bien qué quiere |
| 1 | Solicitud vaga ("quiero usar IA para todo"), sin problema específico definido |

#### D6 — Urgencia y decisión (peso ×1.5)

| Puntaje | Criterio |
|---------|----------|
| 5 | Decisor único o con poco proceso de aprobación, horizonte esta semana/este mes |
| 4 | 1–2 aprobadores, horizonte este mes |
| 3 | Proceso de aprobación corto, horizonte 2–3 meses |
| 2 | Proceso de aprobación largo o incierto, horizonte indefinido |
| 1 | Solo explorando, sin presupuesto asignado, múltiples decisores |

### Cálculo del score total

```
Score = (D1 × 2) + (D2 × 2) + (D3 × 1) + (D4 × 1.5) + (D5 × 1) + (D6 × 1.5)
Score máximo posible = 10 + 10 + 5 + 7.5 + 5 + 7.5 = 45
```

### Tabla de interpretación

| Score | Fit | Servicio recomendado | Acción |
|-------|-----|----------------------|--------|
| 36–45 | Muy alto | Implementación + 90 días | Propuesta con Servicio 3 como principal, Servicio 2 como opción B |
| 28–35 | Alto | Implementación | Propuesta con Servicio 2, mencionar upgrade a Servicio 3 |
| 18–27 | Medio | Auditoría Express | Propuesta Servicio 1 con path claro a Servicio 2 post-auditoría |
| 10–17 | Bajo | Auditoría Express o diferir | Ofrecer Servicio 1 solo si D1+D2 > 6, si no: diferir con hoja de ruta |
| < 10 | No-fit | Ninguno ahora | Cierre respetuoso + recomendación alternativa honesta |

---

## 6. Señales de alerta (red flags)

Las siguientes señales, si aparecen en la llamada, deben ajustar el score hacia abajo o activar una conversación explícita antes de proponer:

| Red flag | Qué hacer |
|----------|-----------|
| "Queremos IA para todo, sin saber qué" | Pedir que identifiquen UNO proceso concreto. Si no pueden, no-fit. |
| "El equipo no sabe que estoy buscando esto" | Preguntar si hay plan de gestión del cambio. Sin campeón = riesgo alto. |
| "Necesito resultados en 2 semanas" | Calibrar expectativas. IA no es magia instantánea. Si no acepta el timeline real, no-fit. |
| "Otro proveedor ya lo intentó y falló" | Explorar qué falló. Puede haber obstáculo sistémico que no resolveremos tampoco. |
| "¿Puedes hacer algo por USD 200?" | No ajustar precio. Explicar el modelo. Si no hay budget fit, no-fit. |
| El decisor no está en la llamada | Preguntar si se puede incluir antes de enviar propuesta. Propuesta sin decisor = ciclo largo. |
| "Solo explorando, sin fecha definida" | Puntuar D6 = 1. Puede ser un cliente bueno más adelante, pero no para propuesta ahora. |
| Datos completamente en papel o sin sistema | Explicar que requeriría digitalización previa. Auditoría puede incluirlo, pero es prerequisito. |

---

## 7. Acciones post-llamada (dentro de las 24 h)

### Inmediatamente después (primeros 30 min)

- [ ] Completar la Matriz de Puntuación de Fit en el sistema interno
- [ ] Registrar el estado del prospecto:
  - `diagnóstico` si hay fit y se enviará propuesta
  - `no-fit` si no hay condiciones
  - `pendiente` si falta información antes de decidir
- [ ] Capturar notas clave: industria, proceso principal, herramientas, obstáculos, frases textuales del cliente
- [ ] Enviar mensaje de WhatsApp de seguimiento inmediato:

> "Hola [nombre], gracias por la llamada de hoy. Fue muy útil entender [algo específico que mencionaron]. Te preparo la propuesta y te la envío mañana [si aplica]. ¿Hay algo más que quieras agregar antes de que la arme?"

### Propuesta (dentro de las 24 h del cierre de llamada)

Usar el template de propuesta correspondiente al servicio recomendado. La propuesta debe:

- Mencionar el proceso específico discutido en la llamada (personalización obligatoria)
- Incluir el ROI estimado calculado durante/después de la llamada
- Especificar claramente qué reciben, cuándo y cuánto cuesta
- Incluir un deadline de validez ("Esta propuesta es válida por 7 días")
- Cerrar con un CTA claro (link de pago o link Cal.com para resolver dudas)

### Si el resultado fue no-fit

- [ ] Enviar email o WhatsApp con la razón honesta + recomendación alternativa concreta
- [ ] Si puede ser un fit en el futuro (ej: "cuando tengan el CRM implementado"), agregar recordatorio en 60–90 días en sistema
- [ ] No enviar propuesta en ningún caso — confunde y genera expectativas falsas

---

## 8. Campos a registrar en sistema interno (post-diagnóstico)

Complementa los campos mínimos de `fulfillment-process.md`.

```
diagnostico_fecha        — Fecha de la llamada
diagnostico_score        — Score total de fit (0–45)
diagnostico_d1           — Puntaje automabilidad (1–5)
diagnostico_d2           — Puntaje ROI potencial (1–5)
diagnostico_d3           — Puntaje madurez técnica (1–5)
diagnostico_d4           — Puntaje receptividad (1–5)
diagnostico_d5           — Puntaje claridad alcance (1–5)
diagnostico_d6           — Puntaje urgencia (1–5)
diagnostico_proceso      — Proceso principal identificado (texto)
diagnostico_herramientas — Stack de herramientas mencionado
diagnostico_roi_estimado — ROI estimado mensual en USD
diagnostico_obstaculos   — Obstáculos o red flags detectados
diagnostico_resultado    — "fit-alto" | "fit-medio" | "fit-bajo" | "no-fit" | "pendiente"
servicio_recomendado     — "auditoria" | "implementacion" | "implementacion-90" | "ninguno"
propuesta_fecha          — Fecha de envío de propuesta (si aplica)
```

---

## 9. Preguntas frecuentes del prospecto y cómo responderlas

| Pregunta del prospecto | Cómo responder |
|------------------------|----------------|
| "¿Cómo sé si esto funcionará para nosotros?" | "Eso es exactamente para lo que sirve la Auditoría Express. Antes de invertir en implementación, mapeo tus procesos y te digo qué tiene potencial real y qué no." |
| "¿Cuánto tiempo lleva ver resultados?" | "Depende del servicio. Con la Auditoría, en 2 semanas tienes el mapa y el ROI estimado. Con Implementación, el sistema está en producción en 6–8 semanas." |
| "¿Tengo que cambiar todos mis sistemas?" | "No. Trabajamos sobre lo que ya tienes. La idea es sumar IA encima de tu stack actual, no reemplazarlo." |
| "¿Qué pasa si no funciona?" | "En el servicio de 90 días hay garantía de adopción: si el equipo no llega al 70% de uso al día 90, hay una iteración sin costo adicional." |
| "¿Por qué tú y no [otra solución]?" | "Las plataformas genéricas de IA son herramientas. Yo configuro esa herramienta para tu proceso específico, entreno a tu equipo y mido que efectivamente se use. El diferencial es la implementación, no el software." |
| "¿Puedo probar antes de pagar?" | "No hay prueba previa, pero la llamada que tuvimos ahora es parte del diagnóstico. La propuesta que te envío ya refleja lo que ví hoy. Si no es para ti, no lo hagas." |

---

## 10. Indicadores del proceso de diagnóstico mismo

Con el tiempo, medir estos indicadores para mejorar el proceso:

| Métrica | Target | Cómo se mide |
|---------|--------|--------------|
| Tasa de conversión diagnóstico → propuesta enviada | ≥ 60% | Registros en sistema |
| Tasa de conversión propuesta → pago | ≥ 40% | Registros en sistema |
| Tasa de no-fit explícito | ≤ 30% (si supera, revisar calificación de leads en la landing) | Registros |
| Tiempo promedio diagnóstico → propuesta enviada | ≤ 24 h | Timestamps |
| NPS del diagnóstico (feedback de prospectos post-llamada) | ≥ 8 | Encuesta 24 h post-llamada |
| Score promedio de fit de prospectos que pagan | Benchmark para calibrar el scoring | Análisis mensual |
