-- =====================================================================
-- Paso 2: fixes de la revisión a fondo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Eliminar las 3 políticas RLS que dejaban un atajo directo a la
--    tabla, evitando por completo las RPC (y sus validaciones).
-- ---------------------------------------------------------------------
drop policy commissions_update_assigned_technician on commissions;
drop policy commission_equipment_write_assigned on commission_equipment;
drop policy commission_tool_checklist_write_assigned on commission_tool_checklist;

-- ---------------------------------------------------------------------
-- 2) maintenances_insert / tickets_insert: verificar identidad del
--    técnico/usuario que inserta, no solo que esté autenticado.
-- ---------------------------------------------------------------------
drop policy maintenances_insert on maintenances;
create policy maintenances_insert on maintenances
  for insert with check (
    private.fn_is_admin_or_dev()
    or (
      exists (
        select 1 from app_users
        where id = auth.uid() and technician_id = maintenances.technician_id
      )
      and (
        maintenances.commission_id is null
        or exists (
          select 1 from commission_technicians ct
          where ct.commission_id = maintenances.commission_id
            and ct.technician_id = maintenances.technician_id
        )
      )
    )
  );

drop policy tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert with check (created_by = auth.uid());

-- ---------------------------------------------------------------------
-- 3) commission_equipment.maintenance_type/notes quedaron duplicados
--    con la tabla maintenances (que ya soporta varias tareas por
--    equipo/comisión). Se eliminan y se simplifica la RPC.
-- ---------------------------------------------------------------------
alter table commission_equipment drop column maintenance_type;
alter table commission_equipment drop column notes;

drop function if exists rpc_set_equipment_intervened(uuid, uuid, boolean, maintenance_type, text);

create function rpc_set_equipment_intervened(
  p_commission_id uuid,
  p_equipment_id uuid,
  p_intervened boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform private.fn_authorize_commission(p_commission_id);

  if not exists (
    select 1 from commission_airports ca
    join installed_equipment ie on ie.airport_iata = ca.airport_iata
    where ca.commission_id = p_commission_id and ie.id = p_equipment_id
  ) then
    raise exception 'El equipo % no pertenece a un aeropuerto destino de esta comisión', p_equipment_id;
  end if;

  insert into commission_equipment (commission_id, equipment_id, intervened)
  values (p_commission_id, p_equipment_id, p_intervened)
  on conflict (commission_id, equipment_id)
  do update set intervened = excluded.intervened;
end;
$$;

revoke execute on function rpc_set_equipment_intervened(uuid, uuid, boolean) from anon, public;
grant execute on function rpc_set_equipment_intervened(uuid, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 4) rpc_record_maintenance: agregar fecha custom y con_alarmas, que
--    el asistente de cierre ya necesita.
-- ---------------------------------------------------------------------
drop function if exists rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text);

create function rpc_record_maintenance(
  p_commission_id uuid,
  p_equipment_id uuid,
  p_type maintenance_type,
  p_technician_id uuid,
  p_notes text default null,
  p_performed_at date default current_date,
  p_con_alarmas boolean default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform private.fn_authorize_commission(p_commission_id);

  if not exists (
    select 1 from commission_technicians
    where commission_id = p_commission_id and technician_id = p_technician_id
  ) then
    raise exception 'El técnico % no está asignado a esta comisión', p_technician_id;
  end if;

  insert into maintenances (equipment_id, type, technician_id, commission_id, notes, performed_at, con_alarmas)
  values (p_equipment_id, p_type, p_technician_id, p_commission_id, p_notes, p_performed_at, p_con_alarmas)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text, date, boolean) from anon, public;
grant execute on function rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text, date, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 5) rpc_record_movement_batch: exigir que el artículo esté en un
--    aeropuerto visitado por la comisión, igual que las RPC hermanas.
-- ---------------------------------------------------------------------
create or replace function rpc_record_movement_batch(
  p_asset_numbers text[],
  p_destination_type location_type,
  p_destination_airport char(3) default null,
  p_commission_id uuid default null,
  p_technician_id uuid default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_batch_id uuid := gen_random_uuid();
  v_asset text;
  v_origin_type location_type;
  v_origin_airport char(3);
begin
  if p_commission_id is null and p_technician_id is null then
    raise exception 'Un movimiento sin comisión debe tener un técnico responsable';
  end if;

  if p_commission_id is not null then
    perform private.fn_authorize_commission(p_commission_id);
  elsif not (
    private.fn_is_admin_or_dev()
    or exists (select 1 from app_users where id = auth.uid() and technician_id = p_technician_id)
  ) then
    raise exception 'No autorizado para crear este movimiento';
  end if;

  if array_length(p_asset_numbers, 1) is null then
    raise exception 'Debe indicar al menos un artículo';
  end if;

  foreach v_asset in array p_asset_numbers loop
    select current_location_type, current_location_airport
      into v_origin_type, v_origin_airport
      from articles where asset_number = v_asset;

    if v_origin_type is null then
      raise exception 'Artículo % no existe', v_asset;
    end if;

    if p_commission_id is not null and not exists (
      select 1 from commission_airports
      where commission_id = p_commission_id and airport_iata = v_origin_airport
    ) then
      raise exception 'El artículo % no está en un aeropuerto destino de esta comisión', v_asset;
    end if;

    insert into movements (
      asset_number, origin_type, origin_airport,
      destination_type, destination_airport,
      commission_id, technician_id, batch_id, moved_by, notes
    ) values (
      v_asset, v_origin_type, v_origin_airport,
      p_destination_type, p_destination_airport,
      p_commission_id, p_technician_id, v_batch_id, auth.uid(), p_notes
    );
  end loop;

  return v_batch_id;
end;
$$;
