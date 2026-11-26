> Si mañana olvidara todo lo que sé de IA, este es el único proceso que volvería a aprender: tres pasos para construir una web, un sistema o una automatización sin saber programar, y que alguien te pague por ello.

## Qué vas a aprender
- Convertir una idea suelta en una **Ficha del proyecto** que cualquier IA entiende a la primera
- Abrir **Claude Code** o **Codex** y darle el prompt que hace que te pregunte lo que tú no estás viendo
- Construir una **primera versión que funciona**, aunque nunca hayas escrito código
- Pulir lo que se ve (diseño, celular, textos) y lo que no se ve (seguridad, base de datos, velocidad)
- Publicar el proyecto en internet y usarlo para vender o para tu propio negocio

## 01 · Lo que necesitas antes de empezar
**Menos de lo que crees**

No necesitas saber programar ni instalar nada raro. Necesitas tres cosas:

| Qué | Para qué | Opciones |
|---|---|---|
| Una IA de chat | Paso 1: ordenar la idea | ChatGPT, Claude o Gemini (la versión gratis sirve) |
| Una IA que construye | Pasos 2 y 3: crear y pulir el proyecto | **Claude Code** (app de escritorio de Claude, pestaña *Code*) o **Codex** (de OpenAI, desde ChatGPT) |
| Una carpeta vacía | Ahí se guarda todo lo que la IA crea | Por ejemplo `Documentos/mi-proyecto` |

Claude Code y Codex vienen incluidos en los planes pagados de Claude y ChatGPT. Si ya pagas uno de ellos, empieza por ese.

*Cómo usar esta guía: cada prompt está en un recuadro con botón "Copiar". Lo copias, cambias lo que está entre `[corchetes]` por tu información y lo pegas en la IA.*

## 02 · Paso 1: una idea clara y precisa
**La IA construye exactamente lo que le pides. Si la idea es vaga, el resultado también.**

Antes de abrir cualquier herramienta técnica, responde cinco preguntas: qué quieres hacer, para quién, de qué se trata, hasta dónde llega la primera versión y qué vas a vender. Lo haces en tu IA de chat, conversando.

**Ejemplo real.** La idea "quiero una web para una peluquería" queda corta. Después de este paso queda así: *"Web para la peluquería de Carla en Ñuñoa. Clientas de 25 a 45 años que hoy agendan por WhatsApp y se pierden mensajes. Primera versión: catálogo de servicios con precios, agenda online y recordatorio por correo. Después: pagos y fidelización. Se cobra a Carla una vez por la web y una mensualidad por mantenerla."* Con esa ficha, la IA ya no tiene que adivinar.

```
Quiero crear [una web / un sistema / una automatización] y necesito que me ayudes a dejar la idea clara y precisa.

Mi idea en mis palabras: [descríbela aunque esté desordenada].

Hazme preguntas, de a pocas, sobre:
- Para quién es (cliente o usuario ideal)
- Qué problema le resuelve
- Qué debe poder hacer el usuario (funciones principales)
- Qué quiero vender o cómo voy a ganar dinero con esto
- Qué entra en la primera versión y qué queda para después

No soy técnico: usa lenguaje simple y sin jerga.
```

Cuando hayas respondido todo, pide el resumen:

```
Con todo lo que conversamos, escribe una "Ficha del proyecto" breve con estas secciones:
1. Nombre del proyecto
2. Qué es (2 líneas)
3. Para quién es
4. Problema que resuelve
5. Funciones de la primera versión
6. Qué queda para versiones futuras
7. Cómo genera dinero
8. Estilo visual deseado (colores, sensación, referencias)

Escríbelo para que otra IA pueda leerlo y entender el proyecto completo.
```

*Si es para un cliente: agrega al primer prompt "La empresa se llama [nombre], vende [producto/servicio] y su objetivo es [objetivo]".*

## 03 · Paso 2: construir la base con Claude Code o Codex
**Tres cosas que le tienes que decir, sí o sí**

Abre Claude Code (app de Claude → pestaña **Code** → elige tu carpeta vacía) o Codex, y pega el prompt de abajo. Este prompt le cuenta tres cosas:

1. **El contexto completo** del proyecto (tu Ficha).
2. **Que no tienes experiencia técnica.** Así te explica en simple y toma las decisiones técnicas por ti.
3. **Que te haga preguntas hasta entender todo**, incluso lo que tú no estás viendo: pagos, datos de usuarios, privacidad, qué pasa si algo falla.

```
Hola. Quiero construir este proyecto contigo.

1) CONTEXTO DEL PROYECTO:
[pega aquí tu Ficha del proyecto completa]

2) MI NIVEL:
No tengo experiencia técnica. No sé programar. Explícame todo en lenguaje simple, dime exactamente qué hacer cuando necesites algo de mí (clics, cuentas, datos) y toma tú las decisiones técnicas, explicándome brevemente por qué.

3) ANTES DE CONSTRUIR:
Hazme todas las preguntas necesarias, de a pocas, hasta que entiendas completamente el proyecto. Incluye aspectos que probablemente no estoy viendo (usuarios, pagos, datos que hay que guardar, privacidad, celular, idioma, qué pasa si algo falla).

Cuando tengas todo claro, muéstrame un plan corto en pasos simples y espera mi "OK" antes de empezar a construir.
```

La parte de las preguntas es la que hace la diferencia. Sin ella, la IA rellena los huecos con suposiciones y terminas rehaciendo la mitad. Con ella, te va a preguntar cosas como *"¿las clientas necesitan crear cuenta o basta con nombre y teléfono?"*, que tú no habrías pensado.

Tres prompts de apoyo para el camino:

```
No entendí esto: [copia lo que no entendiste]. Explícamelo como si nunca hubiera programado, con un ejemplo de la vida real.
```

```
Muéstrame el proyecto funcionando. Dime paso a paso cómo abrirlo en mi computador, o ábrelo tú si puedes.
```

```
Apareció este error: [pega el mensaje o describe qué pasó]. Encuentra la causa, arréglalo y explícame en una frase qué era.
```

*Si no sabes qué responder a una pregunta, escribe: "No sé, recomiéndame la mejor opción y explícame por qué". Es una respuesta válida.*

## 04 · Paso 3A: pulir lo que se ve
**Interfaz, celular y textos**

Con la base funcionando, sigue en la **misma conversación** (así la IA recuerda el proyecto). Un prompt a la vez, y revisa el resultado antes del siguiente.

```
Revisa el diseño completo del proyecto como un diseñador profesional. Quiero que se vea [moderno / elegante / cercano / premium] y que transmita [confianza / energía / calma]. Mejora colores, tipografías, espacios y jerarquía. Muéstrame el antes y el después.
```

```
Revisa que el proyecto se vea y funcione bien en celular, tablet y computador. Después revisa la experiencia: ¿un usuario nuevo entiende qué hacer en 5 segundos? Corrige todo lo que confunda.
```

```
Revisa todos los textos. Que sean claros, cortos, sin errores y que lleven al visitante a la acción principal: [comprar / agendar / escribir / registrarse].
```

El celular importa más de lo que parece: la mayoría de la gente que llegue desde Instagram va a abrir tu proyecto en el teléfono.

## 05 · Paso 3B: pulir lo que no se ve
**Seguridad, base de datos y velocidad**

Esta es la parte que separa un proyecto de juguete de uno que le puedes entregar a una empresa.

```
Haz una revisión de seguridad completa del proyecto. Busca contraseñas o claves expuestas, formularios que se puedan abusar, accesos sin permiso y datos de usuarios mal protegidos. Arregla lo grave y explícame en simple qué encontraste y qué hiciste.
```

```
Revisa cómo se guardan los datos (base de datos). ¿Está bien organizada? ¿Se puede perder información? ¿Hay respaldos? ¿Aguanta si crece a [100 / 1.000 / 10.000] usuarios? Propón y aplica mejoras, explicándome en simple.
```

```
Revisa que el proyecto cargue rápido y no falle. Prueba los flujos principales como si fueras un usuario real y corrige cualquier error, lentitud o cosa rota.
```

```
Actúa como un equipo de expertos (diseñador, programador senior y especialista en seguridad) y revisa todo el proyecto. Dame una lista de lo que falta para usarlo con clientes reales, de lo más importante a lo menos importante. Después arregla lo más importante.
```

## 06 · Cómo usarlo
**De la idea al proyecto publicado**

1. **Ficha del proyecto** — conversa con tu IA de chat usando los dos prompts del Paso 1. Guarda la ficha en un documento.
2. **Abre Claude Code o Codex en una carpeta vacía** — pega el prompt principal del Paso 2 con tu ficha adentro.
3. **Responde las preguntas con calma** — y da el "OK" al plan solo cuando lo entiendas.
4. **Prueba la primera versión** — usa el prompt "Muéstrame el proyecto funcionando".
5. **Pule lo visual** — los tres prompts del Paso 3A, uno por uno.
6. **Pule lo técnico** — los cuatro prompts del Paso 3B, uno por uno.
7. **Publica** — con este prompt:

```
Quiero publicar el proyecto en internet para que cualquiera pueda entrar. Recomiéndame la opción más simple y económica, y guíame paso a paso. Si necesito crear cuentas, dime cuáles y para qué sirven.
```

*Tip: termina un proyecto chico antes de empezar uno grande. Ese primer proyecto terminado es tu portafolio y lo que le muestras al primer cliente.*

## 07 · Reglas clave
**Lo que debes saber**

- **No te saltes el Paso 1** — sin una idea clara, la IA adivina y pierdes horas corrigiendo.
- **Di siempre que no eres técnico** — si no, te responde en jerga y toma atajos que no vas a entender.
- **Un prompt a la vez** — pedir diez cosas juntas genera diez cosas a medias.
- **Prueba después de cada cambio** — abre el proyecto y úsalo. No aceptes sin mirar.
- **Mantén la misma conversación** — si tienes que abrir una nueva, pega de nuevo tu Ficha del proyecto.
- **Lee lo que la IA te pide aprobar** — si quiere crear archivos o instalar algo, acepta solo si tiene que ver con tu proyecto.

---
### Guías relacionadas
- [Todas las guías](/guias)
