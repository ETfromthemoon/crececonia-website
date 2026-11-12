# Sesión administrativa

Entrar por `/admin/login` con el mismo `ADMIN_SECRET` configurado en el servidor. No se cambia la clave ni se crean usuarios. La cookie dura ocho horas, está firmada con HMAC separado por dominio de uso, no contiene la clave, es HttpOnly y SameSite=Strict. En producción es Secure y usa prefijo `__Host-` sin Domain.

Cada página administrativa valida la sesión antes de consultar datos. Cada API valida cookie o el encabezado explícito `x-admin-key` de clientes de máquina. Las mutaciones con cookie exigen Origin exacto; la interfaz ya no recibe ni transmite la clave. El logout sólo borra la cookie de ese navegador: no promete revocación global de una sesión copiada. Rotar la clave de servidor invalida todas las firmas, pero este cambio no hace ninguna rotación.

Los enlaces antiguos `/admin/*?key=...` se redirigen a `/admin/login`, descartando la consulta completa antes de renderizar. Se introduce la clave mediante POST. No se convierte un GET en inicio de sesión. Las APIs ya no aceptan claves por query; las herramientas existentes deben usar `x-admin-key`.

Los intentos fallidos se limitan por instancia (20 cada cinco minutos), con cuerpo acotado. Es una defensa adicional, no un límite distribuido: una clave larga, aleatoria y exclusiva sigue siendo necesaria. La protección de borde de Vercel puede complementar este control. No se fuerza una longitud mínima que pueda bloquear el acceso existente.

Las respuestas administrativas usan no-store, no-referrer, noindex y CSP que bloquea conexiones/scripts/imágenes externos. PostHog y Meta no se inicializan al entrar directamente a administración; los eventos de PostHog en esas rutas se descartan y el bloque administrativo se excluye de grabación/autocaptura. No se registran claves ni errores que incluyan formularios de acceso.

La vista previa de lanzamientos acepta la sesión para mantener sus enlaces limpios. El mecanismo heredado de vista previa pública de ebooks (`previewKey`) y el fallback de clave de lanzamientos no se retiran en este corte: requieren revisar sus consumidores de checkout por separado. No confundir esta transición administrativa con una eliminación universal de claves de preview.

## Despliegue y verificación

No requiere migración ni variables nuevas. Mantener `ADMIN_SECRET` existente. Verificar en Vercel Preview: entrada sin sesión redirige, login acepta la clave sin ponerla en URL, navegación administrativa sin query y logout vuelve al formulario. Probar una API mutadora sin sesión y con Origin ajeno sin ejecutar cambios reales. Validar recuperación por login antes de retirar bookmarks antiguos.

Pruebas automáticas cubren firmas, vencimiento, credencial faltante, CSRF, cookies, logout, destinos y guardas en páginas/APIs. Revertir el PR restaura el acceso anterior; las cookies nuevas dejan de usarse, no hay datos que revertir.
