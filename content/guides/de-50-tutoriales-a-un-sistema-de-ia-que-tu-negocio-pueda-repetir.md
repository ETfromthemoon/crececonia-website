> Ver más tutoriales no arregla un proceso desordenado: necesitas convertir una tarea real de tu negocio en un sistema que puedas repetir, medir y mejorar.

## Qué vas a aprender

- Elegir un proceso que sí vale la pena trabajar con inteligencia artificial.
- Convertir conocimiento disperso en un contexto reutilizable para Claude.
- Diseñar una instrucción que no dependa de recordar “el prompt perfecto”.
- Probar el sistema con casos reales y detectar cuándo falla.
- Documentar el flujo para que otra persona pueda ejecutarlo.
- Pasar de una conversación útil a un activo concreto del negocio.

## 01 · Deja de coleccionar herramientas

**Parte desde un resultado, no desde una función**

Un tutorial suele enseñarte una pieza aislada: cómo resumir un PDF, generar una imagen o escribir un correo. El problema aparece cuando intentas aplicar esa pieza a tu operación. Falta el contexto de tu negocio, no existe un criterio para saber si el resultado sirve y nadie define qué ocurre después.

La unidad correcta de trabajo no es “usar Claude”. Es un proceso con entrada, decisión y salida. Por ejemplo, una tienda no necesita “generar textos con IA”. Necesita convertir la ficha técnica de un producto en una descripción aprobable, con el tono de la marca, sin inventar características y lista para cargar en su catálogo.

Antes de abrir una herramienta, completa esta ficha:

```
PROCESO QUE QUIERO MEJORAR

Nombre del proceso: [ej. crear ficha de producto]
Disparador: [qué evento lo inicia]
Entrada disponible: [documentos, datos, mensajes]
Resultado final: [entregable concreto]
Quién lo revisa: [rol o persona]
Tiempo actual por caso: [minutos]
Errores frecuentes: [lista breve]
Qué nunca puede ocurrir: [riesgos o límites]
Volumen semanal: [cantidad de casos]
```

Ejemplo: un estudio contable recibe 30 consultas similares por semana. Cada respuesta tarda ocho minutos. La oportunidad no es “crear un chatbot” de inmediato. Primero conviene producir borradores basados en una biblioteca aprobada y dejar la revisión humana antes del envío. Si el borrador reduce el trabajo a tres minutos, el ahorro es de 150 minutos semanales y el riesgo sigue controlado.

Elige tareas repetidas, con una salida observable y ejemplos disponibles. Evita comenzar por decisiones irreversibles, casos legales sensibles o procesos que ni siquiera están claros para el equipo.

## 02 · Construye una base de contexto

**La IA no conoce tu negocio por arte de magia**

Anthropic describe los proyectos de Claude como espacios separados con historial, instrucciones y una base de conocimiento. Puedes subir documentos, texto y otros archivos para que las conversaciones usen ese contexto. Los proyectos están disponibles incluso en cuentas gratuitas; actualmente una cuenta gratuita puede crear hasta cinco. Eso permite probar el método antes de pagar una suscripción. La referencia oficial está en [Proyectos de Claude](https://support.claude.com/en/articles/9517075-what-are-projects).

No subas una carpeta completa sin orden. Una base de conocimiento útil suele comenzar con cuatro piezas:

| Archivo | Qué contiene | Ejemplo |
|---|---|---|
| `01_marca.md` | tono, audiencia, oferta y palabras prohibidas | “Directo, sin promesas infladas” |
| `02_proceso.md` | pasos actuales y responsables | recepción → análisis → borrador → aprobación |
| `03_criterios.md` | reglas para aceptar o rechazar | no inventar precios ni fechas |
| `04_ejemplos.md` | entradas y salidas aprobadas | tres casos normales y dos difíciles |

Si trabajas con Claude Code, la misma idea puede vivir en un archivo `CLAUDE.md`. Claude lo lee automáticamente al iniciar una sesión dentro del proyecto. Anthropic recomienda ubicarlo en la raíz para registrar arquitectura, convenciones y comandos; puedes revisar el funcionamiento en su guía oficial sobre [`CLAUDE.md`](https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts).

Usa esta plantilla como instrucción del proyecto:

```
Eres un asistente operativo de [EMPRESA].

Objetivo: ayudar a [AUDIENCIA] a conseguir [RESULTADO].
Tono: [3 rasgos concretos].
Fuentes autorizadas: los documentos de este proyecto.

Reglas:
- No inventes precios, fechas, características ni testimonios.
- Si falta un dato esencial, marca [DATO FALTANTE] y pregunta.
- Distingue hechos de recomendaciones.
- Entrega siempre el resultado en [FORMATO].
- Antes de terminar, valida el resultado contra [CRITERIOS].

Nunca: [RIESGOS, PROMESAS O PALABRAS PROHIBIDAS].
```

Un documento corto y mantenido suele rendir más que 80 archivos contradictorios. Si dos fuentes dicen cosas distintas, la IA no sabe cuál representa la verdad vigente. Agrega fecha y responsable a cada documento importante.

## 03 · Diseña el flujo completo

**Un prompt aislado no es un sistema**

Un sistema repetible tiene seis bloques: disparador, entrada, preparación, generación, validación y destino. Dibújalos antes de automatizar.

Ejemplo para una ferretería:

1. Llega una ficha del proveedor.
2. Se extraen nombre, medidas, material y uso recomendado.
3. Claude redacta la ficha con el contexto de marca.
4. Una validación compara cada afirmación con la ficha original.
5. Una persona aprueba o devuelve el borrador.
6. La ficha aprobada entra al catálogo.

La parte más importante es la validación. Sin ella, solo aceleras la generación del error. Define criterios binarios siempre que puedas: “¿Todas las medidas aparecen en la fuente?”, “¿El texto contiene una promesa no demostrable?”, “¿La descripción tiene entre 80 y 130 palabras?”.

Plantilla para diseñar el flujo:

```
MAPA DEL SISTEMA

1. Disparador: [evento]
2. Entrada obligatoria: [campos o archivos]
3. Preparación: [limpieza, extracción o clasificación]
4. Trabajo de IA: [transformación exacta]
5. Validaciones automáticas: [reglas comprobables]
6. Revisión humana: [quién y cuándo]
7. Destino: [CRM, Drive, correo, panel]
8. Registro: [qué se guarda para auditar]
9. Recuperación: [qué ocurre si falla]
```

No elimines la revisión humana solo porque el primer resultado se ve bien. Quítala gradualmente cuando tengas suficiente evidencia, especialmente si el contenido se publica, afecta dinero o responde a clientes.

## 04 · Escribe instrucciones que sobrevivan al caso real

**Claridad, contexto, ejemplos y formato**

Las recomendaciones oficiales de Anthropic son simples: instrucciones claras y directas, contexto suficiente, pasos explícitos cuando el orden importa y ejemplos representativos. Para tareas complejas, las etiquetas XML ayudan a separar instrucciones, contexto y datos. Anthropic también recomienda entre tres y cinco ejemplos diversos para orientar resultados consistentes. Puedes consultar la referencia en [Prompting best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables).

Mira la diferencia.

Prompt frágil:

```
Escribe una descripción atractiva para este producto.
```

Instrucción operativa:

```
<rol>
Eres editor de catálogo para una ferretería chilena.
</rol>

<objetivo>
Convierte la ficha del proveedor en una descripción clara para una persona no técnica.
</objetivo>

<reglas>
- Usa únicamente datos presentes en la ficha.
- No inventes certificaciones, compatibilidades ni stock.
- Escribe entre 80 y 130 palabras.
- Abre con el uso principal, luego especificaciones y termina con una advertencia si corresponde.
- Si falta una medida necesaria, escribe [DATO FALTANTE].
</reglas>

<salida>
Devuelve JSON con: titulo, descripcion, especificaciones, datos_faltantes.
</salida>

<ficha>
{{FICHA_DEL_PROVEEDOR}}
</ficha>
```

El segundo prompt no es mejor por ser más largo. Es mejor porque vuelve explícitas las decisiones. Además, la salida estructurada permite enviarla a otro sistema sin copiar y pegar manualmente.

Incluye casos borde en tus ejemplos: una ficha incompleta, un cliente molesto, un producto sin precio o una solicitud que debe rechazarse. Si todos tus ejemplos son perfectos, el sistema aprende poco sobre la realidad.

## 05 · Prueba antes de automatizar

**Diez casos enseñan más que una buena demostración**

Una demo favorable solo prueba que el flujo funcionó una vez. Para decidir si sirve, prepara un conjunto pequeño pero variado de casos y una tabla de evaluación.

```
PRUEBA INICIAL — 10 CASOS

[ ] 4 casos normales
[ ] 2 casos con información incompleta
[ ] 2 casos ambiguos
[ ] 1 caso que debe rechazarse
[ ] 1 caso con formato inesperado
```

Evalúa cada salida con criterios de 0 o 1:

| Criterio | Pregunta |
|---|---|
| Fidelidad | ¿Cada afirmación está respaldada por la entrada? |
| Completitud | ¿Incluye todos los campos obligatorios? |
| Formato | ¿Puede usarlo el siguiente paso sin corregirlo? |
| Tono | ¿Respeta la voz aprobada? |
| Seguridad | ¿Evitó acciones o promesas prohibidas? |

Supón que el flujo aprueba 8 de 10 casos, pero falla en las dos entradas incompletas. No “arregles el prompt” de forma genérica. Agrega una regla concreta para detectar campos ausentes y repite exactamente esos casos junto con otros nuevos. Guarda cada error como material de prueba. Esa colección vale más que una carpeta de prompts descargados.

En implementaciones con API puedes formalizar estas pruebas mediante evaluaciones. OpenAI, por ejemplo, ofrece una API de Evals para definir datos y criterios de evaluación; la documentación está en [Evals](https://platform.openai.com/docs/api-reference/evals). Para un MVP no necesitas programarla: una hoja con diez filas y criterios claros cumple el mismo propósito.

## 06 · Convierte el resultado en un hábito operativo

**Documenta quién hace qué y qué se mide**

Cuando el flujo funciona, registra una versión. No sigas modificándolo todos los días según la última respuesta que te gustó.

```
FICHA DE OPERACIÓN — V1

Propietario del proceso: [PERSONA]
Versión de instrucciones: [V1 / FECHA]
Ubicación del contexto: [ENLACE O CARPETA]
Entrada válida: [DEFINICIÓN]
Salida esperada: [DEFINICIÓN]
Revisión humana: [OBLIGATORIA / MUESTREO / NO]
Métrica principal: [TIEMPO, ERRORES O CONVERSIÓN]
Umbral de alerta: [CONDICIÓN]
Registro de fallos: [UBICACIÓN]
Próxima revisión: [FECHA]
```

Mide dos cosas durante las primeras semanas: tiempo real por caso y porcentaje de salidas aceptadas sin corrección. Si antes tardabas 15 minutos y ahora tardas 12 porque debes reparar todos los textos, todavía no tienes un buen sistema. Si tarda cuatro minutos y nueve de cada diez resultados pasan la revisión, ya tienes una base razonable para automatizar el traspaso entre herramientas.

Una opción accesible para comenzar es un proyecto gratuito de Claude. Si el uso se vuelve frecuente, el plan Pro individual figura actualmente a USD 20 mensuales o USD 200 anuales en la [comparación oficial de planes](https://support.claude.com/en/articles/11049762-choose-a-claude-plan). El plan pago aumenta capacidad, pero no reemplaza el diseño del proceso. Pagar más no corrige contexto contradictorio ni criterios vagos.

## 07 · Reglas clave

**Lo que debes cuidar desde el primer día**

- **Un proceso por vez** — mezclar ventas, soporte y contenido en un solo prompt vuelve difícil detectar la causa de un error.
- **Fuente antes que fluidez** — una respuesta elegante pero inventada sigue siendo incorrecta.
- **Ejemplos reales, no ideales** — incluye entradas incompletas y situaciones que deban escalarse.
- **Revisión proporcional al riesgo** — una idea interna puede tolerar más error que un precio publicado o una respuesta contractual.
- **Versiona el contexto** — anota qué cambió, cuándo y por qué. Así puedes volver atrás sin adivinar.
- **Mide el proceso completo** — no solo cuánto demora Claude; incluye preparación, corrección y carga final.
- **Automatiza después de estabilizar** — primero demuestra que el flujo funciona manualmente con una muestra representativa.

Tu primer sistema no necesita agentes, veinte integraciones ni una infraestructura compleja. Necesita una entrada definida, contexto confiable, una instrucción reutilizable, pruebas incómodas y una salida que alguien pueda usar. Cuando eso funciona, conectar herramientas deja de ser una apuesta y pasa a ser una decisión operativa.

---

### Guías relacionadas

- [Recursos y guías de CrececonIA](/guias)
