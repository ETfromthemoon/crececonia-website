# Privacidad de analítica de navegador

## Política

Las URLs funcionales no se reescriben: Flow, descargas y previews siguen recibiendo sus credenciales. Sólo la copia analítica conserva origen/ruta y `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`. Se eliminan fragmentos, credenciales URL y otros parámetros; valores UTM con direcciones de correo se descartan. Los UTMs deben ser etiquetas de campaña, nunca datos personales.

La barrera compartida impide inicializar/capturar en administración, APIs, enlaces antiguos de coordinación, retornos success, aulas/salas y URLs con parámetros sensibles. Opera también cuando el SDK ya estaba cargado antes de una navegación SPA. El tracker de enlaces sólo informa el canal para mailto/tel, nunca su destinatario.

Los lanzamientos sólo admiten captura cuando el servidor marca el contenido `published` con su ruta exacta. Una vista previa autorizada por cookie no recibe esa marca; tampoco puede reutilizar la marca de otro lanzamiento. La query `key` sigue bloqueando incluso una página publicada. Esto no modifica autorización ni publicación.

## PostHog

`before_send` sanea propiedades anidadas, incluido `$set_once`; descarta eventos en superficies privadas. Se desactivan autocapture, session replay, captura de red/performance y excepciones, además de carga de extensiones externas, porque podrían transmitir DOM o datos por canales fuera del sanitizador. Se conservan eventos explícitos del funnel, pageviews públicos y feature flags de precios.

El SDK instalado envía propiedades iniciales persistidas en `/flags`, fuera de `before_send`. Por eso el callback `loaded`, que el SDK ejecuta antes de cargar configuración remota, retira únicamente cinco caches antiguos de atribución/persona/grupo antes de solicitar flags. No se fija `advanced_disable_flags` al inicializar: en 1.407.7 ese valor original prevalece sobre cambios posteriores y dejaría las flags apagadas permanentemente. El control de privacidad usa `set_config` después del inicio y observa pathname y query; al volver a una URL pública recarga flags. Se conserva el identificador anónimo; no se resetean usuarios ni borran datos del proveedor. Se deshabilita volver a guardar automáticamente referrer/campañas; los eventos propios y la URL saneada conservan los UTM permitidos. Los nombres de esas caches se verificaron en `posthog-js` 1.407.7: revisar ese contrato al actualizarlo.

Fuentes: [referencia SDK PostHog](https://posthog.com/docs/libraries/js/reference), [privacidad de replay](https://posthog.com/docs/session-replay/privacy) y código instalado `posthog-persistence.js` / `posthog-featureflags.js`.

## Contención de Meta

El coordinador autorizó suspender el SDK browser de Meta: `MetaPixel` no genera scripts ni beacon noscript y `trackMetaEvent` conserva la firma pero no llama a un `fbq` existente. No se cargan nuevas instancias, tampoco en páginas públicas. Se pierde la medición browser de Meta hasta diseñar/verificar una integración segura; no se modifican campañas, credenciales, datos históricos ni eventos de servidor. PostHog conserva la medición primaria.

Un documento abierto con JavaScript de un deploy anterior conserva ese código hasta recargarse: desplegar no elimina una instancia remota ya ejecutada en una pestaña antigua. Las verificaciones deben abrir un documento nuevo del Preview correspondiente.

## Verificación

La prueba `analytics-sdk-contract.test.ts` usa PostHog 1.407.7 real con transporte fetch interceptado: demuestra orden de limpieza, recepción de variante, bloqueo y recuperación de flags en transiciones de sólo query. No sustituye una prueba de DOM/navegador.

Pruebas de propiedades anidadas, navegación pública/privada, preservación de UTM y rutas, contactos, orden de limpieza previo a flags, ausencia de emisión Meta incluso con un fbq preexistente y widget administrativo. El Preview debe comprobar además las requests reales de ambos proveedores con credenciales sintéticas; una configuración sin keys sólo demuestra ausencia de carga, no el envío saneado con SDK activo.
