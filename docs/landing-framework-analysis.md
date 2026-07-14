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

## Plan de modificación propuesto

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

## Branch y workflow

- **Branch**: `feat/landing-optimization-julio`
- **Base**: `main`
- **Commits**: convención conventional commits (feat:, fix:, refactor:, perf:)
- **PR**: squash-merge a main cuando esté aprobado
