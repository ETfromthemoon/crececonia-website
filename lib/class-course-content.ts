export type ClassLesson = {
  id: string;
  number: string;
  title: string;
  duration: string;
  objective: string;
  steps: string[];
  example: string;
  exercise: string;
  expected: string;
  advanced?: string;
  alert?: string;
};

export const CLASS_LESSONS: ClassLesson[] = [
  {
    id: "agente",
    number: "01",
    title: "Claude Code, Codex y el trabajo con agentes",
    duration: "12 min",
    objective: "Entender qué le pedimos a un agente de código y qué seguimos decidiendo como personas.",
    steps: ["Elige una sola herramienta para hoy: Claude Code o Codex Desktop.", "Trata al agente como un colaborador que lee, propone, modifica y verifica; no como una caja mágica.", "Define el resultado antes de pedir código: público, acción principal, secciones y criterio de éxito.", "Trabaja en ciclos cortos: contexto → plan → cambio pequeño → prueba → revisión visual."],
    example: "En vez de ‘hazme una web bonita’, pide: ‘Construye una landing responsive para una nutricionista en Santiago. Objetivo: reservar evaluación. Usa cinco secciones, tono cercano y una CTA de WhatsApp. Primero propón el plan y los archivos’. ",
    exercise: "Escribe en una frase qué debe lograr tu página y para quién la estás haciendo.",
    expected: "Una definición simple del resultado que guiará cada decisión posterior.",
    advanced: "Pide al agente que mantenga una lista de decisiones y que no cambie dependencias ni arquitectura sin explicarte el costo.",
  },
  {
    id: "harness",
    number: "02",
    title: "El harness: el sistema que hace al agente confiable",
    duration: "10 min",
    objective: "Armar el mínimo entorno para que el agente no tenga que adivinar cómo trabajar.",
    steps: ["Crea una carpeta única para el proyecto.", "Agrega README.md, BRIEF.md, DECISIONES.md, TAREAS.md y REFERENCIAS.md.", "Escribe cómo iniciar, probar y publicar el proyecto.", "Pide que el agente lea esos archivos antes de editar y actualice decisiones al cerrar una tarea."],
    example: "Un harness no es una herramienta extra: es la combinación de archivos, convenciones, comandos y criterios que le da memoria externa al proyecto.",
    exercise: "Crea los cinco archivos base y deja una línea útil en cada uno.",
    expected: "Una carpeta que puede retomar mañana cualquier persona —o agente— sin perder contexto.",
    alert: "No entregues claves, tokens, datos de clientes o archivos .env al agente como parte del contexto.",
  },
  {
    id: "instalacion",
    number: "03",
    title: "Instalación, sesión, skills y permisos",
    duration: "14 min",
    objective: "Dejar la herramienta funcionando y con permisos proporcionales al trabajo.",
    steps: ["Instala Claude Code o Codex Desktop desde su sitio oficial e inicia sesión con tu cuenta.", "Abre la carpeta del proyecto, no una carpeta general con documentos personales.", "Aprueba primero acciones de lectura; revisa antes de aceptar instalación de paquetes, comandos de red o cambios masivos.", "Conecta sólo skills y aplicaciones que resuelvan un problema real: GitHub para código, Vercel para deploy y navegador para revisar referencias."],
    example: "Una skill de diseño ayuda a definir interfaz; GitHub sirve para versionar. Ninguna necesita acceso a tu correo, Drive completo o cuentas bancarias para construir una landing.",
    exercise: "Abre el proyecto y pregunta: ‘Lee README.md y dime qué entiendes que debemos construir. No modifiques archivos todavía’. ",
    expected: "La herramienta responde desde el contexto real del proyecto y tú conservas control de las acciones.",
    alert: "Evita autorizar ejecuciones sin revisión, acceso amplio a carpetas, secretos, producción, facturación o conectores con datos privados si no son indispensables.",
  },
  {
    id: "contexto",
    number: "04",
    title: "Contexto que convierte una idea en una especificación",
    duration: "16 min",
    objective: "Entregar suficiente información sin llenar al agente de ruido.",
    steps: ["Parte por el brief: negocio, audiencia, oferta, CTA, tono y límites.", "Separa hechos de gustos: ‘atiende en Ñuñoa’ no es lo mismo que ‘quiero que se vea premium’. ", "Incluye una lista de secciones y el orden de lectura.", "Guarda decisiones cerradas para evitar que el agente las reabra en cada iteración."],
    example: "Contexto útil: ‘El visitante llega desde Instagram, no conoce la marca y debe agendar. La prueba social va antes del formulario’. Contexto débil: ‘hazlo moderno’. ",
    exercise: "Completa el brief descargable en 10 minutos; marca con [pendiente] lo que aún no sabes.",
    expected: "Un agente puede proponer una primera versión coherente sin inventar información crítica.",
  },
  {
    id: "referencias",
    number: "05",
    title: "Referencias, screenshots y mapa de información",
    duration: "12 min",
    objective: "Usar inspiración como evidencia, no como orden de copiar una web.",
    steps: ["Guarda URL, screenshot o texto de cada referencia en REFERENCIAS.md.", "Anota qué tomarás de cada una: jerarquía, navegación, tipo de prueba social o ritmo visual.", "Dibuja el mapa de información: página → sección → contenido → acción.", "Pide al agente que extraiga patrones, no que replique marca, textos ni imágenes ajenas."],
    example: "Referencia A: hero de dos columnas. Referencia B: tabla de precios simple. Referencia C: navegación móvil. Tu web combina esas decisiones con contenido propio.",
    exercise: "Elige dos referencias y escribe tres decisiones concretas que sí adoptarás.",
    expected: "Un mapa de página que prioriza contenido y conversión antes de entrar al diseño fino.",
  },
  {
    id: "estructura",
    number: "06",
    title: "Crear la primera versión funcional",
    duration: "24 min",
    objective: "Pasar del brief a una página que navega, se entiende y tiene una acción real.",
    steps: ["Pide un plan de archivos y espera la explicación antes de aprobar cambios.", "Construye primero estructura, contenidos y CTA; deja animaciones y detalles para después.", "Usa datos reales o marcadores explícitos como [agregar foto] en vez de inventar testimonios.", "Prueba que cada botón haga algo: WhatsApp, formulario, mailto o enlace de agenda."],
    example: "Prompt: ‘Implementa sólo la estructura de la landing definida en BRIEF.md. Usa contenido real del archivo, diseño móvil primero y deja marcadores donde falte información. Ejecuta el build al terminar’. ",
    exercise: "Genera la primera versión y revisa primero la vista móvil.",
    expected: "Una URL local funcional con hero, propuesta de valor, oferta, prueba y CTA.",
    advanced: "Divide el trabajo en tareas: arquitectura, contenido, UI, accesibilidad y QA. No corras cinco cambios de diseño juntos.",
  },
  {
    id: "github",
    number: "07",
    title: "GitHub: historial, respaldo y control de cambios",
    duration: "12 min",
    objective: "Guardar el proyecto en un repositorio y saber volver atrás cuando algo falla.",
    steps: ["Crea una cuenta en github.com y verifica tu correo.", "Crea un repositorio privado o público según el contenido; para una primera landing sin secretos, cualquiera funciona.", "Inicializa Git, agrega un .gitignore y confirma que .env no aparece en los archivos a subir.", "Haz un primer commit descriptivo: ‘feat: primera landing de [marca]’ y sube la rama main."],
    example: "GitHub no publica la web: guarda versiones. Cada commit es una fotografía a la que puedes volver si una iteración sale mal.",
    exercise: "Sube tu primera versión y abre el repositorio en el navegador.",
    expected: "El código está respaldado y puedes identificar exactamente qué cambió.",
    alert: "Nunca subas .env, tokens de APIs, contraseñas, planillas privadas ni llaves de servicios.",
  },
  {
    id: "vercel",
    number: "08",
    title: "Vercel: publicar desde GitHub",
    duration: "12 min",
    objective: "Conectar el repositorio y obtener una primera URL pública.",
    steps: ["Crea tu cuenta en vercel.com e ingresa con GitHub.", "Importa el repositorio correcto y revisa el framework detectado.", "Agrega variables de entorno sólo si tu proyecto realmente las usa; nunca las pegues en el código.", "Pulsa Deploy, abre la URL y revisa el log si falla."],
    example: "Al hacer push a main, Vercel vuelve a construir y publica. Un error de build no borra la última versión que estaba funcionando.",
    exercise: "Publica y comparte la URL en el chat de la clase para una revisión rápida.",
    expected: "Una primera versión pública conectada al repositorio, lista para iterar.",
  },
  {
    id: "iteracion",
    number: "09",
    title: "Iterar visualmente, probar y desplegar de nuevo",
    duration: "18 min",
    objective: "Corregir con criterio y sin transformar una mejora en diez problemas nuevos.",
    steps: ["Haz una captura de la sección que quieres mejorar y describe el problema observable.", "Pide un cambio por intención: jerarquía, lectura, contraste, espacio o conversión.", "Revisa escritorio y móvil después de cada bloque de cambios.", "Prueba enlaces, formularios, ortografía, carga, contraste y mensajes de error antes de publicar."],
    example: "En vez de ‘mejora el hero’, pide: ‘El CTA queda bajo el pliegue en 390px. Reduce texto, aumenta contraste y mantén 44px mínimos de toque. No cambies las demás secciones’. ",
    exercise: "Haz una iteración sobre el hero usando screenshot + una instrucción medible.",
    expected: "Un cambio visible, verificable y respaldado por commit y nuevo deploy.",
  },
  {
    id: "escalar",
    number: "10",
    title: "De landing a sitio completo",
    duration: "10 min",
    objective: "Planificar el siguiente nivel sin sobreconstruir la primera versión.",
    steps: ["Define qué debe validar la landing antes de sumar páginas.", "Agrega una página por necesidad: servicios, casos, contacto, catálogo o checkout.", "Extrae componentes repetidos: navegación, CTA, testimonios, pie y tarjetas.", "Mantén la misma guía de marca y actualiza el mapa de información antes de crecer."],
    example: "Primero agenda → luego servicios → después casos de éxito. Un e-commerce requiere catálogo, carrito, pagos, inventario y políticas: es otro alcance.",
    exercise: "Escribe las próximas tres páginas en orden de prioridad, no en orden de entusiasmo.",
    expected: "Una ruta de crecimiento con una siguiente tarea concreta y alcance visible.",
  },
  {
    id: "seguridad",
    number: "11",
    title: "Seguridad, verificación y recuperación",
    duration: "10 min",
    objective: "Trabajar rápido sin entregar el control del proyecto.",
    steps: ["Lee el diff antes de aprobar cambios grandes y conserva commits pequeños.", "Revisa dependencias nuevas, permisos, costos y la documentación oficial antes de conectarlos.", "Ante un error, guarda el mensaje completo, vuelve al último commit sano y pide diagnóstico antes de editar.", "Usa una lista de QA antes de cada publicación y deja las decisiones relevantes por escrito."],
    example: "Si la web deja de compilar: no pidas ‘arréglalo como sea’. Pide ‘identifica la causa, propón la reparación mínima y espera aprobación antes de cambiar dependencias’. ",
    exercise: "Ejecuta el checklist de QA del pack antes de dar tu URL por terminada.",
    expected: "Una forma concreta de avanzar y recuperarte sin perder trabajo ni exponer información.",
  },
];
export type ClassSlide = { kicker: string; title: string; points: string[]; action: string; speaker: string; screen: string };
export type ClassBlock = { id: string; time: string; duration: string; title: string; objective: string; slides: ClassSlide[] };

export const CLASS_PRESENTATION: ClassBlock[] = [
  { id: "apertura", time: "18:00", duration: "15 min", title: "Apertura y encuadre", objective: "Bajar ansiedad, definir una meta realista y dejar listo el espacio de trabajo.", slides: [
    { kicker: "18:00 · apertura", title: "Hoy no vienes a mirar una demo.", points: ["Vas a salir con una primera versión publicada.", "No necesitas saber programar; sí necesitas decidir una idea simple.", "El objetivo no es perfección: es una base que puedas iterar."], action: "Abre el aula, descarga el brief y escribe tu objetivo en una frase.", speaker: "Da la bienvenida. Repite que nadie debe copiar cada clic: deben construir su propia versión en paralelo.", screen: "Aula: ruta Antes / Durante / Después y el checklist." },
    { kicker: "acuerdo de trabajo", title: "Cómo vamos a avanzar", points: ["Mira 3–5 minutos.", "Construye 8–12 minutos.", "Comparte el bloqueo, no una captura perfecta.", "Si te atrasas, sigue el carril de recuperación."], action: "Escribe en el chat: nombre + qué página vas a construir.", speaker: "Explica que habrá dos velocidades: ruta base y desafíos avanzados.", screen: "Agenda de bloques y reglas del chat." },
  ] },
  { id: "fundamentos", time: "18:15", duration: "20 min", title: "Agente, harness y contexto", objective: "Entender el método antes de pedir la primera línea de código.", slides: [
    { kicker: "modelo mental", title: "El agente acelera decisiones claras.", points: ["Lee archivos y propone pasos.", "Escribe código y ejecuta verificaciones.", "No conoce tu negocio hasta que se lo explicas.", "Tú apruebas, verificas y priorizas."], action: "Abre Claude Code o Codex en la carpeta del proyecto.", speaker: "Usa un ejemplo de prompt malo y uno con resultado, público y restricción.", screen: "Terminal o Codex Desktop mostrando una carpeta vacía." },
    { kicker: "harness", title: "Tu proyecto necesita memoria externa.", points: ["README: cómo correr el proyecto.", "BRIEF: qué estamos construyendo.", "DECISIONES: qué ya está resuelto.", "TAREAS y REFERENCIAS: qué sigue y con qué evidencia."], action: "Crea los cinco archivos con la plantilla del aula.", speaker: "Muestra los archivos, no una explicación abstracta de arquitectura.", screen: "Explorador de archivos y README/contexto abierto." },
  ] },
  { id: "preparacion", time: "18:35", duration: "20 min", title: "Preparación y referencias", objective: "Traducir una idea en contenido y estructura antes del diseño.", slides: [
    { kicker: "brief", title: "Primero decidimos; después generamos.", points: ["Audiencia y problema.", "Oferta y CTA principal.", "Prueba que respalda la oferta.", "Secciones en orden de lectura."], action: "Completa los campos obligatorios del brief.", speaker: "Muestra cómo marcar datos faltantes sin detener todo el avance.", screen: "Plantilla Brief de página web." },
    { kicker: "referencias", title: "Referenciar no es copiar.", points: ["Guarda URL, screenshot o texto.", "Explica qué patrón te sirve.", "Mantén marca, contenido e imágenes propias.", "Convierte referencias en decisiones."], action: "Anota dos referencias y tres decisiones utilizables.", speaker: "Compara ‘quiero esta web’ con una ficha de patrones de diseño.", screen: "REFERENCIAS.md y un mapa de información simple." },
  ] },
  { id: "construccion", time: "18:55", duration: "35 min", title: "Construcción guiada", objective: "Crear una primera landing funcional con un agente.", slides: [
    { kicker: "demo guiada", title: "Pide un plan antes de pedir cambios.", points: ["Lee BRIEF y README.", "Propón archivos y orden de trabajo.", "Construye móvil primero.", "Ejecuta build y reporta errores."], action: "Pega el prompt de primera versión y espera el plan.", speaker: "Demuestra el flujo completo una vez; luego deja trabajar. No diseñes detalles aún.", screen: "Prompt base y respuesta con plan de archivos." },
    { kicker: "trabajo individual", title: "Tu primera versión debe responder tres cosas.", points: ["Qué ofreces.", "Para quién es.", "Qué debe hacer la persona ahora."], action: "Construye hero, propuesta de valor, prueba y CTA. Levanta la mano si no abre en navegador.", speaker: "Recorre dudas agrupadas: instalación, carpeta, prompt, visual. Da respuestas cortas y reenvía al material.", screen: "Editor + navegador en ancho móvil." },
  ] },
  { id: "pausa", time: "19:30", duration: "8 min", title: "Pausa y punto de control", objective: "Recuperar energía y evitar que los atrasos se acumulen.", slides: [
    { kicker: "checkpoint", title: "No necesitas estar al mismo píxel.", points: ["Base: carpeta + brief + primera pantalla.", "En curso: landing con CTA.", "Avanzado: componentes y ajustes visuales."], action: "Marca tu estado en el chat: Base / En curso / Avanzado.", speaker: "Da el enlace al carril de recuperación y anuncia que la siguiente parte sirve aunque la landing aún esté incompleta.", screen: "Slide de estados y ruta de recuperación." },
  ] },
  { id: "publicacion", time: "19:38", duration: "25 min", title: "GitHub, Vercel y publicación", objective: "Respaldar y publicar la versión construida.", slides: [
    { kicker: "control de cambios", title: "GitHub es tu punto de vuelta.", points: ["Repositorio correcto.", ".gitignore antes de subir.", "Commit pequeño y descriptivo.", "Nunca subir secretos."], action: "Crea el repositorio y realiza el primer push.", speaker: "Muestra el estado de Git y la pestaña de archivos antes del push.", screen: "GitHub: repositorio nuevo + commit." },
    { kicker: "deploy", title: "Vercel publica lo que GitHub recibe.", points: ["Importa el repositorio.", "Revisa framework y log.", "Configura variables sólo si existen.", "Abre URL y prueba en móvil."], action: "Importa, publica y pega tu URL en el chat.", speaker: "Si hay error, lee el primer error real del log. No edites al azar.", screen: "Vercel import project y deployment exitoso." },
  ] },
  { id: "iteracion", time: "20:03", duration: "18 min", title: "Iterar con criterio", objective: "Transformar feedback visual en cambios controlados.", slides: [
    { kicker: "iteración", title: "Una intención por cambio.", points: ["Screenshot + problema observable.", "Cambio acotado.", "Prueba en 390px y escritorio.", "Commit y deploy de nuevo."], action: "Elige una sección y formula una mejora medible.", speaker: "Muestra una iteración visual real y cómo se revisa el diff antes de aprobar.", screen: "Antes/después de un hero y prompt de corrección." },
    { kicker: "qa", title: "Publicar no es sólo ver que carga.", points: ["CTA y enlaces.", "Ortografía y contenido real.", "Legibilidad, contraste y toque.", "Errores de consola y formulario."], action: "Pasa el checklist QA rápido antes del cierre.", speaker: "Refuerza que una URL estable y clara vale más que otra sección decorativa.", screen: "Checklist de QA de publicación." },
  ] },
  { id: "cierre", time: "20:21", duration: "9 min", title: "Cierre y continuidad", objective: "Convertir el impulso de la sesión en una semana de implementación.", slides: [
    { kicker: "salida", title: "Tu siguiente versión se construye con evidencia.", points: ["Publica aunque sea una V1 honesta.", "Anota feedback real.", "Itera una mejora por día.", "Usa el canal de dudas con URL + contexto + captura."], action: "Comparte tu URL o tu bloqueo principal y abre el reto de 7 días.", speaker: "Presenta mentoría/implementación como apoyo para quien necesita velocidad o una solución más compleja, no como requisito para terminar.", screen: "Reto de 7 días y canal de soporte." },
  ] },
];

export const CLASS_FAQS = [
  ["¿Necesito saber programar?", "No. Seguimos una ruta pensada para principiantes. Lo importante es partir con una página de alcance simple y copiar los prompts en orden."],
  ["¿Claude Code y Codex hacen lo mismo?", "Ambos pueden colaborar sobre una carpeta de código. Elige el que ya tengas disponible; la metodología de contexto, revisión y publicación es la misma."],
  ["¿Qué pasa si me atraso?", "Completa primero la ruta Base: carpeta, brief y primera pantalla. El aula mantiene el paso a paso, plantillas y reto de 7 días para terminar después."],
  ["¿Puedo hacer un e-commerce o una app completa hoy?", "Puedes dejar el mapa y la primera interfaz, pero pagos, inventario, login o datos reales requieren un proyecto y una revisión de seguridad aparte."],
  ["¿Dónde recibo los ebooks?", "Llegan mediante el flujo de entrega ya asociado a tu compra. Guarda ese correo: los links son personales y recuperables."],
  ["¿Cómo pido ayuda útil?", "Envía: URL o captura, qué esperabas, qué ocurrió, el paso que ya intentaste y el mensaje de error completo si existe."],
] as const;
