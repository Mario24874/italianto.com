-- Nombre del titular que envía el pago (obligatorio en Zelle, donde el
-- receptor identifica la transferencia por el nombre del remitente).
alter table manual_payments add column if not exists payer_name text;
