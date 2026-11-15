# Evidencia tributaria de ventas del marketplace

Modelo operativo solicitado: CrececonIA cobra con su cuenta Flow y se encarga del documento frente al comprador. La implementación **registra** el respaldo de cada orden pagada; no genera boletas, facturas ni notas de crédito, y no habilita cobros reales.

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

## Conciliación pendiente

Antes de activar ventas reales: verificar el contrato de la cuenta Flow, su tarifa efectiva, el modelo IVA/DTE con un contador chileno, el ciclo de devoluciones y notas de crédito, y la liquidación documentada al autor. El [SII exige verificar inicio de actividades y cumplimiento de quienes operan en plataformas](https://www.sii.cl/destacados/ley_cumplimiento_obligaciones_tributarias/incumplimiento_inicio.html). La evidencia de pago no sustituye esa verificación.
