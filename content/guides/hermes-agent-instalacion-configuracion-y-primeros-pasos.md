# Hermes Agent: instalacion, configuracion y primeros pasos

Guia completa para instalar y usar Hermes Agent de Nous Research, el agente IA auto-mejorable con learning loop, messaging gateway y cron.

#hermes#nous#agente#ia#cli

> La mayoría de los agentes de código olvidan lo que hicieron ayer. Hermes Agent no: se acuerda, aprende de sus errores y mejora solo.

## Qué vas a aprender

  * Qué es Hermes Agent y por qué su "learning loop" lo hace diferente de Claude Code, OpenCode o Codex
  * Cómo instalarlo en Linux, macOS o Windows (nativo, sin WSL)
  * Configuración básica: elegir modelo, conectar herramientas, primer uso
  * Cómo hablarle desde Telegram, Discord, WhatsApp y Signal con el Messaging Gateway
  * Cómo crear skills automáticas desde la experiencia (el loop de mejora continua)
  * Diferencia con OpenClaw y cómo migrar si vienes de ahí

## 01 · Hermes Agent no es otro clon de Claude Code

Hermes Agent es el agente de código auto-mejorable de Nous Research. 189.000 estrellas en GitHub, 32.000 forks, licencia MIT. No es solo otro CLI para code con IA: es el único agente que aprende de sus propias conversaciones.

Mientras los demás agentes empiezan de cero en cada sesión, Hermes:

  * Crea skills automáticamente después de tareas complejas — convierte lo que aprendió en un skill reutilizable
  * Mejora sus skills durante el uso — si una skill falla, la corrige solo
  * Tiene memoria persistente con FTS5 + resúmenes LLM — busca en conversaciones pasadas y recuerda quién eres
  * Se ejecuta en segundo plano — podés hablarle desde Telegram mientras trabaja en un VPS
  * Programa tareas automáticas con cron nativo: reportes diarios, backups nocturnos, auditorías semanales

No está atado a tu laptop. Corre en un VPS de $5, en un cluster GPU, o en serverless (Modal, Daytona) que hiberna cuando no lo usas.

* * *

## 02 · Instalación

### Linux, macOS, WSL2

    `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
    source ~/.bashrc
    hermes
    `

### Windows (nativo, PowerShell — no necesitas WSL)

    `iex (irm https://hermes-agent.nousresearch.com/install.ps1)
    hermes
    `

El instalador de Windows maneja todo: uv, Python 3.11, Node.js, ripgrep, ffmpeg y un Git Bash portátil. No toca tu instalación de Git existente.

### Post-instalación

    `hermes                    # Arranca el CLI interactivo
    hermes model              # Elegí proveedor y modelo
    hermes setup              # Asistente completo de configuración
    hermes doctor             # Diagnosticar problemas
    `

## 03 · Modelos y proveedores

Hermes no te ata a ningún modelo. Usá cualquiera:

Proveedor  | Comando
--- | ---
Nous Portal (recomendado, todo en uno)  | `hermes setup --portal`
OpenRouter (200+ modelos)  | `hermes model openrouter:<modelo>`
OpenAI  | `hermes model openai:<modelo>`
Anthropic  | `hermes model anthropic:<modelo>`
Ollama (local)  | `hermes model ollama:<modelo>`
Cualquier endpoint OpenAI-compatible  | configurar en `~/.hermes/config.yaml`

Nous Portal te da 300+ modelos + Tool Gateway (web search, generación de imágenes, TTS, browser cloud) en una sola suscripción. Un solo OAuth y estás listo.

Para cambiar de modelo en medio de una conversación:

    `/model openrouter:anthropic/claude-sonnet-4-5
    `

Sin cerrar nada, sin perder contexto.

## 04 · Primeros pasos: de cero a productive

### Conversación básica

    `hermes
    `

Adentro del CLI:

  * Escribís normal, como en ChatGPT
  * `/help` lista todos los comandos
  * `/new` o `/reset` para conversación nueva
  * `/retry` para regenerar la última respuesta
  * `/undo` para deshacer
  * `/compress` para comprimir contexto cuando se alarga

### Habilidades (tools)

    `hermes tools
    `

Viene con 40+ tools preinstaladas: filesystem, web search, code execution, image generation, y más. Podés activar/desactivar por toolset.

### Skills (procedural memory)

Los skills son instrucciones reutilizables. Hermes los crea solo cuando detecta un patrón repetitivo:

    `/skills          # listar skills instalados
    /skill-nombre    # ejecutar un skill directamente
    `

Cuando completás una tarea compleja, Hermes puede crear un skill automáticamente. La próxima vez que necesites algo similar, lo ejecuta sin pensar.

* * *

## 05 · Messaging Gateway: tu agente en todos lados

Hermes no vive solo en la terminal. Su Messaging Gateway te permite hablarle desde cualquier plataforma.

    `hermes gateway setup    # Configurar plataformas
    hermes gateway start    # Iniciar el gateway
    `

### Plataformas soportadas

Plataforma  | Qué podés hacer
--- | ---
Telegram  | Mandar mensajes, recibir respuestas, comandos slash
Discord  | Igual, en tu servidor de Discord
Slack  | Directo o en canales
WhatsApp  | A través de proveedores compatibles
Signal  | Mensajes cifrados
Email  | Enviar y recibir correos procesados por el agente

### Configuración típica para Telegram

  1. Creás un bot con BotFather en Telegram
  2. `hermes gateway setup` → seleccionás Telegram → pegás el token
  3. `hermes gateway start`
  4. Le escribís a tu bot desde Telegram y Hermes responde

Todo corre desde un solo proceso gateway. Tu agente está en tu VPS, pero vos le hablás desde cualquier lado.

El gateway también soporta transcripción de voz: mandás un audio de Telegram y Hermes lo transcribe y responde.

## 06 · El learning loop: cómo mejora solo

Esta es la diferencia radical con otros agentes.

Paso 1 — Ejecución: Hacés una tarea compleja (ej: "auditá este proyecto Django y generá un plan de refactor").

Paso 2 — Skill creation: Hermes detecta que la tarea fue compleja y te pregunta si quiere crear un skill. Si aceptás, empaqueta el approach en `~/.hermes/skills/` como un archivo reutilizable.

Paso 3 — Self-improvement: Cada vez que usás ese skill, Hermes registra qué funcionó y qué no. Si detecta un patrón de mejora, lo ajusta solo.

Paso 4 — Memoria cruzada: Cuando iniciás una sesión nueva, Hermes busca en sesiones anteriores (FTS5 + resumen LLM) información relevante. No empieza de cero.

Paso 5 — User modeling: Con el tiempo, Hermes construye un perfil de cómo trabajás: qué estilo de código preferís, qué herramientas usás, qué nivel de detalle querés en las respuestas.

No es "un chat con memoria". Es un agente que realmente mejora con el uso.

## 07 · Automatizaciones programadas (cron)

Hermes tiene un cron scheduler nativo. Podés programar tareas en lenguaje natural:

    `/crear tarea "Todos los lunes a las 9 AM, revisá los logs del servidor y mandame un resumen por Telegram"
    `

O configurarlo directamente:

    `hermes cron add --schedule "0 9 * * 1" --task "Revisar logs y resumir" --platform telegram
    `

Las tareas se ejecutan aunque no estés conectado. El gateway las entrega donde hayas configurado.

## 08 · Diferencia con OpenClaw y migración

Si venís de OpenClaw, Hermes tiene un migrador automático:

    `hermes claw migrate              # Migración interactiva completa
    hermes claw migrate --dry-run    # Vista previa sin migrar
    `

Migra automáticamente: SOUL.md (persona), memorias, skills, command allowlist, config de mensajería, API keys y workspace instructions.

Las diferencias principales:

  * Hermes tiene learning loop (skills auto-creados y auto-mejorados); OpenClaw no
  * Hermes tiene messaging gateway nativo (Telegram, Discord, Slack, WhatsApp, Signal); OpenClaw requiere plugins externos
  * Hermes tiene cron scheduler incorporado
  * Hermes soporta subagentes aislados para workstreams paralelos
  * Ambos son MIT, ambos soportan MCP

## 09 · Reglas para no fracasar

  1. No le tengas miedo al learning loop. Que cree skills automáticamente puede sentirse invasivo al principio. Revisalos con `/skills`, editalos si algo no calza. Con el tiempo se vuelven increíblemente precisos.

  2. Usá gateway desde el día 1. La gracia de Hermes no es el CLI — es que podés mandarle una tarea desde Telegram mientras estás en otra cosa. Configuralo antes de la primera semana.

  3. Elegí bien el modelo base. Hermes funciona con cualquier modelo, pero los que tienen buen tool-calling (Claude Sonnet, GPT-4o) aprovechan mucho mejor el sistema de skills y subagentes.

  4. Cuidado con la memoria en tareas muy largas. Usá `/compress` cuando el contexto se alargue. Hermes lo maneja bien, pero sigue siendo un LLM con límite de tokens.

  5. El cron es para tareas estables. No programes algo que requiere supervisión constante. Usalo para reportes, monitoreo, backups — tareas que si fallan un día, no es desastre.

  6. Migrá desde OpenClaw con `--dry-run` primero. Revisá qué se va a migrar antes de hacerlo. Casi todo pasa bien, pero siempre conviene verificar.
