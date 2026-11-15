# Evidencia tributaria de ventas del marketplace

Modelo operativo solicitado: CrececonIA cobra con su cuenta Flow y se encarga del documento frente al comprador. La implementación **registra** el respaldo de cada orden pagada; no genera boletas, facturas ni notas de crédito.

El operador entra por `/admin/login` con la credencial administrativa existente y abre `/admin/marketplace`. El panel protegido muestra vendedores, compradores de las últimas 100 órdenes, pago, entrega y referencias tributarias. En cada orden pagada sin comprobante aparece el formulario para registrar la boleta emitida manualmente o el voucher correspondiente. La credencial no se almacena en esta documentación.

`GET /api/admin/marketplace/health` comprueba la conexión de Neon, el listado privado de S3 y que estén presentes las cuatro variables requeridas para subir archivos. No devuelve nombres de objetos ni secretos. Para probar escritura real, `POST /api/admin/marketplace/health` exige la cabecera `x-marketplace-health-key` igual a `MARKETPLACE_HEALTH_SECRET` (mínimo 32 caracteres), sube 32 bytes aleatorios, los lee y elimina el objeto. Devuelve solamente `storage_roundtrip` y `cleanup`. Si falla la eliminación, investigar el objeto temporal antes de repetir. Esta prueba no reemplaza la carga real de un PDF de vendedor.

## Regla antes de abrir ventas

Confirmar con contabilidad el modelo de emisión declarado por CrececonIA ante el SII. El [SII indica que el voucher puede valer como boleta para pagos electrónicos](https://www.sii.cl/destacados/operacion_iva/) y que emitir otra boleta depende del modelo escogido. Por eso el operador debe registrar **uno** de estos respaldos por orden:

- `voucher`: referencia del comprobante de pago electrónico que corresponda a la venta.
- `boleta`: folio de la boleta ya emitida por el sistema tributario autorizado de CrececonIA.

Una referencia inventada o un correo de confirmación no sustituye al documento. La emisión y su reconciliación con SII/Flow son procedimientos externos pendientes. Para facturas a empresas y notas de crédito se requiere ampliar el flujo antes de ofrecer esas opciones.

## Migración y operación

Aplicar `20261115_002_marketplace_fiscal_evidence.up.sql` después de las migraciones base del marketplace. La tabla es inmutable, exige un solo documento original por orden y evita reutilizar una referencia. El `down` impide borrar la tabla cuando contiene registros.

`GET /api/admin/marketplace/fiscal` devuelve hasta 100 órdenes pagadas sin evidencia, sin correo del comprador. `POST` exige la sesión administrativa y el Origin exacto, o la credencial de máquina `x-admin-key`. Ejemplo de cuerpo JSON:

```json
{
  "orderId": "11111111-1111-4111-8111-111111111111",
  "documentKind": "voucher",
  "documentReference": "REFERENCIA-DEL-COMPROBANTE",
  "issuedAt": "2026-11-15T18:30:00-03:00"
}
```

El servidor acepta la operación solo si la orden y el pago Flow están confirmados, registra auditoría y responde 201. Un reintento idéntico responde 200; otro documento para la misma orden responde 409 y requiere revisión manual. Nunca se debe modificar el respaldo histórico directamente en SQL.

## Liquidaciones manuales a autores

El panel muestra el saldo por autor calculado desde el libro contable (`seller_payable`), menos las transferencias externas ya registradas. El saldo queda bloqueado si una venta pagada carece de respaldo tributario, si una venta pagada o reembolsada carece de tarifa Flow real y ambos asientos de conciliación, si una orden tiene más de un ítem o si hay disputa o devolución pendiente. Una devolución completa confirmada ajusta el libro contable antes de volver a calcular el saldo; si su tarifa Flow sigue pendiente, también bloquea transferencias de otras ventas del autor.

Cuando Flow no entregue una tarifa real verificable en el callback, o falte su asiento contable, el panel muestra “Conciliar tarifa real de Flow”. El administrador debe consultar el estado de Flow, registrar el importe efectivo en CLP y una referencia y nota de evidencia. El registro es idempotente y agrega el ajuste al libro contable; no debe inventarse una tarifa estimada.

El administrador efectúa primero la transferencia en su banco. Después registra en `/admin/marketplace` el monto CLP, la fecha y la referencia bancaria única. `POST /api/admin/marketplace/settlements` exige sesión administrativa y Origin exacto o credencial de máquina. La función `marketplace_record_manual_settlement` bloquea la fila del vendedor, vuelve a calcular el saldo, rechaza sobrepagos, crea una liquidación `paid` y audita la operación en una transacción. Un reintento idéntico devuelve el mismo registro. Este endpoint **no mueve dinero**. Si el saldo resulta negativo tras una devolución posterior a una transferencia, corresponde recuperar o compensar la diferencia fuera de la aplicación.

El panel también permite documentar una devolución o contracargo completo ya confirmado externamente. Ese registro revoca el acceso al libro y ajusta el saldo del vendedor; el formulario no solicita una devolución a Flow.

## Conciliación pendiente

Antes de activar ventas reales: verificar el contrato de la cuenta Flow, su tarifa efectiva, el modelo IVA/DTE con un contador chileno, el ciclo de devoluciones y notas de crédito, y la liquidación documentada al autor. El [SII exige verificar inicio de actividades y cumplimiento de quienes operan en plataformas](https://www.sii.cl/destacados/ley_cumplimiento_obligaciones_tributarias/incumplimiento_inicio.html). La evidencia de pago no sustituye esa verificación.
