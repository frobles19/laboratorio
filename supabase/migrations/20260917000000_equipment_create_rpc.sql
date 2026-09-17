-- =====================================================================
-- Alta de equipo instalado (ILS o VOR + su DME asociado).
-- =====================================================================
-- El alta de un ILS/VOR y su DME hijo debe ocurrir en una sola
-- transacción: la constraint trigger trg_validate_equipment_children
-- (deferred) recién valida la cardinalidad de hijos DME al hacer
-- commit, así que si la app hiciera dos inserts sueltos desde el
-- cliente (dos requests separados = dos transacciones) el primero
-- fallaría por no tener aún su DME. Esta RPC hace ambos inserts en
-- una única llamada/transacción.

create or replace function rpc_create_equipment(
  p_airport_iata char(3),
  p_catalog_model_id uuid,
  p_dme_catalog_model_id uuid,
  p_installed_at date default current_date
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_own_type equipment_type;
  v_dme_type equipment_type;
  v_parent_id uuid;
  v_dme_id uuid;
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para dar de alta equipos';
  end if;

  select type into v_own_type from model_catalog where id = p_catalog_model_id;
  if v_own_type is null then
    raise exception 'El modelo % no existe', p_catalog_model_id;
  elsif v_own_type not in ('ILS', 'VOR') then
    raise exception 'El sistema principal debe ser ILS o VOR (es %)', v_own_type;
  end if;

  select type into v_dme_type from model_catalog where id = p_dme_catalog_model_id;
  if v_dme_type is null then
    raise exception 'El modelo de DME % no existe', p_dme_catalog_model_id;
  elsif v_dme_type <> 'DME' then
    raise exception 'El equipo asociado debe ser un modelo DME (es %)', v_dme_type;
  end if;

  insert into installed_equipment (catalog_model_id, airport_iata, installed_at)
  values (p_catalog_model_id, p_airport_iata, p_installed_at)
  returning id into v_parent_id;

  insert into installed_equipment (catalog_model_id, airport_iata, installed_at, parent_equipment_id)
  values (p_dme_catalog_model_id, p_airport_iata, p_installed_at, v_parent_id)
  returning id into v_dme_id;

  return jsonb_build_object('equipment_id', v_parent_id, 'dme_equipment_id', v_dme_id);
end;
$$;

revoke all on function rpc_create_equipment(char(3), uuid, uuid, date) from public;
grant execute on function rpc_create_equipment(char(3), uuid, uuid, date) to authenticated;
revoke execute on function rpc_create_equipment(char(3), uuid, uuid, date) from anon;
