# Guía completa para usar Claude Code

Que es Claude Code, los 3 modos de Claude (chat/cowork/code), instalacion paso a paso, prompts reales, modo plan, conectores MCP, habilidades/skills, y cuanto cuesta.

#claude code#ia#cli#productividad#agentes#mcp#skills

> Cancelé 4 suscripciones de IA cuando entendí que Claude hacía las tres cosas por las que pagaba por separado. Esta guía te explica exactamente cuáles son, cómo funcionan, y cómo llegar al nivel donde una sola herramienta reemplaza a media docena.

## Qué vas a aprender

  * Los 3 modos de Claude y cuál usar según lo que necesitás
  * Qué es Claude Code y por qué es diferente a pegar código en un chat
  * Cómo instalarlo en Mac, Windows o Linux en 2 minutos
  * Cómo pedirle bien las cosas, con prompts que podés copiar
  * El modo plan, los comandos y los atajos que usan los que van rápido
  * Los dos superpoderes reales: conectores y habilidades
  * Cuánto cuesta de verdad y cómo no quemar tu límite a mitad de semana

## 00 · Los 3 modos de Claude

Antes de entrar al Code, entendé el ecosistema completo

Claude no es una sola cosa. Tiene tres modos, y dependiendo de lo que necesitás, uno u otro cambia todo.

Modo 1 — Chat El más conocido. Pero no te confundas: no es solo "preguntarle cosas". Le tirás un PDF de 300 páginas y te lo resume en 5 puntos. Le pegás una imagen y la analiza. Le mandás un contrato en inglés y te lo traduce con contexto legal. Le pasás una planilla de Excel y te explica qué están haciendo los datos.

La diferencia con un buscador o con ChatGPT: entiende contexto largo, razona sobre el documento entero, y no te da respuestas genéricas — trabaja sobre lo que vos le mandás.

Modo 2 — Cowork Acá empieza lo que la mayoría no conoce. Con los conectores MCP (lo explico en detalle más abajo), Claude se conecta a tus herramientas reales: Gmail, Notion, Google Calendar, Slack, tu CRM. Y no solo "lee" — trabaja desde adentro.

Ejemplo concreto:

    `Mirá mis reuniones de la semana y armame un resumen en Notion con los puntos pendientes de cada una.
    `

Y lo hace solo. Sin copiar nada, sin exportar nada. Trabaja sobre tus datos reales.

Modo 3 — Code (Claude Code) El que rompe la cabeza. Le pedís "armame una página web para mi negocio" o "haceme una herramienta que descargue mis facturas de AFIP" y la construye. Vos. Sin saber programar. Una instrucción en español, y tenés algo funcionando.

Para los que sí programan, es otro nivel: lee tu proyecto entero, edita varios archivos a la vez, corre los tests, ve si fallan y los corrige. No es un asistente que te sugiere — es un programador que ejecuta.

### La magia real: Acceso + Repetición

Hay dos cosas que convierten a Claude de "herramienta útil" a "sistema que trabaja por vos":

  * Conectores — puentes que le dan acceso a tus apps. Le dás acceso una vez y desde ahí puede trabajar con tus datos reales.
  * Habilidades — le enseñás una tarea una vez (por ejemplo, escribir tus guiones con tu tono exacto) y la repite igual para siempre, sin que volvás a explicarle.

Acceso + Repetición = la magia.

Por eso cancelé 4 apps: una herramienta que accede a todo lo que usás y repite lo que le enseñás reemplaza a media docena de herramientas específicas.

El resto de esta guía es sobre el Modo 3 en profundidad, que es donde está el mayor potencial y el menos explorado.

* * *

## 01 · Qué es Claude Code

Un agente que trabaja sobre tus archivos, no un chat que responde

La diferencia con un chat normal es grande. A ChatGPT le pegas un trozo de código y te devuelve texto que después tú copias, pegas y arreglas. Claude Code lee tu proyecto completo, edita varios archivos a la vez, corre comandos en tu máquina, ejecuta los tests, ve si fallan y los corrige. Tú le hablas en español; él hace el trabajo y te muestra los cambios para que apruebes.

Pensalo como un programador senior sentado a tu lado: le explicás qué querés y lo resuelve, sin que tengas que dictarle cada línea.

Y no vive solo en la terminal. El mismo Claude Code corre en tu terminal, en VS Code, en JetBrains, en una app de escritorio, en el navegador (claude.ai/code) y hasta desde el celular. Tus configuraciones se comparten entre todos.

Ejemplo de la diferencia, pedido textual:

    `hay un bug: cuando un cliente guarda el formulario sin teléfono, la app tira error 500. encuéntralo y arréglalo
    `

Un chat te pediría que le pegues el código. Claude Code rastrea el error por tu proyecto, encuentra la causa, aplica el fix, corre la app para confirmar que ya no falla, y te muestra exactamente qué tocó.

## 02 · Instalación

Elegí tu sistema (menos de 2 minutos)

La forma recomendada es el instalador nativo (se actualiza solo en segundo plano). Abrí tu terminal y pegá lo que corresponda:

Mac / Linux / WSL:

    `curl -fsSL https://claude.ai/install.sh | bash
    `

Windows (PowerShell):

    `irm https://claude.ai/install.ps1 | iex
    `

Si ya tenés Node.js (cualquier sistema):

    `npm install -g @anthropic-ai/claude-code
    `

En Mac también está `brew install --cask claude-code`, y en Windows `winget install Anthropic.ClaudeCode`.

Después, entrá a la carpeta de tu proyecto y arrancalo:

    `cd mi-proyecto
    claude
    `

La primera vez te pide iniciar sesión (con tu cuenta de Claude Pro/Max, o una API key si usás la consola de Anthropic). Listo.

Tip para Windows: instalá Git for Windows. Sin eso, Claude Code usa PowerShell como shell; con Git instalado puede usar Bash, que le funciona mejor para correr comandos.

## 03 · La app de escritorio

La forma más cómoda de arrancar — sin terminal, sin configuración

Si la idea de "instalar algo en la terminal" te frenó, esta es tu entrada. Claude tiene una app nativa para Mac y Windows que instalás igual que cualquier programa y te da acceso a todo: el chat, Claude Code, los conectores MCP, y la configuración, desde una interfaz visual.

Cómo instalarla:

Bajala desde claude.ai/download (Mac o Windows). Una vez instalada, iniciá sesión con tu cuenta de Claude Pro/Max y ya está.

Qué podés hacer desde la app:

  * Chat completo — igual que en el navegador, pero sin abrir el browser. La tenés siempre accesible desde la barra de tareas/menú.
  * Claude Code integrado — abrís una sesión de Code desde adentro de la app, elegís la carpeta de tu proyecto y arranca directo. No necesitás abrir una terminal aparte.
  * Gestión de proyectos — guardás diferentes proyectos con su propio contexto, instrucciones (`CLAUDE.md`) y historial. Cambiás entre ellos con un clic.
  * Conectores MCP en modo gráfico — agregás y administrás servidores MCP (Gmail, Notion, etc.) desde la configuración visual, sin editar archivos JSON a mano.
  * Acceso al sistema — en Mac, la app puede tomar capturas de pantalla, leer lo que tenés en pantalla y trabajar sobre eso. Útil para "mirá este error y decime qué pasa".
  * Atajo global — configurás un shortcut de teclado (por ejemplo `Cmd/Ctrl + Shift + C`) para abrirla desde cualquier app sin alt-tab.

Cuándo usar la app vs la terminal:

Situación  | Recomendado
--- | ---
Recién arrancás con Claude  | App de escritorio
Querés chatear o analizar documentos  | App de escritorio
Configurar conectores MCP por primera vez  | App de escritorio
Trabajar en un proyecto de código  | Terminal o VS Code
Scripts y automatizaciones (`claude -p`)  | Terminal
Integración con el editor de código  | VS Code / JetBrains

La app y la terminal comparten la misma cuenta, los mismos proyectos y la misma configuración. No son excluyentes — muchos usan la app para el chat y la terminal para el Code.

## 04 · Tu primer día

Háblale como a una persona, y entendé los permisos

No hay sintaxis que aprender. Le escribís lo que querés, en español, lo más concreto posible. Algunos para arrancar:

    `explicame qué hace este proyecto y por dónde le entro
    agregale un botón "exportar a PDF" a la tabla de clientes
    escribí tests para el módulo de facturación y correlos
    revisá este archivo y decime qué se puede simplificar
    `

Tres cosas que conviene saber desde el primer día:

  * Ve tu proyecto entero, no solo lo que le pegás. Podés referirte a archivos con `@` (ej. `revisá @app/models.py`) y autocompletar con `Tab`.
  * Te pide permiso antes de modificar un archivo o correr un comando. Vos aprobás o rechazás. Es a propósito: nada pasa sin tu OK.
  * Si te cansa aprobar lo mismo mil veces, con `/permissions` le das permiso permanente a ciertas acciones (por ejemplo, correr los tests sin preguntar).

Regla de oro del primer día: una tarea por mensaje. "Arreglá este bug" rinde mucho más que "arreglá el bug, agregá login, cambiá los colores y subí todo".

## 05 · El modo plan

Que piense antes de tocar nada (tu mejor amigo en tareas grandes)

Para cambios chicos, dejá que actúe directo. Para algo grande (una feature nueva, un refactor), usá el modo plan: Claude lee, entiende y te arma un plan paso a paso ANTES de tocar un solo archivo. Vos lo revisás, ajustás lo que no te cierra, y recién ahí ejecuta.

Por qué importa: evita que se mande a hacer 20 cambios en la dirección equivocada. Revisás el plan en 30 segundos y te ahorrás media hora de deshacer.

Cómo activarlo: presioná `Shift+Tab` para ciclar entre modos hasta llegar a plan mode (lo vas a ver indicado abajo). O arrancá directamente en ese modo:

    `claude --permission-mode plan
    `

Usalo siempre que la tarea te genere dudas de "¿y si lo hace mal?". Para eso está.

## 06 · Comandos y atajos que vas a usar

Los `/comandos` y las teclas que te hacen ir rápido

Dentro de Claude Code, los comandos empiezan con `/`. Estos son los que más vas a tocar:

Comando  | Para qué
--- | ---
`/help`  | Ver todos los comandos
`/clear`  | Limpiar la conversación y empezar fresco
`/model`  | Cambiar de modelo (Opus, Sonnet, Haiku)
`/init`  | Generar un `CLAUDE.md` para tu proyecto
`/cost`  | Ver cuánto llevás consumido en la sesión
`/review`  | Revisión de código de tu rama actual
`/commit`  | Commitear con un mensaje auto-generado
`/mcp`  | Conectar/gestionar herramientas externas (MCP)
`/resume`  | Retomar una sesión anterior
`/config`  | Abrir la configuración

Atajos de teclado que valen oro:

Tecla  | Acción
--- | ---
`Shift + Tab`  | Ciclar modos (normal / auto-aceptar / plan)
`Esc`  | Interrumpir lo que está haciendo
`Ctrl + C`  | Frenar el turno actual (dos veces: salir)
`Tab`  | Autocompletar comandos, archivos y `@`-menciones
`Ctrl + R`  | Buscar en tu historial de prompts
`Shift + Enter`  | Salto de línea sin enviar

Y desde fuera, en la terminal: `claude -c` retoma la última sesión, y `claude -p "tarea"` lo corre sin abrir la interfaz (ideal para scripts). Esto último habilita cosas potentes:

    `tail -200 app.log | claude -p "avisame si ves algún error raro"
    `

## 07 · Los superpoderes: conectores, habilidades, subagentes y hooks

Lo que lo convierte de asistente a sistema — la fórmula Acceso + Repetición en detalle

### Conectores (MCP)

El estándar para conectar Claude a tus herramientas reales: Gmail, Google Calendar, Notion, Jira, Slack, tu base de datos, tu propio CRM. Con `/mcp` agregás un servidor y Claude puede leer tus docs, actualizar tickets, o armar resúmenes desde tus reuniones reales — como parte del trabajo, no como extra.

Ejemplo concreto del Modo Cowork:

    `revisá mi Gmail de los últimos 3 días, filtrá los emails de clientes sin respuesta y armame un borrador para cada uno
    `

Esto no es ciencia ficción. Es lo que pasa cuando le dás acceso a tus herramientas. El conector se configura una vez, y desde ahí el acceso es permanente.

### Habilidades (Skills)

Instrucciones especializadas que empacás una vez y reutilizás. La idea: le enseñás una tarea una vez con tu tono, tu formato, tus reglas — y la repite igual para siempre, sin que volvás a explicarle.

Ejemplo:

    `/guion
    `

Si tenés una skill llamada `guion` que sabe cómo escribís vos —tu cadencia, tus ejemplos, tu estructura de gancho y CTA—, cada vez que la llamás produce algo que suena tuyo. No genérico. Tuyo.

Las skills se guardan como archivos de texto y se comparten entre proyectos. Podés crear las tuyas o instalar las de la comunidad.

### Subagentes

Instancias de Claude con su propio contexto que trabajan en paralelo. Un agente líder reparte el trabajo (uno revisa seguridad, otro escribe tests, otro documenta) y junta resultados. Sirve para tareas grandes sin saturar una sola conversación.

### Hooks

Comandos que se corren automáticamente antes o después de cada acción: formatear el código después de cada edición, correr el linter antes de un commit, notificarte cuando termina una tarea larga. Configurás una vez y se aplica siempre.

* * *

No necesitás todo esto el día uno. Pero saber que existe te marca el techo: Claude Code escala de "me ayuda con un archivo" a "automatiza mi flujo entero". Conectores + Habilidades = Acceso + Repetición = el sistema.

## 08 · CLAUDE.md: la memoria de tu proyecto

Para no repetirle lo mismo en cada sesión

Corré `/init` y Claude genera un archivo `CLAUDE.md` en la raíz del proyecto. Lo lee al inicio de cada sesión. Ahí ponés tus reglas para que no las olvide:

    `# CLAUDE.md
    - Stack: Next.js + Tailwind. No usar otras librerías de UI sin avisar.
    - Correr `npm test` antes de dar por terminada una tarea.
    - Commits en español, formato: tipo: descripción.
    - NUNCA tocar la carpeta /legacy.
    `

Además, Claude arma su propia "auto memoria" mientras trabaja: guarda aprendizajes (comandos de build, cómo se debuggea cierto módulo) entre sesiones, sin que escribas nada. Mientras mejor sea tu `CLAUDE.md`, menos te repetís y menos errores comete.

## 09 · Cuánto cuesta

Planes y límites, sin letra chica

Hay dos formas de pagarlo:

  * Suscripción (la más usada): plan Pro a USD 20/mes (incluye Sonnet y Opus, alcanza para uso diario personal), Max 5x a USD 100/mes y Max 20x a USD 200/mes para quien lo usa a fondo todo el día.
  * API (pagás por token): para automatizaciones o equipos; cobrás por lo que consumís.

El detalle importante: el uso se mide en una ventana que se renueva cada 5 horas, con un tope semanal por encima. O sea, no es ilimitado: si le das con todo un día entero, podés tocar el límite. Con `/cost` ves cuánto llevás en la sesión.

Para la mayoría que arranca, el plan Pro alcanza de sobra. Si Claude Code se vuelve tu herramienta principal de trabajo, ahí sí conviene un Max.

## 10 · Reglas clave

Lo que tenés que saber para no frustrarte

  * Una tarea a la vez — rinde más que diez cosas en un solo mensaje.
  * Sé específico — "cambiá el header a fondo azul oscuro" gana a "mejorá el diseño".
  * Modo plan para lo grande — revisás el plan antes de que ejecute. Te ahorra deshacer.
  * `/clear` entre tareas distintas — una conversación larga se vuelve lenta y consume más. Reiniciá.
  * Revisá antes de aprobar — vos mandás siempre; mirá el cambio antes de darle OK.
  * Dale contexto con `CLAUDE.md` — el 80% de los "lo hizo mal" es porque no sabía tu regla.
  * Si algo sale raro, `Esc` y reformulá — no insistas con el mismo prompt.
  * Guardalo — esto no se aprende de una. Volvé a esta guía cuando empieces a usar cada sección nueva.

* * *
