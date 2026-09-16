-- =====================================================================
-- Paso 1 del rediseño post-prototipo:
--  1) movements: varios artículos por movimiento (batch_id) + técnico
--     responsable cuando no hay comisión asociada.
--  2) status_history: soporte para ARTICULO (además de equipo/transmisor).
--  3) Mantenimiento preventivo: frecuencia base por modelo + cascada
--     (cualquier tier realizado, el próximo vencimiento siempre usa la
--     frecuencia base del modelo).
--  4) Verificación aérea: flag con/sin alarmas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) MOVIMIENTOS: batch_id + technician_id
-- ---------------------------------------------------------------------
alter table movements add column batch_id uuid not null default gen_random_uuid();
alter table movements add column technician_id uuid references technicians(id);

alter table movements add constraint movements_commission_or_technician_chk
  check (commission_id is not null or technician_id is not null);

create index idx_movements_batch on movements (batch_id);

-- ---------------------------------------------------------------------
-- 2) STATUS_HISTORY: soporte para ARTICULO
-- ---------------------------------------------------------------------
alter table status_history add column article_id text references articles(asset_number);

alter table status_history drop constraint status_history_check;
alter table status_history add constraint status_history_check check (
  (entity_type = 'equipo' and equipment_id is not null and transmitter_id is null and article_id is null)
  or
  (entity_type = 'transmisor' and transmitter_id is not null and equipment_id is null and article_id is null)
  or
  (entity_type = 'articulo' and article_id is not null and equipment_id is null and transmitter_id is null)
);

-- previous_status/new_status pasan de operational_status a text: un
-- ARTICULO usa valores de article_physical_status (en_servicio,
-- fuera_servicio, baja) que no son compatibles 1:1 con operational_status
-- (que tiene "degradado" y no tiene "baja"). Texto libre + validación
-- en el trigger es más simple que mantener dos enums superpuestos.
alter table status_history alter column previous_status type text using previous_status::text;
alter table status_history alter column new_status type text using new_status::text;

-- Reescribir los dos triggers existentes para castear explícitamente a
-- texto (antes insertaban directo un operational_status).
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
      'equipo', v_equipment_id, v_old_status::text, v_new_status::text,
      auth.uid(),
      current_setting('app.current_commission_id', true)::uuid,
      false
    );
  end if;

  return null;
end;
$$ language plpgsql set search_path = public;

create or replace function fn_record_transmitter_status_history() returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into status_history (
      entity_type, transmitter_id, previous_status, new_status,
      changed_by, commission_id, manual_edit
    ) values (
      'transmisor', new.id, old.status::text, new.status::text,
      auth.uid(),
      current_setting('app.current_commission_id', true)::uuid,
      current_setting('app.current_commission_id', true) is null
    );
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

-- Nuevo: historial de estados para ARTICULO.
create or replace function fn_record_article_status_history() returns trigger as $$
begin
  if old.physical_status is distinct from new.physical_status then
    insert into status_history (
      entity_type, article_id, previous_status, new_status,
      changed_by, commission_id, manual_edit
    ) values (
      'articulo', new.asset_number, old.physical_status::text, new.physical_status::text,
      auth.uid(),
      current_setting('app.current_commission_id', true)::uuid,
      current_setting('app.current_commission_id', true) is null
    );
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_article_status_history
  after update of physical_status on articles
  for each row execute function fn_record_article_status_history();

-- ---------------------------------------------------------------------
-- 3) MANTENIMIENTO PREVENTIVO: frecuencia base + cascada
-- ---------------------------------------------------------------------
alter table model_catalog add column preventive_frequency_months int not null default 6
  check (preventive_frequency_months > 0);

alter table maintenances add column con_alarmas boolean;

create or replace function fn_set_maintenance_next_due() returns trigger as $$
declare
  v_preventive_months int;
  v_aerial_months int;
begin
  select mc.preventive_frequency_months, mc.aerial_verification_frequency_months
    into v_preventive_months, v_aerial_months
    from model_catalog mc
    join installed_equipment ie on ie.catalog_model_id = mc.id
    where ie.id = new.equipment_id;

  if new.type = 'verificacion_aerea' then
    new.next_due_date := new.performed_at + (v_aerial_months || ' months')::interval;
  elsif new.type in ('preventivo_mensual', 'preventivo_trimestral', 'preventivo_semestral', 'preventivo_anual') then
    -- Cascada: sea cual sea el tier realizado, el próximo vencimiento
    -- siempre usa la frecuencia BASE del modelo (no la del tier hecho).
    new.next_due_date := new.performed_at + (v_preventive_months || ' months')::interval;
  else
    new.next_due_date := null; -- correctivo: no genera vencimiento propio
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

-- ---------------------------------------------------------------------
-- 4) RPC: mover varios artículos en un solo evento (batch)
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

revoke execute on function rpc_record_movement_batch(text[], location_type, char(3), uuid, uuid, text) from anon;
grant execute on function rpc_record_movement_batch(text[], location_type, char(3), uuid, uuid, text) to authenticated;
