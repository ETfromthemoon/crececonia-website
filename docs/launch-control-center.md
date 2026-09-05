# Manual del centro de lanzamientos

## Acceso

Abre `/admin/lanzamientos?key=TU_ADMIN_SECRET`. La portada muestra cuántos lanzamientos están activos, listos o bloqueados.

## Crear un lanzamiento

Completa nombre, tipo y promesa. Opcionalmente define fecha, precio inicial, aumento por tramo, cupos y ebooks incluidos. Si el lanzamiento es un ebook, el primer libro seleccionado puede funcionar como destino automático del botón; un evento o campaña normalmente debe llevar una URL propia.

Al crear, el sistema genera tres tramos de precio y un checklist obligatorio para:

1. conexión con Zernio;
2. publicaciones;
3. captación y seguimiento por DM;
4. anuncios;
5. automatizaciones;
6. entrega de productos;
7. analítica.

## Regla Zernio

Todo lanzamiento debe sincronizar el perfil de CrececonIA en Zernio. El panel puede crear publicaciones como borradores y configurar el flujo de comentarios/DM. La activación de DM exige una acción explícita y los anuncios permanecen pausados hasta que exista cuenta publicitaria y aprobación.

El panel marca la conexión, un borrador y el flujo de DM al completar correctamente esas operaciones. La persona responsable debe probar y aprobar las demás tareas. Las tareas obligatorias no pueden resolverse con “No aplica” para habilitar la publicación.

## Acciones de Zernio

- **Sincronizar Zernio:** lee perfil y cuentas; no publica.
- **Crear borrador:** guarda el contenido en Zernio para revisión y programación posterior.
- **Crear y activar flujo de DM:** crea una automatización activa para Instagram o Facebook; úsala sólo con textos aprobados.
- **Anuncios:** el panel informa disponibilidad, pero nunca activa campañas ni gasto por sí solo.

## Estados

- **Borrador:** información inicial.
- **Planificación:** trabajo en Zernio y preparación de activos.
- **Listo:** todos los requisitos están aprobados.
- **Publicado:** la página pública queda disponible.
- **Completado:** terminó la operación.
- **Archivado:** queda como historial.

## Precio

Si se indicó un precio, se crean tres tramos. “Avanzar al siguiente tramo” retira el vigente y activa el siguiente de forma atómica. Los tramos son propios de cada lanzamiento y no afectan precios de la tienda ni del workshop existente.

## Alcance de la plantilla pública

`/lanzamientos/[slug]` entrega una página general con promesa, fecha, precio, productos y CTA. El cobro no se conecta por suposición: el CTA debe dirigir al checkout, formulario o página de ebook correspondiente. Esto evita abrir una campaña con un flujo de pago incompleto.
