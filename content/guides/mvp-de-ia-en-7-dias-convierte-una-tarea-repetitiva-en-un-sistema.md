> No necesitas dominar Claude antes de empezar: en siete días puedes convertir una tarea repetitiva en un flujo probado, medible y listo para mejorar.

## Qué vas a aprender

- Elegir una tarea con impacto y riesgo controlado.
- Definir entrada, método, criterios y salida antes de automatizar.
- Crear un proyecto de Claude con el contexto mínimo.
- Probar el flujo con diez casos reales y registrar fallos.
- Medir tiempo ahorrado y calidad sin inventar métricas.
- Decidir si el siguiente paso es una skill, una integración o simplemente mejores instrucciones.

## 01 · Día 1: elige una tarea, no una herramienta

**Parte desde algo que ya ocurre en tu negocio**

Buscar “todo lo que puede hacer Claude” te deja con una lista interminable. Para construir un MVP —una primera versión útil— necesitas una tarea concreta que tenga principio y final.

Buenos candidatos para una PYME:

- Convertir notas de una reunión en tareas.
- Preparar un primer borrador de propuesta.
- Clasificar consultas frecuentes.
- Convertir una ficha técnica en descripción de producto.
- Transformar una idea y antecedentes en un guion de contenido.

Evita comenzar por pagos, decisiones legales, respuestas clínicas, eliminación de datos o publicaciones sin revisión. El primer MVP debe permitir errores detectables y reversibles.

Puntúa tres tareas del 1 al 5:

| Criterio | Pregunta |
|---|---|
| Frecuencia | ¿Cuántas veces ocurre por semana? |
| Tiempo | ¿Cuánto trabajo manual consume? |
| Claridad | ¿Existe una salida observable? |
| Ejemplos | ¿Tienes casos buenos y malos? |
| Riesgo | ¿Puedes revisar antes de actuar? |

```
SELECCIÓN DEL MVP

Tarea: [nombre]
Frecuencia semanal: [cantidad]
Minutos por caso: [número]
Salida actual: [entregable]
Quién revisa: [rol]
Riesgo principal: [riesgo]
Casos disponibles para probar: [cantidad]
```

Ejemplo: una agencia prepara ocho resúmenes de reunión por semana y tarda 20 minutos en cada uno. La salida es un correo con acuerdos, responsables y fechas. Existe grabación o transcripción, y una persona revisa antes de enviar. Es un candidato mejor que “automatizar ventas”, porque puede probarse y medirse.

## 02 · Día 2: dibuja el método actual

**Claude no puede repetir un proceso que tú todavía haces de memoria**

Observa un caso real y registra cada decisión. No escribas “analizar la reunión”. Explica qué buscas y qué haces cuando falta información.

```
MAPA DEL MÉTODO

Disparador: [qué inicia la tarea]
Entrada obligatoria: [datos o archivos]

Pasos:
1. [acción observable]
2. [decisión]
3. [validación]

Salida:
- Formato: [correo, tabla, documento]
- Campos obligatorios: [lista]

Detenerse si:
- [dato faltante o riesgo]

Aprobación:
- [persona y momento]
```

Para el resumen de reunión, el método podría ser: separar decisiones de ideas, asignar responsable solo si fue nombrado, conservar fechas exactas, marcar compromisos ambiguos y redactar el correo sin inventar acuerdos.

Convierte expresiones vagas en reglas comprobables:

| Vago | Comprobable |
|---|---|
| “Que quede claro” | cada tarea tiene verbo, responsable y fecha o marca `[SIN FECHA]` |
| “Resume bien” | conserva decisiones, bloqueos y próximos pasos |
| “No inventes” | cada afirmación puede rastrearse a la entrada |
| “Hazlo profesional” | usa la plantilla aprobada y evita expresiones prohibidas |

El objetivo del día no es usar Claude. Es terminar con un procedimiento que otra persona pueda seguir.

## 03 · Día 3: prepara el contexto mínimo

**Entrega solo la información que cambia decisiones**

Anthropic describe los proyectos de Claude como espacios con chats, instrucciones y base de conocimiento. Puedes cargar documentos, texto o código para que Claude comprenda el contexto de las conversaciones. Los proyectos están disponibles para todos los usuarios; las cuentas gratuitas pueden crear hasta cinco. La información oficial está en [Qué son los proyectos](https://support.claude.com/en/articles/9517075-what-are-projects).

Crea un proyecto para el MVP y agrega cuatro piezas:

```
01_objetivo.md       → qué resultado busca el proceso
02_metodo.md         → pasos y decisiones del día 2
03_criterios.md      → reglas de aprobación y límites
04_ejemplos.md       → dos casos correctos y dos difíciles
```

Instrucciones iniciales del proyecto:

```
Este proyecto ayuda a ejecutar [TAREA].

Usa los documentos del proyecto como fuente principal.
No completes datos que no estén presentes en el caso.
Cuando falte información obligatoria, marca [DATO FALTANTE].
Sigue el método en el orden indicado.
Antes de entregar, revisa el resultado contra `03_criterios.md`.
Si dos documentos se contradicen, detente y señala el conflicto.
```

No cargues toda la empresa “por si acaso”. Un manual antiguo, una oferta vencida o ejemplos mediocres pueden empeorar el resultado. Cada documento debería indicar responsable y fecha de actualización.

## 04 · Día 4: construye la instrucción operativa

**Separa contexto, tarea, datos y formato**

Anthropic recomienda instrucciones claras y directas, pasos explícitos cuando el orden importa y ejemplos relevantes para orientar resultados consistentes. También sugiere etiquetas XML para separar tipos de información en solicitudes complejas. Puedes revisar [Prompting best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables).

Usa esta plantilla:

```
<objetivo>
Ejecuta [TAREA] para producir [RESULTADO].
</objetivo>

<reglas>
- Usa solo hechos presentes en la entrada y documentos aprobados.
- Marca datos faltantes como [DATO FALTANTE].
- Sigue el método del proyecto.
- No realices todavía ninguna acción externa.
</reglas>

<entrada>
{{DATOS_DEL_CASO}}
</entrada>

<salida>
Entrega exactamente:
1. [sección]
2. [sección]
3. [sección]
</salida>
```

Ejemplo para la agencia:

```
Convierte la transcripción en un borrador de seguimiento.
Incluye: decisiones confirmadas, tareas con responsable, fechas textuales,
bloqueos y preguntas pendientes.

No asignes responsables ni fechas por inferencia.
Si falta uno, usa [SIN RESPONSABLE] o [SIN FECHA].
Entrega primero una tabla y después un correo de máximo 250 palabras.

Transcripción:
[PEGAR]
```

No agregues veinte reglas preventivas el primer día. Parte con los errores que ya conoces y amplía después de probar.

## 05 · Día 5: prueba con diez casos

**Una respuesta buena no es un sistema probado**

Prepara una muestra pequeña pero incómoda:

```
10 CASOS DE PRUEBA

[ ] 4 casos normales
[ ] 2 con información faltante
[ ] 2 ambiguos o contradictorios
[ ] 1 fuera de alcance
[ ] 1 que debería detenerse
```

Evalúa cada resultado:

| Criterio | 0 | 1 |
|---|---:|---:|
| Fidelidad | inventa o altera datos | todo se rastrea a la entrada |
| Completitud | omite campos obligatorios | incluye todos o marca faltantes |
| Formato | requiere rearmar | puede usarse en el siguiente paso |
| Método | salta decisiones | sigue el orden definido |
| Seguridad | actúa o promete sin permiso | respeta límites y aprobación |

```
REGISTRO DE PRUEBA

Caso: [nombre]
Resultado esperado: [conducta]
Puntaje: [0-5]
Fallo observado: [hecho]
Causa probable: [contexto, regla, ejemplo o entrada]
Cambio aplicado: [uno solo]
Resultado al repetir: [puntaje]
```

Si el sistema falla cuando falta fecha, agrega una regla específica y repite ese caso junto a los demás. No borres el ejemplo que falló: se convierte en tu prueba de regresión.

En flujos programados, estas pruebas pueden convertirse más adelante en evaluaciones automáticas. La API de [Evals de OpenAI](https://platform.openai.com/docs/api-reference/evals) es un ejemplo de cómo definir datos y criterios para ejecutar comparaciones repetibles. Para este MVP, una hoja de cálculo es suficiente.

## 06 · Día 6: mide el proceso completo

**Tiempo de Claude no es igual a tiempo ahorrado**

Mide preparación, generación, revisión y corrección. Si Claude responde en 20 segundos pero necesitas 12 minutos para reparar el resultado, el beneficio real es pequeño.

```
MEDICIÓN ANTES / DESPUÉS

Tiempo manual anterior: [minutos]
Preparación con IA: [minutos]
Generación: [minutos]
Revisión: [minutos]
Corrección: [minutos]
Tiempo total nuevo: [minutos]

Casos aceptados sin cambio: [n/10]
Casos con cambio menor: [n/10]
Casos rechazados: [n/10]
Errores críticos: [cantidad]
```

Ejemplo: el resumen anterior tardaba 20 minutos. El nuevo flujo requiere dos minutos para preparar la transcripción, uno para generar y cuatro para revisar: siete minutos totales. En ocho casos de diez, el correo necesita cambios menores. El ahorro es observable, pero todavía conviene mantener aprobación humana.

Define un umbral antes de avanzar. Por ejemplo: cero invenciones, nueve de diez casos con formato correcto y reducción mínima del 40% en tiempo total. Ajusta el umbral al riesgo de tu tarea.

## 07 · Día 7: decide el siguiente nivel

**Automatiza solo lo que ya puedes explicar y probar**

Al cerrar la semana, elige una de cuatro rutas:

- **Mantenerlo como proyecto** si el flujo funciona y el volumen es bajo.
- **Crear una skill** si varias personas o proyectos necesitan el mismo procedimiento.
- **Conectar una fuente** si copiar datos vigentes es el principal cuello de botella.
- **Automatizar el disparador y destino** si las entradas son estables y la revisión está clara.

Plantilla de decisión:

```
DECISIÓN DEL MVP

Resultado medido: [tiempo y calidad]
Fallo más frecuente: [problema]
Riesgo restante: [riesgo]
Volumen semanal: [cantidad]

Siguiente paso elegido:
[ ] Mantener manual asistido
[ ] Convertir procedimiento en skill
[ ] Conectar datos externos
[ ] Automatizar entrada y salida

Condición para avanzar: [umbral]
Responsable: [persona]
Fecha de revisión: [fecha]
```

Reglas finales:

- Empieza por una tarea, no por una plataforma.
- Conserva casos fallidos como pruebas.
- Cambia una variable por vez.
- No elimines revisión humana antes de medir consistencia.
- Separa documentos vigentes de instrucciones permanentes.
- Concede el mínimo acceso cuando conectes sistemas.
- Registra qué versión produjo cada resultado.

Siete días no convierten toda tu empresa en un sistema de IA. Sí alcanzan para demostrar, con evidencia, si una tarea concreta puede hacerse mejor. Ese aprendizaje vale más que otras cincuenta horas de tutoriales.

---

### Guías relacionadas

- [De 50 tutoriales a un sistema de IA que tu negocio pueda repetir](/guias/de-50-tutoriales-a-un-sistema-de-ia-que-tu-negocio-pueda-repetir)
- [Prompt, proyecto, skill o MCP: qué usar para cada flujo de trabajo](/guias/prompt-proyecto-skill-o-mcp-que-usar-para-cada-flujo-de-trabajo)
