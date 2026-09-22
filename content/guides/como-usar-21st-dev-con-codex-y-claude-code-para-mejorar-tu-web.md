> Una web no mejora por ponerle más animaciones. Mejora cuando cada bloque explica mejor la oferta, se entiende en celular y lleva a la persona al siguiente paso. 21st.dev te ahorra la parte lenta de construir esos bloques desde cero.

## Qué vas a aprender

- Qué es [21st.dev](https://21st.dev) y por qué no funciona como una librería tradicional de React.
- Cómo buscar un hero, tabla de precios, testimonios, formulario o CTA que tenga sentido para tu página.
- Cómo llevar un componente a un proyecto con React, Next.js, Tailwind y shadcn/ui.
- Cómo pedirle a Codex o Claude Code que lo implemente sin romper tu diseño actual.
- Qué revisar antes de subir el cambio a producción: conversión, celular, accesibilidad y rendimiento.

## 01 · Qué resuelve 21st.dev
**No partes desde una caja vacía ni dependes de un componente cerrado.**

21st.dev es un catálogo de componentes React, secciones de marketing, temas y plantillas creadas por la comunidad. Hay héroes, comparadores, tablas de precios, fondos, menús, formularios, cards y bloques de testimonios. Los puedes previsualizar, revisar y llevar a tu proyecto.

La diferencia importante: no agregas una dependencia gigante que manda sobre toda tu interfaz. El código del componente termina dentro de tu repositorio, normalmente siguiendo las convenciones de React, Tailwind y [shadcn/ui](https://ui.shadcn.com/). Eso te da libertad para editar textos, colores, espaciados y comportamiento. También te deja una responsabilidad: revisar el código antes de darlo por bueno.

Para una pyme, el uso más útil no suele ser “hacer la web más futurista”. Suele ser arreglar un bloque que hoy no vende ni explica bien. Por ejemplo:

| Problema en la página | Bloque que conviene buscar | Resultado que persigues |
| --- | --- | --- |
| La gente no entiende qué vendes en 5 segundos | `hero`, `features`, `bento grid` | Propuesta clara y CTA visible |
| Te preguntan siempre cuánto cuesta | `pricing table`, `comparison` | Menos dudas antes de comprar |
| Hay visitas pero poca confianza | `testimonials`, `logos`, `case study` | Prueba social concreta |
| El formulario parece un trámite | `contact form`, `booking`, `lead capture` | Más personas dejan datos |

*Mi criterio: un componente bonito que no aclara una decisión del visitante sobra. Parte por el cuello de botella de la página, no por el efecto visual que viste en X.*

## 02 · Lo mínimo que necesitas antes de instalar algo
**Una base ordenada evita que el componente entre peleando con el resto de tu web.**

21st está pensado principalmente para proyectos React. El camino más cómodo aparece cuando la web ya usa Next.js o Vite, Tailwind CSS y shadcn/ui. Si tu sitio está en WordPress, Webflow o un constructor sin React, igual te puede servir como referencia de diseño, pero no copies el TSX esperando que funcione solo.

Abre una cuenta en [21st.dev](https://21st.dev) y revisa la documentación oficial en [docs.21st.dev](https://docs.21st.dev/). Para usar el CLI desde terminal necesitas iniciar sesión. La búsqueda del catálogo y las previsualizaciones sirven para explorar; las copias de componentes y las funciones de IA tienen límites de uso según tu cuenta. Revísalos en el panel de uso antes de planificar una migración grande.

Primero confirma que estás parado dentro del repositorio correcto:

```bash
node -v
npm -v
git status
```

Luego inicia sesión y valida la cuenta. Puedes usar el CLI con `npx`, sin instalar nada globalmente:

```bash
npx @21st-dev/cli login
npx @21st-dev/cli whoami
```

Si vas a usarlo de forma repetida, instala el comando global una vez:

```bash
npm install -g @21st-dev/cli
21st whoami
21st usage
```

No guardes una API key en el código ni en un archivo que se suba a Git. Para automatizaciones o CI, 21st admite una key mediante variables de entorno como `API_KEY_21ST` o `TWENTYFIRST_TOKEN`. Para trabajar manualmente en tu computador, el login del CLI es más simple.

## 03 · Cómo encontrar el bloque correcto
**Busca por la función que debe cumplir, no por un adjetivo.**

“Quiero algo moderno” devuelve demasiado ruido. “Necesito una sección de precios con mensual/anual y un CTA para agendar una llamada” ya es una búsqueda útil. En 21st mira la demo, el tamaño del bloque, las dependencias, el tipo de animación y cómo se comporta cuando el texto es largo.

Estas búsquedas son un buen punto de partida:

```bash
21st search "pricing table" --limit 10
21st search "testimonial section" --type c --limit 10
21st search "booking form" --type c --limit 10
21st search "dark landing hero" --type c --limit 10
```

No instales el primero. Quédate con dos o tres candidatos y compara cuatro cosas:

1. **Jerarquía**: ¿el titular y el botón principal siguen siendo lo primero que se ve?
2. **Contenido real**: reemplaza mentalmente el lorem ipsum por tu texto. Si se rompe con un título de dos líneas, no te sirve.
3. **Celular**: un carrusel, una tabla o una animación pesada puede verse bien en escritorio y ser incómodo en un teléfono.
4. **Costo técnico**: revisa si mete librerías de animación, iconos o paquetes que tu proyecto todavía no usa.

Ejemplo realista: una consultora de IA que vende diagnóstico no necesita un hero con siete animaciones. Le conviene un titular que diga para quién es, una frase que explique el resultado, una prueba concreta y un botón “Agendar diagnóstico”. Busca primero `consulting hero`, `testimonial section` y `booking CTA`; después define cuál se integra con la marca.

## 04 · Llevar el componente al proyecto sin ensuciarlo
**Instala, revisa el diff y adapta. No copies a ciegas.**

Cuando ya tengas el identificador del componente, 21st puede añadirlo usando shadcn debajo. El comando habitual es este:

```bash
21st add usuario/nombre-del-componente
```

Si quieres ver el comando que ejecutaría antes de escribir archivos, usa:

```bash
21st add usuario/nombre-del-componente --print
```

También puedes usar el comando de shadcn que entrega cada componente en su página:

```bash
npx shadcn@latest add "https://21st.dev/r/usuario/nombre-del-componente"
```

Después detente un momento. Abre el diff, identifica qué archivos creó y prueba el proyecto localmente. El objetivo no es conservar el componente intacto; el objetivo es que parezca parte de tu página.

Checklist de adaptación:

- Reemplaza colores hardcodeados por las variables o tokens de tu marca.
- Cambia el texto demo por una promesa específica, no por frases genéricas.
- Conecta el CTA a tu formulario, calendario, checkout o WhatsApp real.
- Elimina animaciones que no aporten a la comprensión.
- Revisa `prefers-reduced-motion`, foco de teclado, contraste y etiquetas de formularios.
- Prueba títulos largos, precios en pesos chilenos y pantallas de 360 px de ancho.

```bash
git diff
npm run lint
npm run build
```

Si el componente exige muchas dependencias solo para adornar una sección, probablemente elegiste mal. Busca otro. Ese filtro te ahorra páginas lentas y difíciles de mantener.

## 05 · Usarlo con Codex
**Dale contexto del proyecto y un criterio de aceptación; no le pidas solo “hazlo bonito”.**

21st permite copiar un prompt desde la página de cada componente y pegarlo como tarea en Codex. Esa opción funciona bien si el proyecto ya está abierto en el workspace. Codex puede leer tu estructura, integrar el componente y dejar un diff para revisar.

Antes de aceptar cambios, pídele que inspeccione el proyecto. Este prompt está pensado para implementar una sección nueva sin alterar la arquitectura:

```text
Trabaja en este repositorio. Primero inspecciona el stack, los componentes existentes,
las variables de diseño y la ruta de la página que debo mejorar. No cambies archivos todavía:
propón un plan corto.

Luego integra un componente inspirado en esta referencia de 21st.dev:
[pega aquí la URL o el prompt copiado desde 21st]

Objetivo de negocio: [ej. que más personas agenden un diagnóstico].
La sección debe mantener la marca actual, funcionar desde 360 px, usar los componentes
y tokens ya existentes cuando sea posible, y no agregar dependencias si hay una alternativa
con las librerías del proyecto. Conecta el CTA a [ruta o URL real].

Al terminar: muestra los archivos cambiados, explica las dependencias nuevas si las hay,
ejecuta lint/build o indica exactamente qué no pudiste ejecutar, y deja el cambio listo para revisión.
```

Si trabajarás con 21st de manera continua, el CLI también puede preparar la configuración MCP para Codex. Hazlo en una rama y revisa los archivos que vaya a escribir, porque cambia configuración del entorno de desarrollo:

```bash
21st init --client codex --write
```

El MCP sirve para que el agente busque y recupere componentes desde el flujo de trabajo. No reemplaza la revisión humana: tú sigues decidiendo qué componente entra, qué dependencias aceptas y cuándo se publica.

## 06 · Usarlo con Claude Code
**El prompt de 21st también funciona; Claude Code necesita las mismas restricciones.**

Abre la carpeta del proyecto con Claude Code y pega el prompt que copiaste desde 21st. Agrega las reglas de tu marca, la ubicación donde debe ir la sección y el resultado comercial que buscas. La misma instrucción que usaste con Codex funciona, con un detalle extra: pide que haga cambios pequeños y verificables.

```text
Analiza este proyecto antes de editar. Quiero reemplazar la sección [nombre] por una
versión basada en este componente de 21st.dev:
[pega URL o prompt]

No cambies el layout global ni la navegación. Reutiliza Tailwind, shadcn/ui y los tokens
existentes. La nueva sección debe conservar el copy en español, verse bien en móvil,
tener contraste suficiente y mantener el CTA hacia [destino].

Hazlo en pasos: 1) dime qué archivos tocarás; 2) implementa; 3) ejecuta las verificaciones
disponibles; 4) resume el diff y cualquier riesgo de rendimiento o accesibilidad.
```

Para conectar el CLI con Claude Code mediante MCP, el comando equivalente es:

```bash
21st init --client claude --write
```

Usa API keys solo como variables de entorno. Si el agente no está autenticado, revisa primero `21st whoami` o la configuración MCP, en vez de pegar credenciales dentro del chat o del repositorio.

## 07 · Un flujo que sí mejora la página
**Primero el mensaje, después la interfaz.**

Este flujo sirve para una landing, una página de servicio o un módulo nuevo:

1. **Define la tarea de la página**: una sola acción principal. Ejemplo: agendar llamada, cotizar o comprar.
2. **Mira evidencia**: preguntas frecuentes, grabaciones de ventas, mapas de clics o mensajes que recibes. Ahí aparece el bloque que falta.
3. **Busca tres alternativas en 21st**: no más. Una sobria, una con más prueba social y una más directa.
4. **Elige por claridad**: instala el candidato que resuelva la pregunta del visitante con menos distracción.
5. **Pídele a Codex o Claude Code una implementación acotada**: incluye ruta, CTA, tokens, móvil y pruebas.
6. **Revisa en navegador**: escritorio, teléfono, teclado y un caso con texto largo.
7. **Mide después de publicar**: clics en CTA, inicio de formulario, reservas y conversión. Si no cambia nada, el problema puede ser oferta o copy, no UI.

Para preparar una propuesta antes de tocar código, copia esto en tu agente:

```text
Actúa como diseñador de conversión y desarrollador frontend. Analiza la página [URL o ruta]
para el negocio [descripción]. La acción principal es [acción].

Detecta el mayor obstáculo de claridad o conversión. Propón exactamente tres tipos de bloques
que buscarías en 21st.dev, con la consulta exacta para cada uno. Para cada alternativa explica:
- qué pregunta del visitante responde;
- dónde la pondrías;
- qué copy de ejemplo usarías;
- qué riesgo técnico o de rendimiento revisarías.

No implementes todavía. Recomienda una sola opción y justifica la decisión.
```

## 08 · Reglas clave antes de publicar
**La interfaz tiene que pasar una prueba de negocio, no solo una captura bonita.**

- **No confundas una demo con una solución**. El componente trae estructura, pero tu oferta, precios, casos y CTA tienen que ser tuyos.
- **No metas cinco bloques nuevos en una sola entrega**. Cambia una pieza, mide y aprende. Si cambias todo al mismo tiempo, después no sabes qué movió la conversión.
- **No sacrifiques velocidad por decoración**. Fondos WebGL, videos y animaciones complejas requieren prueba en teléfonos reales y conexiones lentas.
- **No ignores accesibilidad**. Contraste, foco visible, texto legible y botones con etiquetas claras también mejoran la conversión.
- **No pegues secretos en prompts ni repositorios**. Las credenciales de 21st, servicios de pago y APIs van en variables de entorno.
- **No publiques sin revisar el diff**. 21st te entrega código editable. Aprovecha eso para conservar control sobre tu web.

La mejor primera implementación suele ser simple: un hero más claro, una sección de prueba social o un CTA que deje de perder personas. Cuando ese bloque funciona, recién tiene sentido abrir la puerta a una pantalla completa o a una plantilla.

---

### Guías relacionadas
- [Cómo mejorar tu web hecha con IA](/guias/3-herramientas-para-que-tu-web-hecha-con-ia-no-parezca-hecha-con-ia-magic-ui-imp)
- [Documentación oficial de 21st.dev](https://docs.21st.dev/)
- [21st MCP y CLI para agentes](https://docs.21st.dev/mcp)
