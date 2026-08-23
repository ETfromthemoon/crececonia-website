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
export type ClassSlide = {
  kicker: string;
  title: string;
  points: string[];
  action: string;
  speaker: string;
  screen: string;
  kind?: "default" | "title" | "prompt" | "workshop" | "checkpoint";
  code?: string;
};
export type ClassBlock = { id: string; time: string; duration: string; title: string; objective: string; slides: ClassSlide[] };

export const CLASS_PRESENTATION: ClassBlock[] = [
  { id: "apertura", time: "18:00", duration: "10 min", title: "Apertura y resultado", objective: "Alinear expectativas y elegir un proyecto realizable durante la clase.", slides: [
    { kind: "title", kicker: "CrececonIA · clase en vivo", title: "De una idea a una web publicada con IA.", points: ["Método completo: decidir, construir, revisar y desplegar."], action: "Al final tendrás una V1 pública y un sistema para seguir iterando.", speaker: "Abre con el resultado, no con herramientas. La clase enseña una metodología repetible, no una demo cerrada.", screen: "Portada de la clase y URL del aula." },
    { kicker: "resultado de salida", title: "Hoy terminamos con cuatro evidencias.", points: ["Una carpeta de proyecto con contexto.", "Una primera visualización funcional.", "Un repositorio con historial en GitHub.", "Una URL de Preview o Producción en Vercel."], action: "Escribe en el chat qué quieres construir y para quién.", speaker: "Aclara que un bloqueo técnico también cuenta como evidencia si queda documentado y con siguiente paso.", screen: "Checklist de salida con cuatro casillas." },
    { kind: "checkpoint", kicker: "elige alcance", title: "Una página útil gana a un sistema incompleto.", points: ["Landing de servicio o campaña.", "Web corporativa simple.", "Portafolio profesional.", "Página de evento o captación."], action: "Deja e-commerce, login y pagos como fase posterior si recién comienzas.", speaker: "Pide a tres asistentes que digan su alcance. Corrige en vivo cualquier proyecto que no quepa en la sesión.", screen: "Matriz alcance simple / complejo." },
  ] },
  { id: "metodo", time: "18:10", duration: "15 min", title: "Prompts y contexto", objective: "Comprender cómo dar instrucciones verificables a un agente de código.", slides: [
    { kicker: "modelo mental", title: "Un prompt útil es una especificación.", points: ["Contexto: dónde estamos.", "Objetivo: qué resultado buscamos.", "Requisitos: qué debe incluir.", "Restricciones: qué no debe cambiar.", "Verificación: cómo sabremos que quedó bien."], action: "Evita comenzar con “hazme una web bonita”.", speaker: "Explica que el agente completa vacíos con promedios. Mientras más importante la decisión, menos conviene dejarla implícita.", screen: "Prompt débil frente a prompt estructurado." },
    { kind: "prompt", kicker: "prompt básico", title: "La fórmula de seis partes.", points: [], code: "CONTEXTO: [negocio, audiencia, estado]\nOBJETIVO: [resultado en una frase]\nESPECIFICACIONES: [lista concreta]\nRESTRICCIONES: [qué no usar/cambiar]\nVERIFICACIÓN: [build, móvil, CTA]\nFORMATO: [plan, archivos, resumen]", action: "Copia esta estructura en tu BRIEF.md.", speaker: "Lee cada línea usando un ejemplo real. La verificación evita que “terminado” signifique sólo “escribí código”.", screen: "Plantilla de prompt en pantalla completa." },
    { kicker: "contexto", title: "El contexto reduce retrabajo.", points: ["Hechos del negocio y público.", "Contenido e imágenes disponibles.", "Decisiones de marca ya cerradas.", "Referencias con el patrón que interesa.", "Comandos y restricciones del proyecto."], action: "Entrega archivos y decisiones; no una conversación interminable.", speaker: "Diferencia contexto útil de ruido. El archivo actual es fuente de verdad, no la memoria de una sesión larga.", screen: "Carpeta con BRIEF, README y REFERENCIAS." },
    { kicker: "control humano", title: "El agente propone; tú decides.", points: ["Pide plan antes de cambios grandes.", "Revisa archivos modificados.", "Aprueba dependencias e integraciones conscientemente.", "Exige una prueba observable.", "Interrumpe cuando se desvía."], action: "Usa una tarea por turno y cierra cada ciclo con evidencia.", speaker: "Normaliza detener al agente. Rapidez sin revisión sólo mueve el costo al final.", screen: "Ciclo contexto → plan → cambio → prueba → decisión." },
    { kind: "workshop", kicker: "ejercicio · 3 minutos", title: "Convierte tu idea en una instrucción clara.", points: ["Resultado que debe lograr.", "Persona que debe entenderla.", "Acción principal que debe realizar.", "Una restricción importante."], action: "Escribe cuatro líneas y compártelas con otra persona.", speaker: "Deja silencio real. Luego corrige dos ejemplos en vivo usando la fórmula.", screen: "Cronómetro 03:00 y cuatro preguntas." },
  ] },
  { id: "setup", time: "18:25", duration: "15 min", title: "Herramienta y carpeta", objective: "Abrir Claude Code o Codex con el mínimo contexto y permisos seguros.", slides: [
    { kicker: "elige una herramienta", title: "Claude Code o Codex: misma metodología.", points: ["Ambos trabajan sobre una carpeta real.", "Pueden leer, editar y ejecutar verificaciones.", "La interfaz cambia; el control del alcance no.", "Usa hoy la herramienta que ya puedas abrir."], action: "No pierdas la clase comparando modelos o planes.", speaker: "Evita afirmar equivalencia exacta de funciones. El método compartido es contexto, permisos, cambios y pruebas.", screen: "Dos columnas: Claude Code / Codex." },
    { kicker: "carpeta correcta", title: "Abre sólo el proyecto que quieres cambiar.", points: ["Crea una carpeta exclusiva.", "Evita Escritorio o Documentos completos.", "Usa un nombre corto y sin ambigüedad.", "Comprueba la ruta antes de aceptar cambios.", "Una web = un repositorio."], action: "Crea y abre: proyectos/mi-sitio.", speaker: "Este es un control de seguridad y contexto. Una carpeta demasiado amplia expone archivos irrelevantes y personales.", screen: "Selector de carpeta y ruta visible." },
    { kind: "prompt", kicker: "primer contacto", title: "Primero pide lectura, no código.", points: [], code: "Lee los archivos de esta carpeta.\nDime qué proyecto entiendes que construiremos,\nqué información falta y qué riesgos ves.\nNo modifiques archivos todavía.", action: "Pega el prompt y compara la respuesta con tu intención.", speaker: "Si la respuesta es genérica, no avances. Mejora el brief antes de pedir implementación.", screen: "Respuesta del agente resumiendo el proyecto." },
    { kicker: "memoria externa", title: "Cinco archivos hacen al proyecto retomable.", points: ["README.md: comandos y estructura.", "BRIEF.md: negocio, público, oferta y CTA.", "DECISIONES.md: acuerdos que no se reabren.", "TAREAS.md: siguiente resultado verificable.", "REFERENCIAS.md: evidencia y patrones."], action: "Descarga la plantilla del aula y completa una línea en cada archivo.", speaker: "Llama a esto sistema de trabajo, no burocracia. Cinco archivos breves son mejores que un documento gigante desactualizado.", screen: "Árbol de archivos base." },
    { kind: "checkpoint", kicker: "seguridad desde el inicio", title: "Nunca pongas secretos en el repositorio.", points: ["Claves y tokens viven en .env.local o en Vercel.", "Datos de clientes no son material de ejemplo.", "Revisa .gitignore antes del primer commit.", "No aceptes comandos destructivos sin entender el objetivo."], action: "Busca .env, tokens, contraseñas y archivos privados antes de continuar.", speaker: "Explica que privado en GitHub reduce exposición, pero no convierte una clave commiteada en segura.", screen: ".gitignore con .env* y pantalla de variables de entorno." },
  ] },
  { id: "estrategia", time: "18:40", duration: "20 min", title: "Proyecto, referencias y stack", objective: "Definir qué construir, cómo debe sentirse y con qué tecnología moderna.", slides: [
    { kicker: "tipo de proyecto", title: "El alcance define la arquitectura.", points: ["Landing: una oferta y una conversión.", "Corporativo: varias páginas y confianza.", "Portafolio: trabajo, proceso y contacto.", "Contenido: publicaciones, categorías y buscador.", "E-commerce: catálogo, pagos, pedidos y políticas."], action: "Elige un tipo principal; no mezcles cinco productos en la V1.", speaker: "Cada tipo cambia contenido, pruebas y riesgos. Una landing puede crecer después; no necesita anticipar todo.", screen: "Mapa de cinco tipos de sitio." },
    { kicker: "decisión de stack", title: "Astro para contenido; Next.js para aplicación.", points: ["Astro: sitio editorial, corporativo o marketing principalmente estático.", "Next.js: formularios avanzados, sesión, paneles, datos y lógica de servidor.", "TypeScript para contratos y errores tempranos.", "CSS/Tailwind según el proyecto, no por moda."], action: "Si dudas y esperas crecer en funciones, usa Next.js; si predomina contenido estático, evalúa Astro.", speaker: "Aclara que ambos pueden hacer más. La recomendación reduce complejidad inicial, no impone un límite absoluto.", screen: "Árbol de decisión Astro / Next.js." },
    { kicker: "evita legado accidental", title: "No empieces con HTML suelto si quieres un proyecto mantenible.", points: ["Usa un scaffold oficial y actual.", "Lee la documentación instalada del framework.", "Conserva TypeScript strict.", "No agregues diez librerías en el primer prompt.", "El build limpio es parte de la definición de terminado."], action: "Pide al agente verificar la versión real, no asumirla.", speaker: "HTML puro sigue siendo válido en proyectos mínimos, pero la clase enseña un flujo escalable con framework moderno.", screen: "package.json, tsconfig y comando de build." },
    { kicker: "referencias", title: "Busca patrones, no sitios para copiar.", points: ["Página de inicio: jerarquía y ritmo.", "Mobbin: patrones de interfaz y flujos.", "Awwwards: dirección visual, con filtro crítico.", "Land-book / Lapa Ninja: landings por industria.", "21st.dev / shadcn/ui: módulos con código revisable."], action: "Guarda 3 referencias y anota qué tomarás de cada una.", speaker: "Advierte sobre licencias, accesibilidad y exceso de animación. Una referencia visual no prueba que un módulo sea usable.", screen: "Ficha: URL → patrón útil → adaptación propia." },
    { kicker: "dirección de arte", title: "Cinco decisiones antes del primer componente.", points: ["Dirección estética concreta.", "Paleta con función semántica.", "Máximo dos familias tipográficas.", "Jerarquía y ritmo entre secciones.", "Dos o tres referencias justificadas."], action: "Reemplaza “moderno y bonito” por decisiones observables.", speaker: "Da ejemplos: editorial, Swiss, industrial, cálido orgánico. Evita el centro estadístico de gradiente y tres cards.", screen: "Tabla vago / concreto." },
    { kind: "workshop", kicker: "ejercicio · 8 minutos", title: "Completa brief + mapa de información.", points: ["Hero: qué es, para quién y CTA.", "Problema o necesidad.", "Oferta o servicios.", "Prueba o proceso.", "FAQ y CTA final."], action: "Marca [pendiente] donde falten datos; no inventes testimonios ni cifras.", speaker: "Deja trabajar. A los 5 minutos, recuerda que el orden de lectura importa más que decorar cada bloque.", screen: "Brief descargable y cronómetro 08:00." },
  ] },
  { id: "construccion", time: "19:00", duration: "30 min", title: "Primera versión", objective: "Generar una V1 funcional, visualizable y verificable.", slides: [
    { kind: "title", kicker: "construcción guiada", title: "Primero estructura. Después estilo. Al final detalle.", points: ["La V1 debe comunicar y funcionar antes de impresionar."], action: "Abre BRIEF.md y REFERENCIAS.md junto al agente.", speaker: "Separa las tres capas para que un fallo visual no oculte que el mensaje o la acción están mal.", screen: "Capas: estructura → sistema visual → detalle." },
    { kind: "prompt", kicker: "prompt completo · parte 1", title: "Contexto, objetivo y alcance.", points: [], code: "Lee README.md, BRIEF.md y REFERENCIAS.md.\nConstruye una [landing/corporativa/portafolio]\npara [audiencia] con objetivo [CTA].\nStack: [Next.js o Astro] + TypeScript.\nPrimero propón arquitectura y archivos; no edites.", action: "Completa los corchetes y pide el plan.", speaker: "El prompt íntegro está en la guía PDF. En slides se divide para poder leerlo y comentarlo.", screen: "Prompt pegado en Claude Code o Codex." },
    { kind: "prompt", kicker: "prompt completo · parte 2", title: "Contenido, diseño y límites.", points: [], code: "Secciones: [lista en orden].\nDirección visual: [estilo, paleta, tipografía].\nUsa mis textos e imágenes; marca [pendiente].\nNo inventes cifras, clientes ni testimonios.\nNo agregues dependencias sin justificar.", action: "Confirma que el plan respeta el brief antes de aprobar.", speaker: "Muestra cómo rechazar una sección inventada o un paquete innecesario antes de que se vuelva código.", screen: "Plan del agente con secciones y archivos." },
    { kind: "prompt", kicker: "prompt completo · parte 3", title: "Responsive, accesibilidad y verificación.", points: [], code: "Prioriza 390px y adapta a escritorio.\nHTML semántico, teclado, contraste y alt.\nCTA y formulario deben tener estados reales.\nEjecuta tests y build. Revisa errores.\nResume archivos, decisiones y pendientes.", action: "Aprueba sólo una primera versión, no diez mejoras simultáneas.", speaker: "Refuerza que build y test no prueban diseño; luego viene revisión visual.", screen: "Checklist de aceptación de V1." },
    { kicker: "primera visualización", title: "Abre pronto. Corrige con evidencia.", points: ["Levanta el entorno de desarrollo.", "Mira 390px antes de escritorio.", "Comprueba que no haya desborde horizontal.", "Haz clic en CTA, navegación y formulario.", "Guarda una captura de la V1."], action: "No esperes a “terminar todo” para mirar el navegador.", speaker: "Una visualización temprana revela jerarquía, texto y layout que el código no muestra.", screen: "Navegador móvil y DevTools responsive." },
    { kind: "workshop", kicker: "trabajo individual · 12 minutos", title: "Construye la V1 de tu sitio.", points: ["Ruta base: hero + oferta + confianza + CTA.", "Ruta avanzada: agrega navegación y una sección secundaria.", "Si falla: copia el error completo.", "Si abre: prueba la acción principal."], action: "Al minuto 8 deberías poder abrir algo, aunque aún sea simple.", speaker: "No hables durante los primeros 6 minutos. Luego agrupa bloqueos por setup, contenido, build o diseño.", screen: "Cronómetro 12:00 y carriles Base / Avanzado." },
    { kind: "checkpoint", kicker: "checkpoint V1", title: "¿Qué debe entenderse en cinco segundos?", points: ["Qué ofreces.", "Para quién es.", "Qué resultado promete.", "Por qué creer.", "Qué hacer ahora."], action: "Si una respuesta no está clara, corrige contenido antes de animaciones.", speaker: "Pide a una persona que revise la página de otra sin explicación. La primera impresión es la prueba.", screen: "Cinco preguntas de lectura rápida." },
  ] },
  { id: "revision", time: "19:30", duration: "10 min", title: "Revisión de V1", objective: "Convertir sensaciones en una lista corta de cambios observables.", slides: [
    { kind: "checkpoint", kicker: "revisión colectiva", title: "No digas “no me gusta”. Nombra el problema.", points: ["Jerarquía: no sé dónde mirar.", "Claridad: no entiendo la oferta.", "Confianza: falta evidencia.", "Conversión: la acción está escondida.", "Móvil: algo se corta o cuesta tocar."], action: "Elige sólo el problema más importante de tu V1.", speaker: "Revisa dos páginas en vivo. Formula cada feedback como observación + impacto.", screen: "Plantilla problema observable → impacto → cambio." },
    { kind: "prompt", kicker: "prompt de iteración", title: "Un cambio con límites claros.", points: [], code: "En la captura, [problema observable].\nAjusta sólo [sección] para lograr [resultado].\nNo cambies [elementos que ya funcionan].\nRevisa 390px y escritorio.\nMuéstrame el plan antes de editar.", action: "Formula tu primera iteración y guárdala en TAREAS.md.", speaker: "Explica que una captura más una medida concreta produce una respuesta más estable que “mejora el diseño”.", screen: "Antes / instrucción / después." },
    { kind: "workshop", kicker: "pausa activa · 4 minutos", title: "Comparte URL, captura o bloqueo.", points: ["Verde: V1 abre y CTA funciona.", "Amarillo: abre, pero falta claridad.", "Rojo: error de instalación o build."], action: "Escribe Verde / Amarillo / Rojo y el siguiente paso.", speaker: "Da prioridad a rojos con un carril de recuperación. Los verdes preparan GitHub.", screen: "Semáforo de estado y cronómetro 04:00." },
  ] },
  { id: "publicacion", time: "19:40", duration: "20 min", title: "GitHub y Vercel", objective: "Guardar la V1 y desplegarla sin exponer secretos ni romper producción.", slides: [
    { kicker: "cuenta GitHub", title: "GitHub guarda el historial del proyecto.", points: ["Crea cuenta y verifica el correo.", "Activa autenticación de dos factores.", "Crea un repositorio por proyecto.", "Elige privado si hay contenido o trabajo de cliente.", "Agrega descripción y README."], action: "Abre github.com/signup o tu dashboard.", speaker: "Aclara que GitHub no es hosting visual por defecto: es el origen versionado que Vercel observará.", screen: "Creación de cuenta y repositorio nuevo." },
    { kind: "prompt", kicker: "primer commit", title: "Guarda una fotografía entendible.", points: [], code: "git status\ngit add .\ngit commit -m \"feat: primera versión de la landing\"\ngit branch -M main\ngit remote add origin [URL]\ngit push -u origin main", action: "Antes de git add, confirma que .env no aparece.", speaker: "Adapta el flujo si la herramienta ofrece botón gráfico. Lo importante es revisar status y no pegar secretos.", screen: "Terminal con git status limpio." },
    { kicker: "ramas", title: "Main estable; cada cambio vive en una rama.", points: ["main: versión lista para producción.", "feature/hero: trabajo aislado.", "Commit: cambio pequeño con intención.", "Pull request: revisión y conversación.", "Merge: decisión de integrar."], action: "Para la V2 crea feature/iteracion-hero.", speaker: "Para trabajo individual, el PR sigue siendo útil: entrega diff, preview y punto de control antes de producción.", screen: "Diagrama rama → PR → main." },
    { kicker: "cuenta Vercel", title: "Vercel convierte commits en deployments.", points: ["Crea cuenta e ingresa con GitHub.", "Autoriza sólo los repositorios necesarios.", "Importa el proyecto correcto.", "Revisa framework, raíz y comando de build.", "Configura variables por entorno si existen."], action: "Importa el repositorio y lanza el primer deploy.", speaker: "No copies .env al código. Si el build falla, abre el log y busca el primer error accionable.", screen: "Vercel: Add New → Project → Import." },
    { kicker: "preview seguro", title: "Cada rama puede tener una URL de prueba.", points: ["Push a rama → Preview Deployment.", "Revisa contenido, móvil y funciones.", "Comparte la URL para aprobación.", "Merge a main → Production Deployment.", "Revertir un commit permite volver a un estado sano."], action: "No uses producción como entorno de ensayo.", speaker: "Conecta el flujo de GitHub con Vercel. Preview no es una maqueta: es el código real en un entorno aislado.", screen: "Local → rama → Preview → PR → main → Producción." },
    { kind: "workshop", kicker: "trabajo individual · 8 minutos", title: "Publica o deja el deploy encaminado.", points: ["Repo creado y primer push.", "Proyecto importado en Vercel.", "Build exitoso o error copiado.", "URL abierta en teléfono o modo móvil."], action: "Pega la URL de Preview; si falla, pega la primera línea útil del log.", speaker: "Ayuda por patrones: permisos GitHub, repo equivocado, build, root directory, variables.", screen: "Cronómetro 08:00 y checklist de deploy." },
  ] },
  { id: "iteracion", time: "20:00", duration: "15 min", title: "Módulos, assets e iteraciones", objective: "Mejorar por partes reutilizables y desplegar V2, V3 y V4 con control.", slides: [
    { kicker: "ciclo de cuatro versiones", title: "Cada versión responde una pregunta distinta.", points: ["V1: ¿se entiende y funciona?", "V2: ¿la jerarquía guía la lectura?", "V3: ¿hay confianza y conversión?", "V4: ¿está lista para tráfico real?"], action: "No mezcles SEO, animación y checkout en el mismo cambio.", speaker: "Asigna un criterio por versión. Esto hace que el feedback sea comparable y reversible.", screen: "Timeline V1 → V2 → V3 → V4." },
    { kicker: "archivos propios", title: "Los assets también necesitan sistema.", points: ["Guarda imágenes en public/images o equivalente.", "Nombres descriptivos y extensiones reales.", "Comprime y dimensiona antes de subir.", "Alt describe función, no decoración.", "No publiques archivos privados por accidente."], action: "Crea un inventario: archivo → sección → propósito → alt.", speaker: "Explica diferencia entre imagen de contenido y decorativa. Evita depender de URLs externas que pueden cambiar.", screen: "Carpeta images y tabla de inventario." },
    { kicker: "módulos externos", title: "Inserta patrones; conserva el criterio.", points: ["shadcn/ui: componentes base accesibles y editables.", "21st.dev: secciones y componentes de comunidad.", "Tailwind UI / Flowbite: catálogos con licencias distintas.", "Motion Primitives: interacción puntual.", "Astro Integrations: capacidades del ecosistema."], action: "Revisa licencia, dependencia, accesibilidad y peso antes de instalar.", speaker: "Nunca pegues un módulo sin leerlo. Adáptalo al sistema visual y elimina lo que no uses.", screen: "Checklist de evaluación de un componente externo." },
    { kind: "prompt", kicker: "prompt para integrar un módulo", title: "Pide adaptación, no injerto.", points: [], code: "Integra [módulo] sólo en [sección].\nAdáptalo a tokens, tipografía y componentes actuales.\nMantén semántica, teclado y reduced motion.\nNo dupliques dependencias existentes.\nEjecuta build y compara antes/después.", action: "Prueba el módulo en una rama y en Preview.", speaker: "Muestra cómo una librería puede introducir estilos globales o JavaScript innecesario.", screen: "Diff de dependencias y Preview aislado." },
    { kind: "workshop", kicker: "iteración · 5 minutos", title: "Haz una mejora que puedas demostrar.", points: ["Una sección.", "Un objetivo medible.", "Una captura antes/después.", "Un commit.", "Una nueva Preview."], action: "Nombra el commit por el resultado, no por “cambios varios”.", speaker: "Si no alcanza el tiempo, formula el prompt y deja la rama creada; eso sigue siendo una siguiente acción clara.", screen: "Cronómetro 05:00 y plantilla de evidencia." },
  ] },
  { id: "calidad", time: "20:15", duration: "10 min", title: "QA, optimización y funciones", objective: "Dejar una lista técnica de salida antes de enviar tráfico o captar datos.", slides: [
    { kicker: "testing", title: "Prueba como usuario y como sistema.", points: ["Build, typecheck y tests automatizados.", "Navegación con teclado.", "Móvil real y varios anchos.", "Enlaces, formularios y estados de error.", "Consola, red y páginas 404."], action: "Todo bug debe incluir pasos, esperado, real y evidencia.", speaker: "Distingue test automático de revisión visual. Ninguno reemplaza al otro.", screen: "Pirámide: build/tests → navegador → persona real." },
    { kicker: "performance", title: "Optimiza lo que el visitante paga.", points: ["Imágenes responsivas y comprimidas.", "Fuentes limitadas y bien cargadas.", "JavaScript sólo donde aporta interacción.", "Evita dependencias grandes por un efecto.", "Mide Lighthouse y Core Web Vitals."], action: "Corrige primero el recurso más pesado o el bloqueo visible.", speaker: "No persigas una puntuación perfecta sin contexto. Busca carga rápida, estabilidad visual y respuesta al toque.", screen: "Lighthouse: Performance, Accessibility, Best Practices, SEO." },
    { kicker: "SEO + GEO + LLM", title: "Haz que personas y máquinas entiendan lo mismo.", points: ["Title, description, canonical y Open Graph.", "Sitemap y URLs descriptivas.", "Contenido visible, específico y actualizado.", "JSON-LD que refleje lo que la página muestra.", "Preguntas y respuestas directas con autoría y fuentes."], action: "Trata GEO/LLM como claridad y evidencia, no como trucos de keywords.", speaker: "Explica que no existe garantía de citación por un LLM. La base útil es contenido accesible, estructurado y confiable.", screen: "Checklist SEO técnico + contenido citable." },
    { kicker: "robots y llms", title: "Controla acceso sin confundir seguridad con crawling.", points: ["robots.txt administra rastreo, no protege secretos.", "noindex controla indexación de una página accesible.", "Sitemap comunica URLs importantes.", "llms.txt puede ser un complemento experimental.", "Nada privado debe depender de la obediencia de un bot."], action: "Protege contenido privado con autenticación real.", speaker: "Desmonta el error común: Disallow no equivale a secreto. Presenta llms.txt como emergente, no estándar garantizado.", screen: "robots.txt, sitemap.xml y llms.txt opcional." },
    { kicker: "formularios y correo", title: "Una función real necesita estados y privacidad.", points: ["Validación en cliente y servidor.", "Anti-spam y límite de frecuencia.", "Mensaje de éxito y error recuperable.", "Resend, Formspree o función serverless para correo.", "Política de privacidad y consentimiento cuando aplica."], action: "Nunca expongas la clave de correo en el navegador.", speaker: "Para un formulario básico, prioriza entrega confiable y registro de errores. Para datos sensibles, revisa requisitos legales específicos.", screen: "Flujo formulario → validación → servidor → email → confirmación." },
  ] },
  { id: "cierre", time: "20:25", duration: "5 min", title: "Siguiente nivel y cierre", objective: "Cerrar con una ruta concreta desde la landing hasta proyectos más complejos.", slides: [
    { kicker: "si quieres e-commerce", title: "Una tienda es un nuevo alcance.", points: ["Catálogo, variantes y búsqueda.", "Carrito y persistencia.", "Pagos y confirmación segura.", "Pedidos, inventario, despacho y devoluciones.", "SEO Product y analítica de conversión."], action: "Para empezar rápido, evalúa Shopify; para control total, Next.js + proveedor de pagos + backend.", speaker: "No recomiendes construir pagos desde cero. El gateway procesa; el servidor verifica webhooks y estados.", screen: "Mapa e-commerce y opciones SaaS / custom." },
    { kind: "prompt", kicker: "prompt de siguiente fase", title: "Planifica antes de convertir la web en tienda.", points: [], code: "Analiza la landing actual y diseña una fase e-commerce.\nCompara Shopify vs solución Next.js para mi caso.\nIncluye catálogo, pagos, pedidos, seguridad y SEO.\nPropón hitos, riesgos y costos.\nNo implementes hasta que apruebe la arquitectura.", action: "Guarda esta fase en ROADMAP.md, separada de la V1.", speaker: "El cierre conecta ambición con secuencia. Primero decisión de plataforma, luego implementación.", screen: "Roadmap: validar → catálogo → checkout → operación." },
    { kind: "title", kicker: "cierre", title: "Publica. Observa. Corrige. Repite.", points: ["La web terminada no existe; existe una versión suficientemente buena para aprender."], action: "Comparte tu URL o tu bloqueo y elige la mejora de mañana.", speaker: "Cierra con el reto de siete días, la guía PDF y el canal de soporte. Pide una evidencia, no una promesa.", screen: "Reto de 7 días + QR/enlace al aula." },
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
