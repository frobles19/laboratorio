-- =====================================================================
-- Fix: Supabase otorga EXECUTE a "anon" por defecto en funciones nuevas
-- del schema public (grant directo al rol, no vía PUBLIC), por lo que
-- "revoke ... from public" de la migración anterior no alcanzaba.
-- Se revoca explícitamente de anon; estas RPC requieren estar logueado.
-- =====================================================================
revoke execute on function rpc_set_commission_arrival(uuid, date) from anon;
revoke execute on function rpc_set_equipment_intervened(uuid, uuid, boolean, maintenance_type, text) from anon;
revoke execute on function rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text) from anon;
revoke execute on function rpc_set_transmitter_status(uuid, uuid, operational_status) from anon;
revoke execute on function rpc_consume_spare_part(uuid, text, text) from anon;
revoke execute on function rpc_check_tool_return(uuid, text, boolean, text) from anon;
revoke execute on function rpc_return_article_to_workshop(uuid, text, location_type, text) from anon;
revoke execute on function rpc_close_commission(uuid) from anon;
