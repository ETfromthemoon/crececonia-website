# Estado de salida del marketplace de ebooks

Fecha de auditoría: 13 de noviembre de 2026. Mercado inicial: Chile, CLP, libros de IA, tecnología y negocios con aprobación editorial. Comisión comercial solicitada: 5 % para CrececonIA; costo de pasarela a cargo del vendedor.

## Lo que ya existe en el código

- Alta de vendedor por enlace de correo, perfil y revisión tributaria manual, borradores editables con versiones nuevas y archivos privados en cuarentena.
- Revisión de autor, PDF, portada y libro, con publicación separada de la aprobación.
- Catálogo público con búsqueda, categorías, portadas aprobadas, ficha y recomendaciones de libros aprobados.
- Checkout de prueba con Flow sandbox, confirmación por webhook, asiento de comisión, derecho de descarga, entrega por correo y reintentos de entrega programados.
- Panel del vendedor con ventas pagadas y total bruto; todavía no muestra una liquidación exigible.
- Simulador en CLP y demo visual de comprador, vendedor y administración. La demo usa datos ficticios y no cobra.

## Condiciones para abrir ventas de terceros

| Condición | Estado comprobado | Acción antes de activar |
| --- | --- | --- |
| Esquema Neon | Las migraciones `core`, `seller_auth`, `draft_edits` y `revision_integrity` se ejecutaron sin error en una rama aislada; las tablas no existen en la rama principal conectada | Completar prueba funcional SQL y revisión de respaldo; solicitar aprobación explícita antes de migrar producción |
| Contrato de recaudación y reparto | El código usa la cuenta Flow de CrececonIA; no acredita capacidad de comercio integrador ni reparto 95/5 | Confirmar con Flow si la cuenta admite `merchantId`, alta de comercios asociados, tarifas y liquidación; registrar contrato y probar sandbox de extremo a extremo |
| Tributación y DTE | El 19 % es un escenario, no una regla universal por transacción; el código no emite documentos | Contador tributario chileno debe fijar sujeto de IVA, emisor de boleta/factura/voucher, tratamiento de la comisión y retenciones por tipo de vendedor/comprador |
| Situación tributaria del autor | Hay revisión manual de RUT y perfil, pero no prueba de inicio de actividades ni verificación periódica de cumplimiento | Establecer evidencia verificable al alta y revisión semestral antes de habilitar vendedores, conforme a la instrucción aplicable del SII |
| Comisión y pasarela | El 5 % se calcula sobre precio bruto en el sandbox; no hay tarifa real conciliada ni pago neto al vendedor | Aprobar base de la comisión, IVA de comisión y fórmula de liquidación; conciliar comisión efectiva de Flow y respaldar cada pago al autor |
| Entrega y reversos | Hay cola durable y cron diario con reintentos; falta prueba pública completa, reembolsos y contracargos | Probar pago→callback→descarga→reembolso/contracargo y conciliación; fijar tiempo de recuperación aceptable, pues el cron actual puede tardar hasta un día |
| Archivos de terceros | Límite de 4 MiB por función, revisión manual y sin escaneo antimalware | Definir tamaños admitidos, escaneo, cuotas y eliminación de objetos huérfanos antes de abrir auto publicación |
| Posventa y marketing | Reglas puras y medición parcial; no están conectadas a compradores reales ni preferencias | Biblioteca/recuperación verificadas, consentimiento y baja operativos antes de secuencias promocionales |
| Despliegue de esta rama | Vercel rechazó el último commit por límite de despliegues; el PR #122 quedó anotado | Evitar pushes repetidos mientras dure el límite; usar el preview local temporal y reintentar un único preview de Vercel cuando termine el límite |

## Vista previa temporal sin despliegue

El build local sirve la demo visual en `http://127.0.0.1:3178/ebooks/mercado`, el espacio de autor en `/ebooks/vender` y el panel administrativo de muestra en `/admin/marketplace` en este mismo computador mientras el proceso siga activo. Es un servidor de prueba de acceso local, sin cobros ni publicación; su proceso y logs se guardan en `%TEMP%/crececonia-marketplace-preview-3178.*`. No equivale a un preview público de Vercel.

## Riesgos técnicos que siguen abiertos

- La migración `revision_integrity` agrega un trigger contra cambios del contenido histórico; se verificó su instalación en la rama aislada. Falta ejercitarlo con datos de prueba y revisar permisos de funciones antes de migrar producción.
- La subida por función se limita a 4 MiB y no hay escaneo antimalware, cuotas por vendedor ni limpieza de archivos huérfanos.
- Faltan pruebas de callback Flow real, conciliación de comisión, anulaciones, biblioteca del comprador y preferencias de marketing.

Flow documenta `merchantId` en `payment/create` solo para comercios integradores; esto **no demuestra** que la cuenta actual tenga esa habilitación ni que reparta automáticamente la comisión: [Flow API](https://developers.flow.cl/api), [comercios asociados](https://developers.flow.cl/docs/merchant). El SII indica que el documento tributario depende del modelo de emisión y medio de pago, y exige acreditar inicio de actividades y cumplimiento tributario a plataformas de intermediación: [Operación IVA](https://www.sii.cl/destacados/operacion_iva/), [Circular 38/2025](https://www.sii.cl/noticias/2025/300425noti02srm.htm). El artículo 3° bis requiere analizar quién responde por IVA en cada operación; no extrapolar automáticamente las resoluciones sobre ventas remotas de bienes físicos a ebooks vendidos en Chile: [Circular 39/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu39.pdf).

## Regla de activación

`MARKETPLACE_PUBLIC_ENABLED` abre páginas públicas, pero no habilita pagos. `MARKETPLACE_FLOW_SANDBOX_ENABLED` solo permite pruebas fuera de producción. No cambiar las variables para cobrar en vivo hasta que el contrato Flow, política tributaria, esquema migrado, conciliación, entrega y reversos estén probados y aprobados. El merge a `main` desplegaría automáticamente; mantener el PR como borrador hasta pasar estas condiciones.
