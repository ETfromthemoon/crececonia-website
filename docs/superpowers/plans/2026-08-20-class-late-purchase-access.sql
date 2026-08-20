-- Evita que una compra confirmada después de las 17:00 quede sin el enlace.
-- El webhook envía `session-late` inmediatamente solo entre T-60 min y el fin
-- de la clase, y solo cuando CLASS_SESSION_URL ya está configurada.

alter table commerce.class_delivery_events
  drop constraint if exists class_delivery_events_delivery_kind_check;
alter table commerce.class_delivery_events
  add constraint class_delivery_events_delivery_kind_check
  check (delivery_kind in ('welcome', 'ebooks', 'session-1h', 'session-10m', 'session-late'));
