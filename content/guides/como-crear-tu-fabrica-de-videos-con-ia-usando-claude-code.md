# Cómo crear tu fábrica de videos con IA usando Claude Code

Arma un sistema con Claude Code, Remotion, ElevenLabs, Kie AI y Apify que genera videos estilo documental de forma automática, con precios verificados y los prompts exactos para instalarlo.
#claude-code#remotion#ia-generativa#automatizacion#video

> Un tutorial de 30 minutos puede convertirse en un sistema que trabaja para ti todos los días. Esto es lo que aprendí armando una fábrica de videos con Claude Code, y cuánto cuesta de verdad.
## Qué vas a aprender
  * Cómo Claude Code puede orquestar varias herramientas de IA para generar un video completo (guion, voz, imágenes, animación y música) a partir de un solo prompt.
  * Qué herramientas necesitas conectar y cuánto cuestan realmente (con precios verificados en la fuente oficial, no solo lo que dice un tutorial).
  * Cuándo usar imágenes generadas con IA y cuándo usar fotos reales, para que tu contenido no se vea genérico ni pierda credibilidad.
  * Los prompts exactos para instalar el sistema, definir tu estilo visual y conectar cada API.
  * Los errores más comunes al montar este tipo de sistemas y cómo evitarlos desde el primer intento.
## 01 · Qué es una fábrica de videos con IA

Un sistema, no un editor

Si haces contenido para redes, probablemente ya viste ese estilo de video documental de cortes rápidos, motion graphics y subrayados que se dibujan solos — se popularizó mucho en canales de curiosidades y datos. Lo que casi nadie te dice es que ese formato se puede automatizar casi por completo.
La idea central es simple: le das a Claude Code un tema, y Claude construye el video completo llamando a otras herramientas especializadas. Tú no editas nada a mano. Escribes un prompt, esperas, y revisas el resultado en tu navegador antes de exportar.

No es magia ni una plataforma cerrada tipo HeyGen. Es un flujo abierto que armas tú mismo, con herramientas que pagas por uso, y que después puedes reutilizar para cualquier nicho — fitness, inmobiliarias, e-commerce, lo que sea.
## 02 · Las piezas del sistema

Claude Code no genera nada: dirige

Esto es lo que más cuesta entender al principio: Claude Code no hace las imágenes ni graba la voz. Es el director. Su trabajo es coordinar cuatro herramientas:
Herramienta  | Para qué sirve
--- | ---
Remotion  | Framework open source y gratuito que convierte código en video. Cada elemento (texto, imagen, transición) es una instrucción reproducible. Trae un "Studio" que corre en tu propia computadora (`localhost`) para previsualizar antes de exportar.
ElevenLabs  | Genera la narración en voz IA, y también puede generar música.
Kie AI  | Genera las ilustraciones. El modelo Nano Banana 2 Lite es el recomendado para este estilo por su bajo costo.
Apify  | Hace scraping de fotos reales de internet — solo para cuando necesitas una persona, marca o evento real que no puedes generar con IA sin que se note.
La lógica es simple: todo lo que puede generarse con IA se genera con IA. Lo único que se saca de internet son imágenes reales de personas o hechos concretos, porque una cara generada de alguien famoso rompe la credibilidad del video apenas alguien la mira dos segundos.
## 03 · Cuánto cuesta realmente

Los tutoriales redondean. Nosotros verificamos.

Antes de meterte a esto vale la pena saber el costo real, porque los números que circulan en videos suelen quedar desactualizados o directamente equivocados. Estos son los precios que confirmamos en la fuente oficial de cada herramienta:
  * Apify (scraping de imágenes reales): desde $1.90 por cada 1.000 imágenes. Un tutorial popular sobre este mismo sistema citaba $2.90 — el precio real hoy es más bajo.
  * ElevenLabs (voz): plan gratuito con 10.000 créditos al mes; Starter a $6/mes (30.000 créditos); Creator a $22/mes (121.000 créditos); planes más altos hasta $990/mes para uso empresarial.
  * Kie AI (imágenes con Nano Banana 2 Lite): funciona por créditos prepagados, sin suscripción obligatoria. El precio exacto de este modelo específico no lo pudimos confirmar en su página oficial al momento de escribir esto — trátalo como una cifra a verificar tú mismo antes de comprometerte con un presupuesto.
En la práctica, para un canal chico esto se mueve en unos pocos dólares al mes. El costo real depende de cuántos videos generes y cuántas imágenes reales necesites por video.
## 04 · Imágenes reales vs. generadas: la regla que evita videos genéricos

No todo se puede — ni se debe — generar con IA

El error más común al automatizar este tipo de contenido es dejar que la IA genere todo, incluyendo caras o eventos que el espectador reconoce. El resultado se ve raro, y a veces directamente falso.
La regla es simple: reserva las imágenes reales (vía Apify) exclusivamente para actores, figuras públicas, logos o eventos noticiosos concretos — cosas que la audiencia reconocería si estuvieran mal. Todo lo demás (fondos, ilustraciones, escenas genéricas) se genera con IA, porque ahí no hay nada que "se note" distinto.

Dile esto a Claude explícitamente al configurar el sistema. Si no lo haces, es probable que termines con imágenes generadas donde deberían ir fotos reales, o viceversa.
## 05 · Cómo usarlo (menos de 30 minutos para tu primer video)

Paso a paso
  1. Abre Claude Code — en la terminal que prefieras (Warp, la app oficial, o la que ya trae tu computadora). Es gratis.
  2. Crea una carpeta de proyecto y abre Claude Code dentro. Pídele: "instala Remotion" — es open source, no cobra por generar videos.
  3. Dale el prompt maestro de estilo, en un solo mensaje extenso. Debe incluir tema, estilo visual (fondo, tipografía, color), ritmo de animación y formato (vertical u horizontal). Por ejemplo:
    `Quiero hacer videos explicativos animados estilo box con Remotion. El video de hoy va a explicar [TEMA]. Arma el proyecto con fondo papel crema, tipografía gruesa tipo Anton, acento naranja. Hazme una escena de prueba con un título grande que entre con rebote y un subrayado tipo marcador que se dibuje solo. Nada de fades, todo con energía. Es para TikTok, entonces tiene que ser vertical.
    `
  4. Crea cuentas y API keys en ElevenLabs, Kie AI y Apify, y pégaselas a Claude Code en un solo mensaje explicando para qué sirve cada una.
  5. Define el estilo de recortes: dile a Claude cuándo usar imágenes reales (Apify) y cuándo generadas (Kie AI), según la regla de la sección anterior. Pídele que escriba el guion y genere todos los recursos.
  6. Revisa el render en Remotion Studio (se abre solo en tu navegador). No revises cada paso intermedio — deja que Claude ejecute y revisa el resultado final.
  7. Pide música y efectos de sonido: Claude puede generarlos con Kie AI o ElevenLabs, y usar la librería de efectos de Remotion para posicionarlos bien en el video.
  8. Itera: si algo no te convence (audio, ritmo, imágenes), díselo directo a Claude sobre el resultado ya generado, en vez de pedir cambios antes de ver nada.
Tip: entre mejor sea el modelo de Claude Code que uses, mejor queda el video — el video es código, y un modelo más capaz toma mejores decisiones de diseño en cada corte.
## 06 · Reglas clave

Lo que debes saber antes de montarlo
  * No fragmentes el prompt de estilo. Defínelo completo en un solo mensaje antes de generar nada; cambiarlo a mitad de camino te obliga a reconfigurar el proyecto.
  * Imágenes reales solo cuando de verdad hace falta. Es la diferencia entre un video creíble y uno que se ve "hecho con IA".
  * No confíes en los precios de memoria. Verifica el costo actual de cada herramienta antes de proyectar un presupuesto — ya vimos que al menos uno de los tutoriales populares tenía el dato mal.
  * Si nunca usaste una terminal, empieza por ahí. Abrir Claude Code es el primer paso, pero también el que más gente subestima si viene de cero.
  * No sobre-revises cada iteración intermedia. Deja que el sistema ejecute y evalúa el resultado terminado — revisar paso a paso solo te hace perder tiempo.
* * *
