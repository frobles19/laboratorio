-- =====================================================================
-- Baja de equipo instalado.
-- =====================================================================
-- Igual que el alta, la baja de un ILS/VOR y su DME hijo debe ocurrir
-- en una sola transacción para no violar momentáneamente la regla de
-- que un ILS siempre tiene su DME. Además:
--   - Borrar un DME que es hijo de un ILS directamente no está
--     permitido: hay que borrar el ILS completo (que arrastra su DME).
--   - Borrar un DME hijo de un VOR sí está permitido solo (es opcional).
--   - Si el equipo (o su DME) tiene historial real (mantenimientos,
--     tickets, participación en comisiones), el DELETE falla por la
--     FK restrictiva correspondiente y no se borra nada.

create or replace function rpc_delete_equipment(p_equipment_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_type equipment_type;
  v_parent_id uuid;
  v_parent_type equipment_type;
  v_dme_child_id uuid;
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para eliminar equipos';
  end if;

  select mc.type, ie.parent_equipment_id into v_type, v_parent_id
  from installed_equipment ie
  join model_catalog mc on mc.id = ie.catalog_model_id
  where ie.id = p_equipment_id;

  if v_type is null then
    raise exception 'El equipo % no existe', p_equipment_id;
  end if;

  if v_type = 'DME' and v_parent_id is not null then
    select mc.type into v_parent_type
    from installed_equipment ie join model_catalog mc on mc.id = ie.catalog_model_id
    where ie.id = v_parent_id;

    if v_parent_type = 'ILS' then
      raise exception 'Este DME pertenece a un ILS y no se puede eliminar solo. Eliminá el equipo ILS completo.';
    end if;
  end if;

  if v_type in ('ILS', 'VOR') then
    select id into v_dme_child_id from installed_equipment where parent_equipment_id = p_equipment_id limit 1;
    if v_dme_child_id is not null then
      delete from installed_equipment where id = v_dme_child_id;
    end if;
  end if;

  delete from installed_equipment where id = p_equipment_id;
end;
$$;

revoke all on function rpc_delete_equipment(uuid) from public;
grant execute on function rpc_delete_equipment(uuid) to authenticated;
revoke execute on function rpc_delete_equipment(uuid) from anon;
