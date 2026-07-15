# Análisis del Framework de Landing Page (del video)

> **Video**: https://www.youtube.com/shorts/7_NOrSBIYG0
> **Framework**: Lead Gen Page Optimization — estructura y principios para maximizar conversión.

---

## Framework extraído

### 1. Headline (línea de cabeza principal)
- Tiene que **detener** a la persona inmediatamente.
- Comunica la promesa única y el valor.

### 2. Subheadline (línea de cabeza secundaria)
- **Clarifica** la promesa del headline.
- Relación como título/miniatura de YouTube — se potencian mutuamente.

### 3. Hero Image
- Debe **agregar prueba** visual a la promesa del headline y subheadline.
- Muestra lo que obtendrás o la experiencia que vivirás.

### 4. CTA
- Debe decir **qué van a obtener** y **cómo**.
- Directo, sin rodeos. Sin ambigüedad.

### 5. Formulario
- Mínima información necesaria. **4-5 campos máximo**.
- Si necesitas más, **divide en varios pasos**.

### 6. Supporting Copy / Justificación
- Una línea opcional que responde: *"¿Por qué debería darte mi email?"*
- Esa es la **justificación** — no la des por sentada.

### 7. Bullets (3)
- Las **3 objeciones más grandes** de tu cliente ideal.
- **Ordenadas**: de la más común a la menos común.

### 8. Social Proof
- Si el producto es simple → al final (debajo del fold).
- Si es complejo → cerca del headline.
- Testimonios, casos, métricas reales.

### 9. Diseño visual
- **Blanco/limpio** — toda la atención a la acción única.
- A más larga la página, **más baja la conversión**.
- Mobile optimized.
- Rápido: imágenes comprimidas.
- Todo lo legal **al final**, que no distraiga.

### 10. Regla fundamental
> **Si no aumenta la tasa de conversión, córtalo.**

---

## Diagnóstico de crececonia.cl actual vs framework

| Componente | Estado actual | Diagnóstico |
|---|---|---|
| **Headline** | "Sistemas que tu equipo sí usa, sin gastar en IA que no necesitas." | Fuerte. Dice el QUÉ y el PARA QUIÉN. Podría ser más específico. |
| **Subheadline** | "No facturamos horas ni entregamos PDFs..." | Buena, pero podría clarificar más la promesa del headline. |
| **Hero Image** | BackgroundPaths animado (abstracto) | Bonito, pero **no añade prueba**. No muestra resultado tangible. |
| **CTA principal** | "Agendar Test de Fit" | Dice qué hacer pero no el QUÉ OBTIENES. |
| **Formulario** | No hay formulario directo (CTA → modal/flujo) | OK para el modelo, pero no hay captura de email directa en la landing. |
| **Justificación** | No explícita en hero | No se responde "por qué dar mi tiempo/email". |
| **Bullets (objeciones)** | Algunas en FAQ pero no como bullets escaneables | **Gap**: No hay 3 objeciones principales al inicio. |
| **Social Proof** | Sección con 6 casos reales (mitad del page) | Bien hecho, pero llega **tarde**. Subirla o añadir prueba al hero. |
| **Diseño** | Tema oscuro premium, clean | Visualmente fuerte. El principio "white/clean" aplica en versión oscura. |
| **Mobile** | Responsive decente | Sin observaciones críticas. |
| **Velocidad** | Next.js + Turbopack + Vercel | Sin observaciones críticas. |
| **Legal** | Al final (footer) | Correcto. |

---

## Plan de modificación propuesto (pre-lety.ai)

### Prioridad alta (impacto directo en conversión)

1. **Hero — Añadir prueba social visible**
   - Integrar 1-2 métricas/logo de cliente conocido en el hero (no esperar a la sección SocialProof).
   - Ej: "6 proyectos implementados · 0 fallas de adopción en semana 3"

2. **CTA — Especificar el QUÉ OBTIENES**
   - Cambiar "Agendar Test de Fit" → "Recibe tu Diagnóstico BPI Gratis"
   - O: "Obtén tu Diagnóstico BPI en 30 minutos"

3. **Subheadline — Clarificar la promesa**
   - Añadir una línea que cierre la brecha: "Si tu empresa no está en la 'I', te lo decimos antes de cobrarte un peso."

4. **Sección de objeciones (bullets)**
   - Añadir bloque de 3 objeciones principales después del hero (tipo "¿Por qué NO contratarnos?"):
     - ❌ "No vendemos chatbots"
     - ❌ "No hacemos implementación sin diagnóstico"
     - ❌ "No firmamos contratos anuales"

### Prioridad media

5. **AntiPositioning / ProblemBar**
   - Reforzar que conecte con las 3 objeciones máximas para que sea más escaneable.
   - Usar bullets en vez de párrafos.

6. **Agregar lead capture directa**
   - Email capture gate para el ebook o guía en la misma página, con 2 campos (email + nombre).

### Prioridad baja

7. **Performance check**
   - Verificar Lighthouse, comprimir imágenes, revisar Core Web Vitals.
8. **Prueba A/B del headline y CTA**
   - Proponer variantes del hero tagline.

---

# ACTUALIZACIÓN: Pivote a Lety.ai (Julio 2026)

## ¿Qué es Lety.ai?

Plataforma **white-label** para agencias de IA. Permite:
- Construir agentes de IA para cualquier vertical (12 verticales, 46 nichos)
- Desplegar en múltiples canales (WhatsApp, web chat, Instagram, email, SMS)
- Marca blanca total: el cliente ve la agencia, nunca a Lety
- Multi-tenant nativo: cliente aislado por workspace
- Facturación integrada: suscripción + markup de tokens + MCP calls
- 600+ integraciones MCP
- Agencias en 40+ países facturando millones a través de la plataforma

## ¿Cómo cambia la oferta?

**Antes (consultoría IA genérica):**
- Test de Fit → Diagnóstico BPI → Evaluación → Implementación personalizada
- Proyectos de USD 500 a 5.000+
- Cada implementación es artesanal
- Escala limitada a capacidad de Sergio

**Ahora (agencia de agentes sobre Lety.ai):**
- Diagnóstico BPI → Agente listo en Lety.ai → Onboarding rápido
- El agente se implementa en minutos, no semanas
- Multi-tenant: un agente → muchos clientes (misma plantilla, diferentes datos)
- Ingreso recurrente por suscripción mensual por agente vivo
- Escalabilidad: de 1 a 1.000+ clientes con la misma plataforma
- Margen: cobras 3-10x el costo de Lety (markup en tokens + suscripción)

## Nivel de escalabilidad

| Dimensión | Antes (consultoría) | Ahora (Lety.ai) |
|---|---|---|
| Tiempo por cliente | 2-12 semanas | 30 min - 2 días |
| Ingreso por cliente | Una vez (proyecto) | Recurrente (suscripción) |
| Límite de clientes/mes | 1-3 proyectos | 10-100+ agentes |
| Entrega | Artesanal (Sergio) | Plantilla + datos del cliente |
| Competencia | Otras consultorías | Otras agencias Lety |
| Diferenciación | Metodología BPI | BPI + velocidad de implementación |

**Conclusión**: Escalabilidad **alta**. Lety elimina el cuello de botella de implementación. El límite pasa a ser cuántos leads calificados puedes captar, no cuánto puedes construir.

---

## Plan de modificación 2.0 — con lety.ai

### Postura de marca

CrececonIA deja de ser "consultoría de IA" y pasa a ser:
> **Agencia de agentes IA para empresas latinoamericanas**
> Implementamos asistentes IA listos en 48h sobre Lety.ai

### Headline (nuevo)
> *"Un agente IA para tu negocio, listo en 48 horas. Sin ingenieros, sin contratos anuales."*

O más filtrador:
> *"¿Tu empresa necesita un asistente IA? Lo implementamos esta semana o te decimos por qué no."*

### Subheadline
> *"Sobre Lety.ai — la misma plataforma que usan agencias en 40+ países. Tú pones los datos, nosotros lo dejamos funcionando en WhatsApp, web y los canales que uses."*

### Hero Image
- BackgroundPaths actual se mantiene como firma visual (es parte de la identidad CrececonIA)
- Pero se **superpone un badge** tipo: "Implementado sobre Lety.ai · 600+ integraciones"

### CTA
> *"Quiero mi agente IA"* → abre WhatsApp (como hoy)
O:
> *"¿Aplica mi negocio? Descúbrelo en 5 min"* (Test de Fit express)

### Objeciones (3 bullets)
> **Esto NO es para ti si:**
> - Buscas IA personalizada con un equipo de ingenieros dedicados
> - Tu empresa no tiene procesos documentados ni data accesible
> - Crees que un agente IA reemplaza a tu equipo (no, los asiste)

### Social Proof
Mostrar logotipos de marcas que usan Lety.ai (Sura, Nutresa, KIA, Papa John's, Guess) + casos de CrececonIA adaptados a agentes.

### Pricing
- Agente IA desde USD X/mes (incluye: implementación, hosting, soporte)
- Setup fee único: USD Y (personalización + integración)
- Sin contrato anual. Cancelas cuando quieras.

### Diferenciación vs otras agencias Lety
- Protocolo BPI como filtro calificador (no implementamos si no hay caso)
- Soporte en español chileno/latino
- Velocidad: implementación en 48h vs semanas de otras agencias

---

## Branch y workflow

- **Branch**: `feat/landing-optimization-julio`
- **Base**: `main`
- **Commits**: convención conventional commits (feat:, fix:, refactor:, perf:)
- **PR**: squash-merge a main cuando esté aprobado
