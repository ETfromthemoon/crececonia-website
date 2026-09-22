# Como convertir cualquier video en una skill de Claude Code

La skill que toma un video de YouTube/Instagram, lo transcribe, lo investiga y lo convierte en una skill de Claude Code lista para usar, con aprobacion humana antes de crear nada.

#claude-code#skills#automatizacion#meta

> Cada tutorial de YouTube que ves y no vuelves a aplicar es conocimiento que se pierde. Esta skill lo convierte en algo que puedes reutilizar cada vez que lo necesites, sin volver a mirar el video.

## Qué vas a aprender

  * Cómo convertir cualquier video de YouTube o Instagram en una skill de Claude Code lista para usar.
  * Por qué transcribir el video real (y no adivinar su contenido) es la diferencia entre una skill útil y una que inventa cosas.
  * Cómo se enriquece el contenido de un video con investigación web para que la skill resultante no quede desactualizada al día siguiente.
  * Por qué existe un punto de aprobación obligatorio antes de crear cualquier archivo, y qué revisar ahí.
  * Cómo instalar y usar esta skill tú mismo, paso a paso.

## 01 · El problema que resuelve

Ves un tutorial, aprendes algo, y a la semana siguiente no recuerdas ni la mitad

Pasa todo el tiempo: encuentras un video que enseña un método o un flujo de trabajo completo, lo ves con atención, y una semana después necesitas volver a buscarlo porque olvidaste los detalles. O peor: le pides a Claude que "haga lo del video" y termina inventando pasos que nunca vio, porque nunca tuvo acceso al contenido real.

Esta skill —`video-a-skill`— existe para cerrar esa brecha. Toma el link de un video, extrae lo que dice de verdad, lo investiga y lo convierte en una skill de Claude Code que puedes reutilizar cuantas veces quieras, sin depender de tu memoria ni de volver a ver el video.

## 02 · Cómo funciona (las 6 capas)

No es "resumir un video": es un pipeline con verificación

El proceso tiene seis pasos, y cada uno existe para evitar un error específico:

  1. Extraer. Descarga el audio del video (YouTube o Instagram) y lo transcribe con Whisper.   5. Verificación. Te muestra el borrador completo, en lenguaje técnico y en lenguaje simple, con las fuentes usadas. Tú decides: apruebas, pides cambios, o cancelas.
  6. Crear. Solo si aprobaste, se escribe la skill en disco.

## 03 · Por qué la verificación no es opcional

Nada se crea sin que tú lo veas primero

Es tentador automatizar todo de punta a punta y confiar en que salga bien. El problema es que una skill mal construida —con un nombre confuso, una descripción que no dispara cuando debería, o un dato mal investigado— es peor que no tener skill: ocupa espacio, no se activa cuando la necesitas, o peor, te da información desactualizada con total confianza.

Por eso el paso 5 es una barrera dura. La skill te muestra exactamente qué va a crear —el nombre, la descripción completa con las frases que la disparan, qué archivos incluye y de qué fuentes salió cada dato— y espera tu aprobación explícita. Nada se escribe hasta ese momento. Si pides un cambio, vuelve a mostrarte todo el borrador actualizado, no un parche suelto.

## 04 · La investigación web no es un lujo

El video explica el método. La web confirma que sigue siendo verdad.

Un video de treinta minutos no tiene tiempo de explicar por qué funciona algo, ni de actualizar sus propios precios seis meses después de publicado. Por eso la skill investiga siempre, sin excepción: confirma nombres reales de herramientas, precios vigentes en la fuente oficial, y datos que el creador dio por sentado.

En la práctica esto ya nos salvó de un error real: al convertir un tutorial sobre generación de videos con IA, el creador citaba un precio de una herramienta que resultó estar desactualizado. La investigación lo detectó y lo corrigió antes de que llegara a la skill final.

Si la investigación falla —sin conexión, sin resultados— la skill no se detiene: sigue con lo que ya tiene de la transcripción, pero te avisa que el resultado quedó parcialmente sin verificar.

## 05 · Cómo usarla (menos de 10 minutos por video)

Paso a paso

  1. Instala Claude Code si no lo tienes, y coloca esta skill en tu carpeta de skills.
  2. Pega el link de un video de YouTube o Instagram y pídele a Claude algo como "convertí este video en una skill".
  3. Espera la extracción y el análisis. Si el video no da para skill, te lo va a decir ahí mismo — no sigas insistiendo con un video de puro entretenimiento.
  4. Revisa el borrador que te presenta: el nombre, la descripción, los archivos, y qué información investigada se incorporó.
  5. Decide: aprueba para crearla, pide cambios puntuales, o cancela si no era lo que buscabas.
  6. Usa la skill nueva en tu próxima conversación con Claude, igual que cualquier otra.

Tip: si el video mezcla varios temas sin conexión, la skill se queda con el tema dominante — el que ocupa más tiempo y hacia el que apunta el cierre — en vez de intentar cubrir todo a medias.

## 06 · Reglas clave

Lo que debes saber antes de usarla

  * No sirve para cualquier video. Si no hay un método o procedimiento replicable, la skill te lo dice y no avanza — es una barrera intencional, no un error.
  * La transcripción siempre es real. Nunca se completa con lo que "probablemente" dice un video según su título o su caption.
  * La aprobación es tuya, no automática. Ni el nombre ni el contenido de la skill quedan fijos hasta que tú los apruebas.
  * Los datos investigados llevan su fuente. Cualquier precio o dato externo que aparece en la skill final tiene un link de donde salió, para que puedas verificarlo tú mismo.
  * Un video corto es materia prima delgada. Por eso existe la capa de enriquecimiento — sin ella, la skill terminaría repitiendo frases del video sin poder responder a un caso que el creador nunca mostró.
