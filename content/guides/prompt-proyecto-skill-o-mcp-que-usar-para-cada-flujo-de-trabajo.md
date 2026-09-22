> Un prompt, un proyecto, una skill y un conector MCP resuelven problemas distintos; elegir mal te obliga a repetir contexto o entrega a la IA más acceso del necesario.

## Qué vas a aprender

- Distinguir instrucciones, contexto, procedimientos y conexiones externas.
- Elegir entre prompt, instrucciones generales, proyecto, skill y MCP.
- Combinar estas piezas sin duplicar información ni crear contradicciones.
- Diseñar una arquitectura simple para una PYME.
- Saber cuándo un prompt guardado ya quedó corto.
- Aplicar permisos y controles proporcionales al riesgo.

## 01 · El mapa rápido

**Cada herramienta responde una pregunta diferente**

Antes de comparar funciones, usa este mapa:

| Necesidad | Pieza adecuada | Pregunta que responde |
|---|---|---|
| Pedir una tarea puntual | Prompt | ¿Qué quiero ahora? |
| Mantener preferencias globales | Instrucciones generales | ¿Cómo quiero trabajar siempre? |
| Guardar contexto de una iniciativa | Proyecto | ¿Qué debe saber sobre este negocio o cliente? |
| Repetir un método especializado | Skill | ¿Cómo debe ejecutar esta tarea? |
| Leer o actuar en otro sistema | MCP o conector | ¿A qué datos y acciones necesita acceder? |

Anthropic resume la diferencia de forma similar: los proyectos entregan conocimiento de fondo, las skills aportan procedimientos, MCP conecta servicios externos y las instrucciones personalizadas aplican de manera general. Puedes revisar la comparación oficial en [Qué son las skills](https://support.claude.com/es/articles/12512176-que-son-las-habilidades).

Ejemplo: una agencia quiere preparar una propuesta.

- El **prompt** solicita la propuesta para un cliente concreto.
- El **proyecto** contiene servicios, casos aprobados, voz y políticas comerciales.
- La **skill** define cómo analizar requisitos, detectar faltantes y estructurar la propuesta.
- El **MCP** consulta el CRM y guarda el borrador aprobado.

No necesitas las cuatro piezas desde el primer día. Comienza con la mínima que resuelve el problema y agrega otra solo cuando aparezca una limitación observable.

```
DIAGNÓSTICO EN 30 SEGUNDOS

¿Es una tarea única? → Prompt
¿Repito una preferencia en todos los chats? → Instrucciones generales
¿Repito antecedentes dentro de un cliente o iniciativa? → Proyecto
¿Repito pasos, criterios y formato? → Skill
¿Necesito datos vivos o ejecutar acciones externas? → MCP/conector
```

## 02 · Cuándo basta un prompt

**La opción más simple sigue siendo la correcta muchas veces**

Un prompt sirve para una tarea puntual cuando puedes entregar el contexto necesario en ese momento. No requiere configurar nada y es fácil de corregir.

Ejemplo para una cafetería:

```
Convierte estas notas en una publicación de Instagram de máximo 900 caracteres.
Audiencia: personas que trabajan cerca del local.
Objetivo: anunciar que desde mañana abrimos a las 7:30.
Tono: directo, cálido y sin exageraciones.
Incluye dirección y horario exactamente como aparecen en las notas.
Notas: [PEGAR NOTAS]
```

Este prompt no necesita una skill si solo se usará una vez. El problema comienza cuando cada publicación exige volver a pegar voz, dirección, productos, palabras prohibidas y criterios de revisión.

Señales de que el prompt quedó corto:

- Copias más contexto que datos nuevos.
- Mantienes varias versiones llamadas “prompt final ahora sí”.
- El resultado depende de ejemplos y documentos adicionales.
- Debes recordar pasos que no aparecen en la instrucción.
- Distintas personas ejecutan el mismo prompt de maneras incompatibles.

No intentes arreglarlo haciendo el prompt infinito. Separa antecedentes estables, procedimiento y datos del caso.

## 03 · Instrucciones generales y proyectos

**Preferencias globales por un lado, contexto del negocio por otro**

Las instrucciones generales aplican a todas tus conversaciones. Son adecuadas para idioma, forma de explicar, reglas personales o preferencias que de verdad quieres mantener siempre.

```
INSTRUCCIONES GENERALES

- Responde en español neutro.
- Separa hechos verificados de recomendaciones.
- Si falta un dato esencial, pregunta antes de inventarlo.
- Para decisiones con costo o impacto externo, presenta el cambio antes de ejecutarlo.
```

No pongas allí precios, campañas o políticas de un cliente. Esa información contaminaría conversaciones no relacionadas.

Los proyectos son espacios con chats, instrucciones y base de conocimiento propios. Anthropic indica que permiten cargar documentos, texto y código para dar contexto a las conversaciones del proyecto. Actualmente están disponibles para todos los usuarios; las cuentas gratuitas pueden crear hasta cinco. La referencia oficial está en [Qué son los proyectos](https://support.claude.com/en/articles/9517075-what-are-projects).

Ejemplo de proyecto para una consultora:

```
Proyecto: Consultoría Operativa 2026

Conocimiento:
- oferta_vigente.md
- perfil_cliente.md
- voz_marca.md
- casos_aprobados.md
- politicas_comerciales.md

Instrucciones:
- Usa estos documentos como fuente principal.
- Cita el nombre del archivo para precios y condiciones.
- Marca contradicciones y datos vencidos antes de continuar.
```

Un proyecto responde “qué debe saber Claude”. Todavía no define todos los pasos de una tarea concreta. Para eso entra la skill.

## 04 · Cuándo crear una skill

**Cuando el valor está en tu método**

Una skill es una carpeta de instrucciones y archivos auxiliares que se activa cuando una tarea coincide con su descripción. Puede incluir referencias, plantillas y scripts. No necesita código si el procedimiento puede expresarse con claridad.

Usa una skill cuando el proceso tenga:

1. Un disparador reconocible.
2. Entradas obligatorias.
3. Pasos o decisiones repetibles.
4. Criterios para evaluar la salida.
5. Casos que deben detenerse o escalarse.

Ejemplo: “revisar una propuesta” puede exigir comprobar alcance, precios, vigencia, promesas y datos faltantes. Eso merece una skill porque el método debe mantenerse aunque cambie el cliente.

```
ESQUELETO DE SKILL

Se activa cuando: [pedido reconocible]
Entradas: [archivos o datos]
Proceso:
1. [paso]
2. [decisión]
3. [validación]
Salida: [formato]
No hacer: [límites]
Escalar si: [casos de riesgo]
```

Anthropic explica que las skills usan divulgación progresiva: Claude conoce primero nombre y descripción, carga las instrucciones cuando corresponde y consulta recursos adicionales solo si los necesita. Esto ayuda a no llenar cada conversación con procedimientos irrelevantes.

No uses una skill como bodega de documentos cambiantes. El procedimiento puede decir “consulta la lista de precios vigente”, pero esa lista debería vivir en el proyecto o en una fuente externa controlada.

## 05 · Cuándo necesitas MCP

**Cuando saber ya no alcanza y hay que consultar o actuar**

MCP, Model Context Protocol, es un estándar para conectar aplicaciones de IA con herramientas y fuentes de datos. Anthropic lo compara con un puerto común: permite que Claude acceda a sistemas como CRM, bases de datos, repositorios o gestores de tareas. La documentación está en [Model Context Protocol](https://docs.anthropic.com/en/docs/mcp).

Ejemplos razonables:

- Consultar un contacto en el CRM antes de redactar una propuesta.
- Leer tareas abiertas de un proyecto.
- Crear un borrador en un gestor de contenidos.
- Recuperar métricas vigentes desde una base de datos.

MCP no enseña el método. Entrega herramientas. La combinación correcta suele ser:

```
Proyecto = conoce la empresa
Skill = conoce el procedimiento
MCP = accede al sistema
Prompt = entrega el caso actual
```

Ejemplo completo: el usuario pide “prepara el seguimiento de la reunión con Ferretería Norte”. El conector busca la reunión y el contacto; el proyecto aporta oferta y tono; la skill aplica el método de seguimiento; el prompt identifica el cliente y el objetivo de hoy.

No conectes un sistema solo para evitar copiar dos datos. Cada conexión amplía permisos y superficie de riesgo. Anthropic advierte que los conectores MCP remotos pueden acceder y actuar en servicios externos, y recomienda considerar inyección de instrucciones y servidores no confiables. Puedes revisar los detalles en [Conectores personalizados con MCP remoto](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

Checklist antes de conectar:

```
[ ] El caso necesita datos vigentes o acciones reales.
[ ] La cuenta y el entorno están identificados.
[ ] Los permisos son los mínimos posibles.
[ ] Leer y escribir están separados cuando corresponde.
[ ] Una acción externa importante requiere aprobación.
[ ] Existe registro de lo ejecutado.
[ ] Hay una forma de revocar la conexión.
```

## 06 · Arquitecturas prácticas para una PYME

**No construyas más de lo que puedes mantener**

### Nivel 1: trabajo individual

Usa instrucciones generales y prompts bien formados. Ideal para tareas ocasionales y exploración.

### Nivel 2: una marca o cliente recurrente

Crea un proyecto con documentos vigentes y ejemplos. Mantén los prompts cortos porque el contexto estable ya está disponible.

### Nivel 3: procedimiento repetido

Agrega una skill para el flujo que más tiempo consume: revisar propuestas, convertir reuniones en tareas o preparar reportes.

### Nivel 4: operación conectada

Incorpora MCP cuando el procedimiento esté probado y necesites consultar o registrar información en sistemas reales.

Plantilla para diseñar tu combinación:

```
ARQUITECTURA DEL FLUJO

Resultado: [entregable]
Prompt del caso: [datos variables]
Instrucciones generales: [preferencias globales]
Proyecto: [contexto permanente]
Skill: [procedimiento y criterios]
Conector MCP: [datos o acciones externas]
Aprobación humana: [punto exacto]
Registro: [dónde queda evidencia]
```

Ejemplo para una inmobiliaria: un proyecto por marca, una skill para convertir antecedentes en una ficha, un conector de solo lectura al inventario y aprobación humana antes de publicar. No hace falta que Claude pueda borrar propiedades ni modificar precios.

## 07 · Reglas clave

**La claridad vale más que la cantidad de herramientas**

- **Prompt para el caso actual** — no conviertas una solicitud única en infraestructura.
- **Instrucciones solo para reglas globales** — evita mezclar clientes o marcas.
- **Proyecto para contexto estable** — archiva documentos vencidos y define fuente de verdad.
- **Skill para procedimientos** — pasos, criterios, ejemplos y casos borde.
- **MCP para acceso externo** — conecta únicamente los datos y acciones necesarios.
- **Una sola fuente por dato sensible** — precios y políticas no deben duplicarse en cinco lugares.
- **Aprobación según impacto** — publicar, enviar, cobrar o borrar merece más control que redactar un borrador.
- **Prueba las combinaciones** — verifica casos normales, faltantes y contradictorios.

Si repites contexto, crea un proyecto. Si repites decisiones, crea una skill. Si necesitas datos vivos, evalúa MCP. Y si solo quieres resolver algo hoy, un buen prompt sigue siendo suficiente.

---

### Guías relacionadas

- [Cómo crear tu primera skill de Claude a partir de un proceso real](/guias/como-crear-tu-primera-skill-de-claude-a-partir-de-un-proceso-real)
- [Cómo enseñarle tu negocio a Claude para dejar de recibir respuestas genéricas](/guias/como-ensenarle-tu-negocio-a-claude-para-dejar-de-recibir-respuestas-genericas)
