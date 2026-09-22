> Si Claude responde como un asesor genérico, casi siempre le falta un mapa de tu negocio: qué vendes, cómo decides y qué significa un resultado correcto.

## Qué vas a aprender

- Separar contexto permanente de la información que cambia en cada tarea.
- Crear un paquete de contexto mínimo para tu empresa en menos de una hora.
- Escribir instrucciones de proyecto que Claude pueda seguir sin adivinar.
- Convertir decisiones de tu negocio en criterios concretos de revisión.
- Elegir entre instrucciones, proyectos, skills y Claude Code según el caso.
- Probar el contexto con casos difíciles antes de usarlo con clientes reales.

## 01 · El problema no es tu prompt

**Una orden no reemplaza el conocimiento del negocio**

“Escribe una propuesta comercial” parece una instrucción clara, pero deja casi todo sin resolver. Claude no sabe qué vendes, qué cliente quieres atraer, qué promesas puedes hacer, qué precios están vigentes ni qué señal diferencia una buena oportunidad de una pérdida de tiempo.

Cuando falta ese mapa, el modelo completa los espacios con patrones generales. El resultado puede sonar correcto y seguir siendo inútil. No es una falla misteriosa: le pediste tomar decisiones sin entregarle tus criterios.

Mira este ejemplo de una agencia pequeña.

**Pedido sin contexto:**

```
Escribe una propuesta para este cliente que necesita automatizar sus ventas.
```

**Pedido con decisiones explícitas:**

```
Prepara un borrador de propuesta para una PYME chilena con 4 vendedores.

Nuestra oferta cubre diagnóstico, implementación y capacitación. No prometemos
aumentos de ventas; prometemos reducir trabajo manual medible. El proyecto debe
tener un responsable del lado del cliente y acceso al CRM actual.

Antes de redactar, identifica:
1. Qué problema operativo está demostrado.
2. Qué información falta para cotizar.
3. Qué riesgo impediría comenzar.

Si falta un dato, no lo inventes. Escríbelo como [POR CONFIRMAR].
```

El segundo pedido no depende de palabras sofisticadas. Define el negocio, los límites y las decisiones previas a la escritura.

Antes de crear documentos, completa este diagnóstico:

```
TAREA: [qué quieres que Claude haga]
DECISIONES QUE DEBE TOMAR: [lista]
DATOS QUE NECESITA: [lista]
REGLAS QUE NO PUEDE ROMPER: [lista]
FORMATO UTILIZABLE: [entregable final]
QUIÉN APRUEBA: [persona o rol]
```

Si no puedes completar estas seis líneas, todavía no tienes un problema de prompt. Tienes un proceso que necesita definición.

## 02 · Divide el contexto en cuatro capas

**No mezcles lo permanente con lo que cambia cada día**

Un buen sistema no obliga a pegar veinte páginas en cada conversación. Organiza la información según su duración y su función.

| Capa | Qué contiene | Cuándo cambia |
|---|---|---|
| Empresa | oferta, audiencia, tono, límites | trimestral o cuando cambia el negocio |
| Proceso | pasos, responsables, criterios | cuando mejora la operación |
| Caso | cliente, producto o solicitud concreta | en cada ejecución |
| Evidencia | documentos y datos que respaldan el resultado | en cada ejecución |

Ejemplo: una tienda de muebles mantiene su propuesta de valor y tono en la capa Empresa. El método para crear una ficha vive en Proceso. Las medidas del sofá pertenecen al Caso. La ficha técnica del fabricante es Evidencia.

Esta separación evita dos problemas comunes. Primero, que un precio antiguo quede escondido en un documento de marca. Segundo, que una instrucción temporal termine tratándose como regla permanente.

Crea una carpeta inicial con estos archivos:

```
/contexto-negocio
  01_empresa.md
  02_audiencia.md
  03_ofertas.md
  04_voz_y_ejemplos.md
  05_reglas_y_limites.md
  /procesos
    propuesta_comercial.md
    contenido_social.md
  /casos
  /evidencia
```

No necesitas llenar todo el primer día. Parte con el proceso que realmente vas a ejecutar. Cada archivo debe incluir responsable, fecha de actualización y fuente de verdad.

```
RESPONSABLE: [nombre o rol]
ACTUALIZADO: [AAAA-MM-DD]
FUENTE DE VERDAD: [CRM, lista oficial, documento aprobado]
REVISAR DE NUEVO: [fecha o condición]
```

Un archivo breve y vigente vale más que una biblioteca enorme con contradicciones.

## 03 · Crea el paquete mínimo de empresa

**Cinco documentos bastan para dejar de partir desde cero**

El primer paquete debe responder preguntas operativas, no contar toda la historia de la empresa.

### Documento 1: empresa y oferta

```
EMPRESA
Qué hacemos: [una frase concreta]
Para quién: [segmento específico]
Problema que resolvemos: [problema observable]
Cómo lo resolvemos: [método]
Qué incluye: [lista]
Qué no incluye: [lista]
Promesas permitidas: [lista]
Promesas prohibidas: [lista]
```

### Documento 2: audiencia y decisión

No escribas “emprendedores”. Describe una situación reconocible.

```
CLIENTE PRINCIPAL
Tipo de negocio: [ej. PYME de servicios con 3 a 20 personas]
Situación actual: [qué ocurre hoy]
Disparador de compra: [qué cambió]
Objeciones frecuentes: [lista]
Información que necesita para decidir: [lista]
Señales de mal encaje: [lista]
```

### Documento 3: voz con ejemplos

Decir “tono cercano y profesional” sirve poco. Incluye tres textos aprobados y dos rechazados, explicando el motivo.

```
APROBADO:
[texto real]
Funciona porque: [criterio]

RECHAZADO:
[texto]
No funciona porque: [criterio]
```

Anthropic recomienda ejemplos relevantes, variados y estructurados para mejorar consistencia. Su guía de prompting indica que entre tres y cinco ejemplos suele ser una buena referencia, especialmente cuando importa el formato o el tono. Puedes revisar la documentación en [Prompting best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables).

### Documentos 4 y 5: reglas y glosario

Las reglas definen límites verificables: “No publicar un precio que no aparezca en la lista vigente”. El glosario fija nombres propios, productos, siglas y palabras que la transcripción suele confundir.

Para CrececonIA, por ejemplo, un glosario puede indicar que `Claude` no es `Cloud`, `Claude Code` no es `Cloud Co` y `SHOP` no es `CHOP` cuando se trata de una campaña. Parece un detalle, hasta que una palabra equivocada rompe una automatización.

## 04 · Configura Claude según el alcance

**Cada capa tiene un lugar correcto**

Claude ofrece varias formas de aportar contexto. No cumplen la misma función.

| Mecanismo | Úsalo para | Evítalo cuando |
|---|---|---|
| Instrucciones generales | preferencias que aplican a todas tus conversaciones | la regla solo pertenece a un cliente |
| Instrucciones de proyecto | contexto y reglas de un negocio o iniciativa | necesitas activar un procedimiento puntual |
| Base de conocimiento del proyecto | documentos que deben estar disponibles en sus chats | el dato cambia minuto a minuto |
| Skill | procedimiento especializado y reutilizable | solo quieres guardar antecedentes estáticos |
| `CLAUDE.md` | convenciones de un proyecto trabajado con Claude Code | el equipo no usa archivos ni repositorios |

Anthropic explica que los proyectos permiten cargar documentos y definir instrucciones específicas. La información agregada a la base de conocimiento puede usarse en todos los chats del proyecto; el contexto de una conversación aislada no se comparte automáticamente si no lo agregas allí. Los pasos oficiales están en [Crear y gestionar proyectos](https://support.claude.com/es/articles/9519177-como-puedo-crear-y-gestionar-proyectos).

Para un proyecto de negocio, pega esta instrucción inicial:

```
Actúas como asistente operativo de [EMPRESA].

Usa la base de conocimiento de este proyecto como fuente principal.
Cuando una instrucción del chat contradiga una política aprobada, señala la
contradicción antes de continuar.

Para cada tarea:
1. Resume el objetivo en una línea.
2. Indica qué documentos usaste.
3. Marca los datos faltantes sin inventarlos.
4. Entrega el resultado en el formato solicitado.
5. Revisa el resultado contra las reglas y límites del proyecto.

Si dos documentos se contradicen, detente e indica los nombres, fechas y dato en conflicto.
```

Si trabajas con Claude Code, `CLAUDE.md` funciona como un briefing que se carga al iniciar una sesión en ese proyecto. Anthropic recomienda usarlo para arquitectura, convenciones y comandos, tal como detalla en [Give Claude context: CLAUDE.md](https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts).

Las skills son otra pieza: combinan instrucciones, scripts y recursos para procedimientos especializados. Anthropic las diferencia de los proyectos: el proyecto mantiene conocimiento de fondo; la skill se activa para ejecutar una forma de trabajo. La explicación oficial está en [Qué son las skills](https://support.claude.com/en/articles/12512176-what-are-skills).

## 05 · Convierte criterios humanos en controles

**“Que quede bien” no es una instrucción revisable**

Tus mejores decisiones suelen vivir en frases informales: “esto suena demasiado vendedor”, “este cliente todavía no está listo” o “no publiques sin revisar”. Para reutilizarlas, conviértelas en preguntas observables.

Ejemplo para evaluar contenido social:

| Criterio vago | Control concreto |
|---|---|
| Que sea útil | entrega un paso que puede ejecutarse hoy |
| Que suene a nosotros | evita palabras prohibidas y se parece a ejemplos aprobados |
| Que tenga buen CTA | usa una keyword con automatización activa y relacionada |
| Que no invente | cada precio, fecha y beneficio aparece en una fuente vigente |

Usa este bloque al final de cualquier tarea importante:

```
REVISA ANTES DE ENTREGAR

Responde SÍ, NO o NO COMPROBABLE:
- ¿Cada hecho sensible tiene una fuente identificable?
- ¿El resultado cumple el formato requerido?
- ¿Existe alguna contradicción entre documentos?
- ¿Se agregó una promesa no autorizada?
- ¿Falta un dato necesario para ejecutar el siguiente paso?

Si alguna respuesta es NO o NO COMPROBABLE, no presentes el trabajo como final.
Devuelve primero una sección llamada "Pendientes de validación".
```

Un estudio contable puede aplicar el mismo patrón: comprobar periodo tributario, identidad del cliente y documento fuente antes de redactar. El modelo ayuda a preparar; la aprobación profesional sigue donde corresponde.

No conviertas todo en una regla. Prioriza lo que evita pérdidas, errores públicos o trabajo repetido. Una lista de 80 prohibiciones se vuelve difícil de mantener y puede empeorar resultados por contradicción.

## 06 · Prueba el contexto antes de confiar

**Una respuesta buena no demuestra consistencia**

Prepara diez casos: cuatro normales, dos incompletos, dos ambiguos, uno fuera de alcance y uno con documentos contradictorios. Ejecuta la misma instrucción y registra qué ocurrió.

```
TABLA DE PRUEBA

Caso: [nombre]
Resultado esperado: [qué debería hacer]
Documentos relevantes: [lista]
¿Usó datos correctos?: [sí/no]
¿Detectó faltantes?: [sí/no]
¿Respetó límites?: [sí/no]
Corrección necesaria: [texto]
Nueva regla o ejemplo: [solo si corresponde]
```

Supón que Claude escribe buenas propuestas en ocho casos, pero inventa plazos cuando el cliente no entrega una fecha. La solución no es agregar “sé preciso”. Agrega una regla concreta: “Todo plazo debe venir del caso o marcarse [POR CONFIRMAR]”, conserva los dos casos fallidos y vuelve a probar.

Versiona el paquete con nombres simples: `contexto-v1`, `contexto-v2`. Registra qué cambió y qué fallo lo motivó. Así puedes saber si una mejora arregló un caso o rompió otros tres.

Checklist antes de usar el sistema en producción:

- [ ] Los documentos tienen fecha y responsable.
- [ ] Los precios y enlaces vienen de una fuente vigente.
- [ ] Existen ejemplos aprobados y rechazados.
- [ ] Los datos faltantes se marcan, no se inventan.
- [ ] Hay casos fuera de alcance y contradictorios en la prueba.
- [ ] Una persona revisa salidas de alto impacto.
- [ ] El resultado queda registrado para aprender de los errores.

## 07 · Reglas clave

**Lo que debes cuidar para que el contexto siga sirviendo**

- **Un proyecto por ámbito real** — no mezcles reglas de dos marcas o clientes en la misma base.
- **Una fuente de verdad por dato sensible** — define dónde vive el precio, fecha o política vigente.
- **Contexto no significa pegar todo** — incluye lo necesario para decidir; archiva lo obsoleto.
- **Ejemplos antes que adjetivos** — tres piezas aprobadas enseñan más tono que “cercano y premium”.
- **Casos difíciles desde el principio** — prueba faltantes, contradicciones y solicitudes que deben rechazarse.
- **Skills para procedimientos** — úsalas cuando existe una secuencia repetible, no como depósito de documentos.
- **Revisión humana según riesgo** — una idea interna y una propuesta enviada a un cliente no requieren el mismo control.

Claude no necesita conocer cada detalle de tu empresa. Necesita el contexto que cambia decisiones, los criterios que definen calidad y ejemplos que muestren cómo se ve un resultado correcto. Ese paquete convierte una conversación genérica en una herramienta de trabajo que puedes revisar y mejorar.

---

### Guías relacionadas

- [De 50 tutoriales a un sistema de IA que tu negocio pueda repetir](/guias/de-50-tutoriales-a-un-sistema-de-ia-que-tu-negocio-pueda-repetir)
- [Recursos y guías de CrececonIA](/guias)
