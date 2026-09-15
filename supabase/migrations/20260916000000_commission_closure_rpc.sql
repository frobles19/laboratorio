-- =====================================================================
-- Flujo de cierre de comisión: funciones RPC SECURITY DEFINER
-- =====================================================================
-- Estas funciones son el único camino de escritura para un técnico
-- sobre las tablas restringidas (transmitters, movements, maintenances,
-- articles) durante el trabajo de campo. Cada una valida puntualmente
-- la regla de negocio y hace el write por dentro; el técnico nunca
-- necesita permiso de UPDATE/INSERT directo sobre esas tablas.
--
-- Autorización común: admin/dev siempre pueden; un técnico solo si
-- está asignado a la comisión (commission_technicians) y la comisión
-- no está ya finalizada/cancelada (salvo que sea admin/dev, para poder
-- corregir datos históricos).

-- ---------------------------------------------------------------------
-- Fix: usar auth.uid() en vez de una variable de sesión inexistente
-- para completar status_history.changed_by. auth.uid() está disponible
-- en cualquier función/trigger dentro del mismo request, no hace falta
-- que la app la setee a mano.
-- ---------------------------------------------------------------------
create or replace function fn_recompute_equipment_status() returns trigger as $$
declare
  v_equipment_id uuid := coalesce(new.equipment_id, old.equipment_id);
  v_statuses operational_status[];
  v_new_status operational_status;
  v_old_status operational_status;
begin
  select array_agg(status) into v_statuses
  from transmitters
  where equipment_id = v_equipment_id;

  if 'en_servicio' = any(v_statuses) then
    v_new_status := 'en_servicio';
  elsif 'degradado' = any(v_statuses) then
    v_new_status := 'degradado';
  else
    v_new_status := 'fuera_servicio';
  end if;

  select current_status into v_old_status
  from installed_equipment where id = v_equipment_id;

  if v_old_status is distinct from v_new_status then
    update installed_equipment
      set current_status = v_new_status
      where id = v_equipment_id;

    insert into status_history (
      entity_type, equipment_id, previous_status, new_status,
      changed_by, commission_id, manual_edit
    ) values (
      'equipo', v_equipment_id, v_old_status, v_new_status,
      auth.uid(),
      current_setting('app.current_commission_id', true)::uuid,
      false
    );
  end if;

  return null;
end;
$$ language plpgsql set search_path = public;

-- ---------------------------------------------------------------------
-- Nuevo: historial de estados a nivel Transmisor. El diseño original
-- solo dejaba rastro del estado derivado del Equipo; faltaba el
-- historial del Tx individual que pide el punto 3 del enunciado.
-- ---------------------------------------------------------------------
create or replace function fn_record_transmitter_status_history() returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into status_history (
      entity_type, transmitter_id, previous_status, new_status,
      changed_by, commission_id, manual_edit
    ) values (
      'transmisor', new.id, old.status, new.status,
      auth.uid(),
      current_setting('app.current_commission_id', true)::uuid,
      current_setting('app.current_commission_id', true) is null
    );
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_transmitter_status_history
  after update of status on transmitters
  for each row execute function fn_record_transmitter_status_history();

-- ---------------------------------------------------------------------
-- Autorización común para todas las RPC de comisión
-- ---------------------------------------------------------------------
create or replace function private.fn_authorize_commission(p_commission_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status commission_status;
begin
  if not (private.fn_is_admin_or_dev() or private.fn_is_commission_technician(p_commission_id)) then
    raise exception 'No autorizado para operar sobre esta comisión';
  end if;

  select status into v_status from commissions where id = p_commission_id;

  if v_status is null then
    raise exception 'La comisión % no existe', p_commission_id;
  elsif v_status in ('finalizada', 'cancelada') and not private.fn_is_admin_or_dev() then
    raise exception 'La comisión ya está % y no admite más cambios de un técnico', v_status;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Fecha real de llegada
-- ---------------------------------------------------------------------
create or replace function rpc_set_commission_arrival(
  p_commission_id uuid,
  p_actual_arrival_date date
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform private.fn_authorize_commission(p_commission_id);
  update commissions set actual_arrival_date = p_actual_arrival_date
    where id = p_commission_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Tildar equipo intervenido (commission_equipment)
-- ---------------------------------------------------------------------
create or replace function rpc_set_equipment_intervened(
  p_commission_id uuid,
  p_equipment_id uuid,
  p_intervened boolean,
  p_maintenance_type maintenance_type default null,
  p_notes text default null
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

  insert into commission_equipment (commission_id, equipment_id, intervened, maintenance_type, notes)
  values (p_commission_id, p_equipment_id, p_intervened, p_maintenance_type, p_notes)
  on conflict (commission_id, equipment_id)
  do update set intervened = excluded.intervened,
                maintenance_type = excluded.maintenance_type,
                notes = excluded.notes;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Registrar mantenimiento (dispara el cálculo de next_due_date)
-- ---------------------------------------------------------------------
create or replace function rpc_record_maintenance(
  p_commission_id uuid,
  p_equipment_id uuid,
  p_type maintenance_type,
  p_technician_id uuid,
  p_notes text default null
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

  insert into maintenances (equipment_id, type, technician_id, commission_id, notes)
  values (p_equipment_id, p_type, p_technician_id, p_commission_id, p_notes)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Cambiar estado de un Tx durante la comisión (dispara historial de
--    Tx y, en cascada, el recálculo del estado del equipo)
-- ---------------------------------------------------------------------
create or replace function rpc_set_transmitter_status(
  p_commission_id uuid,
  p_transmitter_id uuid,
  p_new_status operational_status
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform private.fn_authorize_commission(p_commission_id);

  if not exists (
    select 1
    from transmitters t
    join installed_equipment ie on ie.id = t.equipment_id
    join commission_airports ca on ca.airport_iata = ie.airport_iata
    where t.id = p_transmitter_id and ca.commission_id = p_commission_id
  ) then
    raise exception 'El transmisor % no pertenece a un equipo de esta comisión', p_transmitter_id;
  end if;

  perform set_config('app.current_commission_id', p_commission_id::text, true);

  update transmitters set status = p_new_status, updated_at = now()
    where id = p_transmitter_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Consumir un repuesto (baja de inventario)
-- ---------------------------------------------------------------------
create or replace function rpc_consume_spare_part(
  p_commission_id uuid,
  p_asset_number text,
  p_notes text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_kind article_kind;
  v_location_type location_type;
  v_location_airport char(3);
begin
  perform private.fn_authorize_commission(p_commission_id);

  select kind, current_location_type, current_location_airport
    into v_kind, v_location_type, v_location_airport
    from articles where asset_number = p_asset_number;

  if v_kind is null then
    raise exception 'Artículo % no existe', p_asset_number;
  elsif v_kind <> 'repuesto' then
    raise exception 'Artículo % no es un repuesto', p_asset_number;
  end if;

  if v_location_type <> 'aeropuerto' or not exists (
    select 1 from commission_airports
    where commission_id = p_commission_id and airport_iata = v_location_airport
  ) then
    raise exception 'El repuesto % no está en un aeropuerto destino de esta comisión', p_asset_number;
  end if;

  update articles set physical_status = 'baja' where asset_number = p_asset_number;

  insert into movements (
    asset_number, origin_type, origin_airport,
    destination_type, destination_airport,
    commission_id, moved_by, notes
  ) values (
    p_asset_number, v_location_type, v_location_airport,
    v_location_type, v_location_airport,
    p_commission_id, auth.uid(), coalesce(p_notes, 'Repuesto consumido durante la comisión')
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Checklist de retorno de herramientas (sí/no explícito por c/u)
-- ---------------------------------------------------------------------
create or replace function rpc_check_tool_return(
  p_commission_id uuid,
  p_asset_number text,
  p_returned boolean,
  p_notes text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_kind article_kind;
  v_origin_type location_type;
  v_origin_airport char(3);
begin
  perform private.fn_authorize_commission(p_commission_id);

  select kind, current_location_type, current_location_airport
    into v_kind, v_origin_type, v_origin_airport
    from articles where asset_number = p_asset_number;

  if v_kind is null then
    raise exception 'Artículo % no existe', p_asset_number;
  elsif v_kind <> 'herramienta' then
    raise exception 'Artículo % no es una herramienta', p_asset_number;
  end if;

  insert into commission_tool_checklist (commission_id, asset_number, return_state, checked_by, checked_at)
  values (
    p_commission_id, p_asset_number,
    case when p_returned then 'devuelta' else 'no_devuelta' end,
    auth.uid(), now()
  )
  on conflict (commission_id, asset_number)
  do update set return_state = excluded.return_state,
                checked_by = excluded.checked_by,
                checked_at = excluded.checked_at;

  if p_returned then
    insert into movements (
      asset_number, origin_type, origin_airport,
      destination_type, destination_airport,
      commission_id, moved_by, notes
    ) values (
      p_asset_number, v_origin_type, v_origin_airport,
      'panol', null,
      p_commission_id, auth.uid(), coalesce(p_notes, 'Reingreso de herramienta al pañol')
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Retorno de materiales (cualquier artículo) al taller/pañol central
-- ---------------------------------------------------------------------
create or replace function rpc_return_article_to_workshop(
  p_commission_id uuid,
  p_asset_number text,
  p_destination_type location_type default 'taller',
  p_notes text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_origin_type location_type;
  v_origin_airport char(3);
begin
  perform private.fn_authorize_commission(p_commission_id);

  if p_destination_type = 'aeropuerto' then
    raise exception 'El retorno debe ir a pañol o taller, no a un aeropuerto';
  end if;

  select current_location_type, current_location_airport
    into v_origin_type, v_origin_airport
    from articles where asset_number = p_asset_number;

  if v_origin_type is null then
    raise exception 'Artículo % no existe', p_asset_number;
  elsif v_origin_type <> 'aeropuerto' or not exists (
    select 1 from commission_airports
    where commission_id = p_commission_id and airport_iata = v_origin_airport
  ) then
    raise exception 'El artículo % no está en un aeropuerto destino de esta comisión', p_asset_number;
  end if;

  insert into movements (
    asset_number, origin_type, origin_airport,
    destination_type, destination_airport,
    commission_id, moved_by, notes
  ) values (
    p_asset_number, v_origin_type, v_origin_airport,
    p_destination_type, null,
    p_commission_id, auth.uid(), p_notes
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 8) Cierre final: no bloquea (permite cerrar con advertencia), pero
--    devuelve un resumen de lo que quedó pendiente de conciliar.
-- ---------------------------------------------------------------------
create or replace function rpc_close_commission(p_commission_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pending_tools int;
  v_unintervened_equipment int;
begin
  perform private.fn_authorize_commission(p_commission_id);

  if (select actual_arrival_date from commissions where id = p_commission_id) is null then
    raise exception 'Falta registrar la fecha real de llegada antes de cerrar';
  end if;

  select count(*) into v_pending_tools
    from commission_tool_checklist
    where commission_id = p_commission_id and return_state = 'pendiente';

  select count(*) into v_unintervened_equipment
    from commission_equipment
    where commission_id = p_commission_id and intervened = false;

  update commissions
    set status = 'finalizada', closed_at = now()
    where id = p_commission_id;

  return jsonb_build_object(
    'herramientas_pendientes', v_pending_tools,
    'equipos_sin_intervenir', v_unintervened_equipment
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos: solo usuarios autenticados pueden invocar estas RPC
-- ---------------------------------------------------------------------
revoke execute on function rpc_set_commission_arrival(uuid, date) from public;
revoke execute on function rpc_set_equipment_intervened(uuid, uuid, boolean, maintenance_type, text) from public;
revoke execute on function rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text) from public;
revoke execute on function rpc_set_transmitter_status(uuid, uuid, operational_status) from public;
revoke execute on function rpc_consume_spare_part(uuid, text, text) from public;
revoke execute on function rpc_check_tool_return(uuid, text, boolean, text) from public;
revoke execute on function rpc_return_article_to_workshop(uuid, text, location_type, text) from public;
revoke execute on function rpc_close_commission(uuid) from public;

grant execute on function rpc_set_commission_arrival(uuid, date) to authenticated;
grant execute on function rpc_set_equipment_intervened(uuid, uuid, boolean, maintenance_type, text) to authenticated;
grant execute on function rpc_record_maintenance(uuid, uuid, maintenance_type, uuid, text) to authenticated;
grant execute on function rpc_set_transmitter_status(uuid, uuid, operational_status) to authenticated;
grant execute on function rpc_consume_spare_part(uuid, text, text) to authenticated;
grant execute on function rpc_check_tool_return(uuid, text, boolean, text) to authenticated;
grant execute on function rpc_return_article_to_workshop(uuid, text, location_type, text) to authenticated;
grant execute on function rpc_close_commission(uuid) to authenticated;
