-- Fix: rpc_record_movement_batch quedó con EXECUTE abierto a PUBLIC/anon
-- por el comportamiento default de Postgres/Supabase al crear funciones.
revoke execute on function rpc_record_movement_batch(text[], location_type, char(3), uuid, uuid, text) from anon;
revoke execute on function rpc_record_movement_batch(text[], location_type, char(3), uuid, uuid, text) from public;
