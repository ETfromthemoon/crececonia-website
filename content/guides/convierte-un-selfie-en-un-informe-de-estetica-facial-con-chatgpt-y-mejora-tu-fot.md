# Auditoría de skills de guiones de Instagram

Fecha: 4 de septiembre de 2026. Solicitud: identificar cuáles están bien diseñadas, cuáles fallan y qué conservar en un sistema de una a cuatro skills.

## Dictamen

**Recomiendo una sola skill de entrada para guiones, con estructuras internas elegidas según el texto.** No todas las actuales están mal. Hay buenos controles de evidencia, retención y edición que conviene recuperar. El problema es que varias instrucciones anteponen una receta o un mensaje de marca al contenido que Sergio entrega.

Tres capas explican el problema:

1. **Diseño editorial:** se obliga a usar dolor, contradicción, experiencia personal, suspense, conectores o temas de marca incluso cuando la fuente pide otra cosa.
2. **Fidelidad:** algunos procesos comprimen el texto antes de escribir y no comprueban qué hechos, ejemplos y matices sobrevivieron.
3. **Funcionamiento:** hay enlaces rotos, un validador que falla y un extractor que puede reutilizar material de otro reel.

Se revisaron instrucciones, referencias, ejemplos, scripts y enlaces. Esto permite diagnosticar diseño e integridad. **No permite afirmar que una skill haya aumentado o reducido la retención real de la cuenta:** no se analizaron aquí publicaciones con curvas comparables ni un registro de qué skill generó cada guion. Los problemas de diseño explican mecanismos plausibles, no prueban por sí solos cuál produjo cada respuesta pasada.

## Alcance de la búsqueda

La búsqueda recorrió carpetas de usuario bajo `C:/Users/sergio`, incluyendo Codex, Claude, Documents, proyectos y skills archivadas; también consultó `E:/WORK` y `E:/respaldo`. Se inspeccionaron aparte los enlaces de instalación y paquetes relevantes del workspace.

El barrido encontró 3.155 archivos por nombre relacionado con skills/guiones y 73 archivos `SKILL.md` con coincidencias temáticas, correspondientes a 50 contenidos distintos por SHA-256. **No son 73 guionistas distintos**: incluyen duplicados, respaldos, herramientas de video y coincidencias incidentales. Los tres componentes de `social-media-skills` se revisaron adicionalmente.

Se excluyeron dependencias, repositorios internos de Git, caches y `AppData` del barrido recursivo. No se inspeccionó todo el disco de sistema, otros perfiles ni volúmenes inaccesibles. La unidad D fue enumerada, pero no se obtuvo un árbol utilizable. Los comandos de búsqueda registraron cero errores en las raíces finalmente recorridas; esto no certifica cobertura absoluta del computador.

Inventario reproducible: [candidatas y hashes](skills-candidatas.csv), [archivos detectados](archivos-detectados.txt). No se instalaron, eliminaron ni modificaron las skills existentes.

## Cuáles conservar, mejorar o retirar del trabajo de guiones

Los veredictos de esta tabla son sobre diseño y dependencias; «bien» no significa rendimiento de Instagram demostrado.

| Skill o componente | Estado encontrado | Evaluación y decisión |
|---|---|---|
| **crececonia-humanizer** | Disponible en Codex | **Bien delimitada como editora.** Protege hechos, citas, intención y matices. Conservar su método e incorporarlo al nuevo guionista. No genera por sí sola ángulos ni soluciona una mala base. |
| **crececonia-nutre** | Disponible en Codex, enlazada a fuente propia | **La mejor base del trío para contenido útil.** Elige entre demo/caso/auditoría, entrega valor durante el cuerpo y evita esconderlo para forzar DM. Mejorar ingesta y liberar la matriz de temas. |
| **crececonia-viral** | Disponible en Codex, enlazada a fuente propia | **Aprovechable con cambios importantes.** Tiene variantes de hooks, evidencia y cierre de promesas. La selección obligatoria dentro de cinco ángulos de marca favorece repetición. Absorber mecanismos en la skill única. |
| **crececonia-vende** | Disponible en Codex, enlazada a fuente propia | **Útil como especialización comercial.** Protege oferta, prueba y escasez. Su bloqueo de borradores cuando falta cualquier dato del pre-gate dificulta ideación. Mantener la lógica comercial como modo opcional, fuera del guion general. |
| **grabar** | Disponible en Codex como carpeta independiente | **Buena oralidad; demasiada receta.** Fuerza PERO→ENTONCES audibles y limita la entrega de hooks/visuales. Recuperar voz y concisión, retirar imposición verbal. |
| **guion-retencion** | Copia física en Claude idéntica a la archivada | **Buen núcleo de destilación; no usar intacta.** Extrae idea/dato/payoff, pero fuerza suspense, tres beats y re-loop, y solo entrega hooks alternativos si se piden después. Además exige un ADN de marca cuya ruta está rota. |
| **reel-a-guion** | Copia física en Claude idéntica a la archivada | **Buena fidelidad editorial; fallo de extracción.** Conservar como función de ingesta después de corregir la separación de archivos por reel y el estado de éxito. |
| **viral-script-builder** | Versión física en Claude; otra versión archivada | **No conservar como motor principal.** Sortea arquitectura de forma vinculante; simultáneamente impone ABT, rehook, metáfora, moraleja, elemento copiable y loop. Sus ejemplos enseñan a inventar experiencia y cifras. Recuperar solo recursos puntuales. |
| **viral-script-lite** | Disponible en Claude; copia archivada | **No satisface la necesidad actual.** Hereda ABT y las reglas del motor, pero su contrato excluye variantes y explicación de base. Retirar del conjunto de guiones; el modo compacto cabe dentro de una sola skill. |
| **pain-script** | Disponible en Claude; copia archivada | **Muy restrictiva para tu objetivo.** Prohíbe educar, exige diagnóstico y sistema con nombre, experiencia vivida y giro contraintuitivo. Puede empujar a autobiografía inventada. No conservar como generador general. |
| **guion-dolor-ia** | Disponible en Claude; copia archivada | **Más repetición de la misma fórmula comercial.** Obliga a tres dolores, historia propia y CTA de palabra clave; no permite tutoriales. Retirar como guionista general. |
| **contenido-builder** | Disponible en Claude; copia archivada | **Puede perder el insumo antes de escribir.** Envía solo título, gancho y 3–5 takeaways al generador. Es un orquestador de captación y carga, no un motor fiel al texto. Sacar de la ruta general de guiones. |
| **guiones-crececonia** | Archivo recuperable; enlace de Claude roto | **No funciona desde ese enlace.** El diseño anterior delega al motor y añade caption, lead y DM obligatorios. Conservar solo identidad útil como referencia. |
| **repo-a-yapping** | Archivo recuperable; enlace de Claude roto | **Recuperar lectura factual de repositorios.** Su ejecución editorial impone descubrimiento con hype y talking head. Integrar extracción de fuentes, no ese tono como norma. |
| **serie-firma** | Archivo recuperable; enlace de Claude roto | **Útil para planificar series.** No escribe el guion: delega. Recuperar continuidad y variación real de ángulos; no cuenta como guionista que resuelva este problema. |
| **radar-contenido-viral** | Disponible en Claude; copia idéntica archivada | **Investigación separada.** El ranking mezcla métricas y usa edades nominales para varias fuentes; no es evidencia de retención en Instagram. No ocupar una plaza de guiones. |
| **hook-generator**, **post-writer**, **content-matrix** del vendor | Archivos de proyecto | **No incorporarlos al sistema de Instagram.** Orientación LinkedIn, fórmulas rígidas y dependencias ausentes. La matriz sirve como ideas opcionales; no como catálogo «probado» que haya que completar. |
| **social** en proyectos de consultoría y copia en Documents | Varias copias locales | **Guía general, insuficiente para fidelidad.** Contiene estructuras útiles y apertura verbal/visual/textual, pero tiempos universales y cifras sin fuente. No reemplaza el diseño específico propuesto. |
| **explainer-video-guide** | Codex/Claude | **Guía de producción, no solución principal.** PAS/BAB y escenas son recursos; no contiene un control fuerte de fidelidad al texto. |

`_crececonia-content-core` es una biblioteca compartida, no otra skill. `crececonia-sistema` es un coordinador operativo y tiene disparadores amplios: conviene que escribir un guion no active tareas externas. `video`, `fabrica-videos-ia`, `ffmpeg`, `reels-editor` y `video-a-skill` tienen otras funciones y no deben contarse entre las cuatro de guiones. Las coincidencias con formación, carruseles, guías y operaciones se excluyen por alcance; no se certificó su funcionamiento.

## Evidencia concreta de las causas

### 1. Una matriz de marca está sustituyendo ángulos derivados del texto

El núcleo reduce la entrada a audiencia, creencias, costes, evidencia, tesis y objetivo. Falta un mapa de ejemplos, escenas, frases propias y restricciones que deban conservarse: [interaction-memory.md:9](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/_crececonia-content-core/interaction-memory.md:9>).

Después, los cinco ángulos son fuga del trabajo manual, IA sin humo, transformación demostrable, capacidad de equipo y disección de sistemas: [angles-formats-iacl.md:14](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/_crececonia-content-core/angles-formats-iacl.md:14>). Viral obliga a puntuar esa matriz y elegir dentro de ella: [SKILL.md:52](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/crececonia-viral/SKILL.md:52>).

Eso puede funcionar para planificar territorio editorial. Para transformar un texto, puede hacer desaparecer su hallazgo particular y devolver otra vez «el problema es el proceso».

### 2. La aleatoriedad cambia el molde, pero no garantiza pertinencia

La versión actual de Claude de [viral-script-builder:95](<C:/Users/sergio/.claude/skills/viral-script-builder/SKILL.md:95>) obliga a sortear estructura, hook, apertura, CTA y textura. La crítica posterior no puede cambiar libremente esa elección: línea 146. Al mismo tiempo exige ABT, doble hook, cortes, elemento copiable, moraleja y loop: línea 148.

El remedio para la repetición introduce otro problema: se elige una forma antes de comprobar si cuenta bien esta idea. La versión Lite sigue llamando «idéntico» a un proceso que omite el sorteo y conserva ABT obligatorio: [viral-script-lite:20](<C:/Users/sergio/.claude/skills/viral-script-lite/SKILL.md:20>).

### 3. Las instrucciones y los ejemplos invitan a completar con datos inexistentes

[pain-script:60](<C:/Users/sergio/.claude/skills/pain-script/SKILL.md:60>) pide inventar un nombre de diagnóstico y enseguida completar experiencia propia. Sus reglas obligan a decir que se estuvo cierto tiempo en esa situación: línea 222. Nombrar un recurso didáctico puede ser válido; presentarlo como experiencia o método probado requiere hechos.

En [viral-script-builder:514](<C:/Users/sergio/.claude/skills/viral-script-builder/SKILL.md:514>), una idea sobre prompts se convierte en dos años de uso y cuatro horas ahorradas por semana. Otro ejemplo introduce una pérdida de 600 USD que no estaba en la entrada: línea 521. Son ejemplos escritos en la skill, no resultados observados en esta auditoría. Aun así, enseñan el comportamiento equivocado.

### 4. El texto se comprime antes de llegar al guionista

[contenido-builder/references/guiones.md:22](<C:/Users/sergio/.claude/skills/contenido-builder/references/guiones.md:22>) exige pasar título, gancho y 3–5 takeaways, evitando el texto completo. Resumir no es necesariamente malo, pero aquí falta comprobar si el resumen conserva los matices y el ejemplo que hacían valiosa la fuente.

### 5. Hay fallos operativos, además de los editoriales

- Los enlaces de Claude a `guiones-crececonia`, `repo-a-yapping` y `serie-firma` existen, pero sus destinos bajo `INTERNO/skills propias` ya no contienen los archivos. La consolidación de agosto no dejó sincronizado ese repertorio.
- El validador del núcleo falla porque espera `INTERNO/skills propias/grabar/SKILL.md`, aunque Grabar está en `.codex/skills/grabar`: [validate_ecosystem.ps1:40](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/_crececonia-content-core/scripts/validate_ecosystem.ps1:40>). Fue ejecutado y devolvió ese error.
- [extraer_transcripcion.py:118](<C:/Users/sergio/.claude/skills/reel-a-guion/scripts/extraer_transcripcion.py:118>) reutiliza carpeta y basename. Tras fallar una descarga, puede leer subtítulos anteriores: líneas 131–155. La ruta de código permite contaminación entre reels; no se ejecutaron descargas para reproducirla en esta auditoría.
- Ese extractor también puede devolver `ok: true` con solo caption y cero bloques: [línea 192](<C:/Users/sergio/.claude/skills/reel-a-guion/scripts/extraer_transcripcion.py:192>). El estado debería distinguir metadata disponible de transcripción obtenida.

## Qué conservar del sistema actual

Hay trabajo aprovechable. [Humanizer:20](<C:/Users/sergio/.codex/skills/crececonia-humanizer/SKILL.md:20>) protege hechos e intención. [Hook engine:69](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/_crececonia-content-core/hook-engine.md:69>) pide mecanismos distintos en las variantes. [Retención:7](<C:/Users/sergio/SERGIOIA/INTERNO/skills propias/_crececonia-content-core/retention-platforms.md:7>) incorpora confirmación temprana, recompensas parciales y rehook condicional. La biblioteca de fuentes reconoce el sesgo de estudiar solo videos ganadores.

Conservaría esos mecanismos, la lectura de transcripciones reales y la distinción entre contenido educativo y comercial. Cambiaría el orden: **primero proteger la fuente; después encontrar ángulo y estructura; al final pulir la voz.**

## Qué significa «técnicas probadas» en esta propuesta

Meta documenta tiempo de reproducción y su utilidad para revisar aperturas, además de un gráfico de retención por momento. Eso respalda observar dónde se pierde atención y probar cambios, no un molde universal de guion. Fuentes: [métricas de Reels](https://about.fb.com/news/2023/04/instagram-reels-trending-audio-and-gifts-updates/), [gráfico de retención](https://about.fb.com/news/2023/11/new-ways-to-create-content-on-instagram/).

También documenta Trial Reels para explorar contenido inicialmente con no seguidores y menciona skip rate en Edits. Las descripciones no establecen asignación aleatoria entre nuestras variantes ni umbrales que aseguren alcance. Fuentes: [Trial Reels](https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/), [Edits](https://about.fb.com/news/2025/04/introducing-edits-streamlined-video-creation-app/).

En las fuentes consultadas no encontré validación oficial de que hook stacking, doble caída, cortes cada 3–5 segundos, rehooks cada 7–10 segundos u ocultar siempre el payoff sean reglas universales. Eso no las vuelve inútiles: hay que tratarlas como opciones editoriales y comprobarlas en la cuenta.

La propuesta distingue tres niveles: **documentado por la plataforma**, **hipótesis narrativa** y **observado en tus publicaciones**. Una cifra de vistas de otro creador no convierte su arquitectura en una causa demostrada. La referencia incluida desarrolla fuentes, límites y medición: [evidencia y pruebas](propuesta/guion-desde-tu-texto/references/evidencia-y-pruebas.md).

## La skill única recomendada

Preparé [guion-desde-tu-texto/SKILL.md](propuesta/guion-desde-tu-texto/SKILL.md), como propuesta revisable, sin instalarla ni activar nuevos disparadores.

Su entrega habitual sería:

1. Base clara: qué quiere decir tu texto, qué detalle lo sostiene y qué ángulo conviene.
2. Estructura elegida por el material: storytelling, demostración, argumento/comparación o diagnóstico/explicación, con libertad para adaptar.
3. Guion listo para grabar, o solo beats si pides una base.
4. Hasta seis hooks de mecanismos diferentes, compatibles con el mismo cuerpo, y una recomendación para probar.
5. Retención explicada con contenido: qué valor llega pronto, qué preguntas se abren y dónde se resuelven.
6. Revisión breve de lo conservado, lo omitido y cualquier dato pendiente.

**Hook stacking:** voz, texto e imagen complementan una misma promesa. Un ejemplo de taller puede abrir con la pregunta hablada, mostrar la hoja real en el parabrisas y añadir un texto que aclare la decisión. Tres capas pueden servir; tres promesas desconectadas sobrecargan. Los rehooks posteriores se apoyan en nuevos hechos, no en frases de suspense repetidas.

**Pruebas:** comparar dos aperturas manteniendo el cuerpo tan similar como sea posible, con igual ventana de observación y métricas disponibles. Si cambia todo el conjunto verbal/visual/textual, la prueba es sobre ese conjunto. La razón tiempo promedio/duración no es tasa de finalización. Un resultado aislado y sin audiencia comparable es una señal, no validación causal.

## Si prefieres conservar exactamente cuatro

La alternativa es repartir el trabajo, con el mismo contrato de fidelidad compartido:

| Función | Qué hace | Qué recuperaría |
|---|---|---|
| Fuente y ángulos | Extrae tesis, detalles y evidencia; desarrolla posibilidades | Lo mejor de reel-a-guion, repo-a-yapping y guion-retencion |
| Guion | Elige arquitectura y escribe según el material | Nutre, oralidad de Grabar y retención del núcleo |
| Hooks y pruebas | Diseña aperturas compatibles y experimentos | Hook engine y registro de resultados |
| Edición y aprendizaje | Comprueba fidelidad, voz, repetición y resultados | Humanizer y métricas propias |

Esta sería una arquitectura nueva, no cuatro skills actuales listas para conservar intactas. Para tu petición habitual —«toma este texto y conviértelo en un buen guion»— la skill única evita tener que coordinar cuatro herramientas. No recomiendo mantener cuatro escritores que compitan por la misma entrada.

## Validación y límites de la propuesta

La propuesta pasó el validador estructural de skills. Esa prueba comprueba formato y metadatos; no certifica creatividad ni rendimiento. Se preparó además una ejecución independiente con dos casos sintéticos, para evaluar preservación de detalles, matices, variedad de hooks y diferenciación de estructuras: [resultados de prueba](prueba-propuesta.md). La revisión de esos resultados se documenta en [evaluación](evaluacion-propuesta.md).

Estos casos no son publicaciones reales ni una comparación estadística con las skills anteriores. Para validar el resultado que te importa, el siguiente uso debe ser con textos tuyos y, después, con datos de los videos publicados. La propuesta no exige esperar esa validación para ayudarte a escribir; exige no inventar que ya ocurrió.

Anexos de revisión: [skills actuales](anexo-skills-actuales.md), [skills clásicas y enlaces](anexo-skills-clasicas.md).
