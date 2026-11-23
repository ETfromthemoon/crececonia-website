# Publicar repositorios y skills en CrececonIA

El Centro de Conocimiento es el índice público de recursos de la marca. El
catálogo versionado en `content/public-catalog.json` decide qué aparece en
`/centro`, `/centro/repositorios` y `/centro/skills`. Cada cambio llega al
sitio mediante un PR y el despliegue de Vercel.

## Envío de un recurso

Sergio puede pedirlo en un solo mensaje:

> Publica en CrececonIA: [URL del repositorio o carpeta de la skill].
> Para quién sirve: [una frase, opcional].

Si la fuente no explica el público o el uso, se pide solo ese dato. La
publicación incluye una ficha clara y una vista previa para revisar antes de
fusionar el PR. Estar en un repositorio público no implica aparecer
automáticamente en la web.

## Repositorios

El código permanece en su repositorio de GitHub. La web guarda una ficha en
`repositories` con `slug`, `titulo`, `descripcion`, `categoria`, `tags`
y `url`. El enlace apunta al repositorio original; no se duplica el código.

Antes de agregarlo, comprobar que la URL sea pública, que el README describa
el proyecto y que la ficha no prometa funciones que el repositorio todavía no
entrega. Usar un slug único y etiquetas que lo ubiquen en los temas del Centro.

## Skills

La fuente de las skills descargables vive en
[`crececonia-skills`](https://github.com/ETfromthemoon/crececonia-skills),
una carpeta por skill con `SKILL.md` y sus referencias. La ficha pública sigue en
`skills` dentro del catálogo. Si ofrece descarga directa, su ZIP se agrega
a `public/downloads/skills/` y `archivo_nombre` debe coincidir exactamente.
Generarlo desde la fuente con
`python scripts/package.py <slug> --output-dir <ruta-del-sitio>/public/downloads/skills`.
Actualizar `archivo_size` con el tamaño real y `repositorio_url` con el
enlace a la carpeta fuente; así la ficha ofrece «Ver código fuente».

Antes de publicar, revisar que el paquete incluya todas sus referencias, que
las instrucciones de instalación sean utilizables y que el contenido sea
publicable. Las cinco fichas existentes se conservan; cuatro tienen ZIP y una
se ofrece como lectura.

## Comprobación y entrega

1. Ejecutar `npm test` y `npm run build`.
2. Revisar la ficha y la navegación en el Preview de Vercel del PR.
3. Fusionar a `main` solo cuando Sergio apruebe la vista previa.

Las rutas de guías, enlaces curados y ebooks conservan sus funciones actuales.
