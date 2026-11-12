# Biblioteca personal de ebooks (preparación)

El corte inicial prepara desafíos de acceso por correo, sesiones revocables y límites persistentes. La aplicación permanece cerrada salvo que `EBOOK_LIBRARY_ENABLED=true` y exista `EBOOK_LIBRARY_RATE_SECRET` con al menos 32 bytes. Vercel debe proveer `x-vercel-forwarded-for` para el límite por IP. Los retos, sesiones revocadas/vencidas y ventanas vencidas se limpian oportunistamente al registrar solicitudes. La ausencia de la migración 006 produce un error explícito y nunca se interpreta como biblioteca vacía.

La migración `20261112_006_ebook_library.up.sql` es aditiva y su rollback elimina sus tres tablas y funciones. Debe probarse en una rama Neon aislada y requiere autorización independiente antes de aplicar en producción. No otorgar acceso a roles públicos; el propietario de la base conserva DML.

Los enlaces de acceso propuestos usan tokens aleatorios de 32 bytes almacenados como SHA-256 y vencen en 15 minutos. Las sesiones se guardan como hash y vencen en ocho horas. El límite persistente es por correo (3/hora, 5/día) y dirección de red protegida por HMAC (20/hora). El secreto HMAC es independiente de credenciales de correo/base de datos.

Este cambio no activa campañas ni correos; el único correo futuro sería respuesta transaccional a una solicitud explícita del titular. La autorización de biblioteca debe consultar las compras registradas y nunca exponer correo, Flow token, IDs de orden ni enlaces de Storage al navegador. El estado de reembolsos no está representado por los contratos actuales, por lo que no se promete revocación automática.
