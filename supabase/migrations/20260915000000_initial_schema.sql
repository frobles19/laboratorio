-- =====================================================================
-- Sistema de Trazabilidad de Radioayudas Aeronáuticas
-- Migración inicial: enums, tablas, triggers de negocio y vista de
-- alertas de mantenimiento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type equipment_type as enum ('VOR', 'ILS', 'DME');

create type tx_label as enum ('TX1', 'TX2');

create type operational_status as enum ('en_servicio', 'degradado', 'fuera_servicio');

create type article_physical_status as enum ('en_servicio', 'fuera_servicio', 'baja');

create type location_type as enum ('aeropuerto', 'panol', 'taller');

create type article_kind as enum ('herramienta', 'repuesto');

create type commission_status as enum ('planificada', 'en_curso', 'finalizada', 'cancelada');

create type maintenance_type as enum (
  'preventivo_mensual',
  'preventivo_semestral',
  'preventivo_anual',
  'correctivo',
  'verificacion_aerea'
);

create type ticket_status as enum ('pendiente', 'en_progreso', 'resuelto');

create type status_entity_type as enum ('equipo', 'transmisor');

create type app_role as enum ('admin', 'dev', 'tecnico');

create type tool_return_state as enum ('pendiente', 'devuelta', 'no_devuelta');

-- ---------------------------------------------------------------------
-- TÉCNICOS Y USUARIOS / ROLES
-- ---------------------------------------------------------------------
create table technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dni text not null unique,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Vincula un usuario de auth.users con un rol de aplicación y,
-- opcionalmente, con su ficha de técnico.
create table app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'tecnico',
  technician_id uuid references technicians (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- INFRAESTRUCTURA: AEROPUERTOS / CATÁLOGO / EQUIPOS FÍSICOS / TX
-- ---------------------------------------------------------------------
create table airports (
  iata_code char(3) primary key,
  name text not null,
  region text not null
);

create table model_catalog (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  type equipment_type not null,
  aerial_verification_frequency_months int not null check (aerial_verification_frequency_months > 0),
  created_at timestamptz not null default now(),
  unique (brand, model)
);

-- Instancia física real de un modelo instalado en un aeropuerto.
-- Un ILS y su DME hijo son DOS registros independientes; el vínculo
-- padre/hijo se modela con parent_equipment_id.
create table installed_equipment (
  id uuid primary key default gen_random_uuid(),
  catalog_model_id uuid not null references model_catalog (id),
  airport_iata char(3) not null references airports (iata_code),
  parent_equipment_id uuid references installed_equipment (id),
  -- Estado operativo derivado de sus dos Tx (ver trigger más abajo).
  -- Se cachea acá por performance de listados/dashboards; la fuente
  -- de verdad son los estados de TX1/TX2.
  current_status operational_status not null default 'fuera_servicio',
  installed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_installed_equipment_airport on installed_equipment (airport_iata);
create index idx_installed_equipment_parent on installed_equipment (parent_equipment_id);

-- Todo equipo instalado tiene exactamente dos transmisores (TX1/TX2).
create table transmitters (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references installed_equipment (id) on delete cascade,
  label tx_label not null,
  status operational_status not null default 'fuera_servicio',
  updated_at timestamptz not null default now(),
  unique (equipment_id, label)
);

-- ---------------------------------------------------------------------
-- VEHÍCULOS Y COMISIÓN (tabla base) — se crean acá, antes de
-- status_history, porque status_history referencia commissions.
-- El resto de las tablas de comisión (técnicos, aeropuertos, equipos
-- intervenidos, checklist de herramientas) se definen más abajo, en
-- la sección LOGÍSTICA, una vez que existen articles/tools.
-- ---------------------------------------------------------------------
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  license_plate text not null unique,
  brand_model text,
  created_at timestamptz not null default now()
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  status commission_status not null default 'planificada',
  planned_departure_date date not null,
  planned_arrival_date date not null,
  actual_arrival_date date,
  vehicle_id uuid references vehicles (id),
  created_by uuid not null references app_users (id),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (planned_arrival_date >= planned_departure_date)
);

-- ---------------------------------------------------------------------
-- HISTORIAL DE ESTADOS (equipo o transmisor — exactamente uno de los dos)
-- ---------------------------------------------------------------------
create table status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type status_entity_type not null,
  equipment_id uuid references installed_equipment (id),
  transmitter_id uuid references transmitters (id),
  previous_status operational_status,
  new_status operational_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid not null references app_users (id),
  commission_id uuid references commissions (id),
  manual_edit boolean not null default true,
  reason text,
  check (
    (entity_type = 'equipo' and equipment_id is not null and transmitter_id is null)
    or
    (entity_type = 'transmisor' and transmitter_id is not null and equipment_id is null)
  )
);

create index idx_status_history_equipment on status_history (equipment_id);
create index idx_status_history_transmitter on status_history (transmitter_id);
create index idx_status_history_commission on status_history (commission_id);

-- ---------------------------------------------------------------------
-- INVENTARIO: ARTICULO (superclase) / HERRAMIENTA / REPUESTO
-- ---------------------------------------------------------------------
create table articles (
  asset_number text primary key,
  serial_number text not null,
  kind article_kind not null,
  model_name text not null,
  current_location_type location_type not null,
  current_location_airport char(3) references airports (iata_code),
  physical_status article_physical_status not null default 'en_servicio',
  created_at timestamptz not null default now(),
  check (
    (current_location_type = 'aeropuerto' and current_location_airport is not null)
    or
    (current_location_type <> 'aeropuerto' and current_location_airport is null)
  )
);

create table tools (
  asset_number text primary key references articles (asset_number) on delete cascade,
  tool_type text not null,
  calibration_due_date date not null
);

create table spare_parts (
  asset_number text primary key references articles (asset_number) on delete cascade,
  spare_type text not null,
  catalog_model_id uuid not null references model_catalog (id)
);

-- Un trigger valida que exista la fila hija correspondiente en
-- tools/spare_parts según articles.kind (ver sección de triggers).

-- ---------------------------------------------------------------------
-- LOGÍSTICA: TABLAS HIJAS DE COMISIÓN
-- (vehicles y commissions ya se crearon más arriba, antes de
-- status_history)
-- ---------------------------------------------------------------------
create table commission_technicians (
  commission_id uuid not null references commissions (id) on delete cascade,
  technician_id uuid not null references technicians (id),
  primary key (commission_id, technician_id)
);

create table commission_airports (
  commission_id uuid not null references commissions (id) on delete cascade,
  airport_iata char(3) not null references airports (iata_code),
  primary key (commission_id, airport_iata)
);

-- Equipos efectivamente intervenidos durante la comisión.
create table commission_equipment (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions (id) on delete cascade,
  equipment_id uuid not null references installed_equipment (id),
  intervened boolean not null default false,
  maintenance_type maintenance_type,
  notes text,
  unique (commission_id, equipment_id)
);

-- Checklist de retorno de herramientas al cierre: cada herramienta que
-- salió en la comisión debe marcarse explícitamente devuelta/no
-- devuelta; lo no marcado queda 'pendiente'.
create table commission_tool_checklist (
  commission_id uuid not null references commissions (id) on delete cascade,
  asset_number text not null references tools (asset_number),
  return_state tool_return_state not null default 'pendiente',
  checked_by uuid references app_users (id),
  checked_at timestamptz,
  primary key (commission_id, asset_number)
);

-- ---------------------------------------------------------------------
-- MOVIMIENTOS DE INVENTARIO (trazabilidad de ubicación)
-- ---------------------------------------------------------------------
create table movements (
  id uuid primary key default gen_random_uuid(),
  asset_number text not null references articles (asset_number),
  origin_type location_type not null,
  origin_airport char(3) references airports (iata_code),
  destination_type location_type not null,
  destination_airport char(3) references airports (iata_code),
  moved_at timestamptz not null default now(),
  commission_id uuid references commissions (id),
  moved_by uuid not null references app_users (id),
  notes text
);

create index idx_movements_asset on movements (asset_number);
create index idx_movements_commission on movements (commission_id);

-- Trigger: al insertar un movimiento, actualiza articles.current_location_*
-- (ver sección de triggers).

-- ---------------------------------------------------------------------
-- MANTENIMIENTOS Y TICKETS
-- ---------------------------------------------------------------------
create table maintenances (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references installed_equipment (id),
  type maintenance_type not null,
  performed_at date not null default current_date,
  technician_id uuid not null references technicians (id),
  commission_id uuid references commissions (id),
  next_due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_maintenances_equipment on maintenances (equipment_id);
create index idx_maintenances_next_due on maintenances (next_due_date);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references installed_equipment (id),
  transmitter_id uuid references transmitters (id),
  description text not null,
  status ticket_status not null default 'pendiente',
  created_by uuid not null references app_users (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  commission_id uuid references commissions (id)
);

create index idx_tickets_equipment on tickets (equipment_id);
create index idx_tickets_status on tickets (status);

-- ---------------------------------------------------------------------
-- AUDITORÍA
-- ---------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users (id),
  action text not null,
  entity text not null,
  entity_id text,
  occurred_at timestamptz not null default now(),
  ip_address inet,
  details jsonb
);

-- =====================================================================
-- TRIGGERS Y FUNCIONES DE NEGOCIO
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0a) Jerarquía padre/hijo entre equipos instalados:
--     - DME: siempre debe tener padre, y el padre debe ser ILS o VOR.
--     - ILS / VOR: nunca pueden tener padre.
--     Chequeo inmediato (no diferido): al momento de insertar/actualizar
--     el DME, el padre ya debe existir (FK installed_equipment lo exige).
-- ---------------------------------------------------------------------
create or replace function fn_validate_equipment_parent() returns trigger as $$
declare
  v_own_type equipment_type;
  v_parent_type equipment_type;
begin
  select type into v_own_type from model_catalog where id = new.catalog_model_id;

  if v_own_type = 'DME' then
    if new.parent_equipment_id is null then
      raise exception 'Un DME siempre debe tener un equipo padre (ILS o VOR)';
    end if;
    select type into v_parent_type
    from installed_equipment ie join model_catalog mc on mc.id = ie.catalog_model_id
    where ie.id = new.parent_equipment_id;
    if v_parent_type not in ('ILS', 'VOR') then
      raise exception 'El padre de un DME debe ser ILS o VOR (es %)', v_parent_type;
    end if;
  elsif v_own_type in ('ILS', 'VOR') then
    if new.parent_equipment_id is not null then
      raise exception 'Un equipo % no puede tener equipo padre', v_own_type;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_validate_equipment_parent
  before insert or update of catalog_model_id, parent_equipment_id on installed_equipment
  for each row execute function fn_validate_equipment_parent();

-- ---------------------------------------------------------------------
-- 0b) Cardinalidad de hijos DME:
--     - Un ILS debe tener exactamente un DME hijo.
--     - Un VOR puede tener a lo sumo un DME hijo (es opcional).
--     Chequeo DIFERIDO: al crear un ILS/VOR y su DME en la misma
--     transacción, la validación corre recién al hacer commit, así el
--     orden de los inserts (padre antes o el hijo antes) no importa y
--     el ILS puede terminar con su DME asociado sin violar la regla a
--     mitad de camino. Si se intenta commitear un ILS sin su DME, o un
--     VOR con más de un DME, la transacción falla.
-- ---------------------------------------------------------------------
create or replace function fn_validate_equipment_children() returns trigger as $$
declare
  v_own_type equipment_type;
  v_dme_children_count int;
begin
  select type into v_own_type from model_catalog where id = new.catalog_model_id;

  if v_own_type in ('ILS', 'VOR') then
    select count(*) into v_dme_children_count
    from installed_equipment ie
    join model_catalog mc on mc.id = ie.catalog_model_id
    where ie.parent_equipment_id = new.id and mc.type = 'DME';

    if v_own_type = 'ILS' and v_dme_children_count <> 1 then
      raise exception 'Un ILS debe tener exactamente un DME asociado (tiene %)', v_dme_children_count;
    elsif v_own_type = 'VOR' and v_dme_children_count > 1 then
      raise exception 'Un VOR puede tener a lo sumo un DME asociado (tiene %)', v_dme_children_count;
    end if;
  end if;

  return null;
end;
$$ language plpgsql;

create constraint trigger trg_validate_equipment_children
  after insert or update of catalog_model_id on installed_equipment
  deferrable initially deferred
  for each row execute function fn_validate_equipment_children();

-- ---------------------------------------------------------------------
-- 0c) Todo equipo instalado consta siempre de exactamente 2 Tx:
--     al crear el equipo, se generan automáticamente TX1 y TX2 en
--     estado 'fuera_servicio'. El unique(equipment_id, label) impide
--     agregar un tercero. La app no debe insertar transmisores a mano,
--     solo actualizar su status; borrar un Tx individual (sin borrar el
--     equipo entero) rompe el invariante y queda fuera del alcance de
--     lo que la DB puede impedir sin bloquear también el ON DELETE
--     CASCADE del equipo — se controla por permisos en la capa de app.
-- ---------------------------------------------------------------------
create or replace function fn_create_transmitters_for_equipment() returns trigger as $$
begin
  insert into transmitters (equipment_id, label, status)
  values (new.id, 'TX1', 'fuera_servicio'), (new.id, 'TX2', 'fuera_servicio');
  return null;
end;
$$ language plpgsql;

create trigger trg_create_transmitters
  after insert on installed_equipment
  for each row execute function fn_create_transmitters_for_equipment();

-- ---------------------------------------------------------------------
-- 1) Estado del equipo derivado de sus dos Tx:
--    con al menos un Tx en_servicio -> equipo en_servicio
--    sin ninguno en_servicio pero alguno degradado -> equipo degradado
--    los dos fuera_servicio -> equipo fuera_servicio
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
      current_setting('app.current_user_id', true)::uuid,
      current_setting('app.current_commission_id', true)::uuid,
      false
    );
  end if;

  return null;
end;
$$ language plpgsql;

-- Nota de implementación: la app debe setear las variables de sesión
-- app.current_user_id (obligatoria) y app.current_commission_id
-- (opcional, solo si el cambio ocurre durante el cierre de una
-- comisión) antes de hacer el update de transmitters.status, para que
-- este trigger pueda completar status_history.changed_by/commission_id.
-- A implementar en la capa de backend (paso 2), no bloquea el diseño
-- del esquema.

create trigger trg_transmitter_status_change
  after insert or update of status on transmitters
  for each row execute function fn_recompute_equipment_status();

-- ---------------------------------------------------------------------
-- 2) Movimiento de inventario actualiza la ubicación actual del artículo
-- ---------------------------------------------------------------------
create or replace function fn_apply_movement() returns trigger as $$
begin
  update articles
    set current_location_type = new.destination_type,
        current_location_airport = new.destination_airport
    where asset_number = new.asset_number;
  return new;
end;
$$ language plpgsql;

create trigger trg_movement_apply
  after insert on movements
  for each row execute function fn_apply_movement();

-- ---------------------------------------------------------------------
-- 3) Validar que articles.kind tenga su fila hija correspondiente
-- ---------------------------------------------------------------------
create or replace function fn_validate_article_kind() returns trigger as $$
begin
  if new.kind = 'herramienta' and not exists (
    select 1 from tools where asset_number = new.asset_number
  ) then
    raise exception 'Falta fila en tools para articulo %', new.asset_number;
  elsif new.kind = 'repuesto' and not exists (
    select 1 from spare_parts where asset_number = new.asset_number
  ) then
    raise exception 'Falta fila en spare_parts para articulo %', new.asset_number;
  end if;
  return new;
end;
$$ language plpgsql;

-- Se ejecuta como constraint trigger diferido para permitir el insert
-- del artículo y su fila hija en la misma transacción.
create constraint trigger trg_validate_article_kind
  after insert or update on articles
  deferrable initially deferred
  for each row execute function fn_validate_article_kind();

-- ---------------------------------------------------------------------
-- 4) Próximo vencimiento de mantenimiento (para dashboard de alertas)
--    Calcula next_due_date en base al tipo y la frecuencia del catálogo.
-- ---------------------------------------------------------------------
create or replace function fn_set_maintenance_next_due() returns trigger as $$
declare
  v_months int;
begin
  if new.type = 'verificacion_aerea' then
    select aerial_verification_frequency_months into v_months
    from model_catalog mc
    join installed_equipment ie on ie.catalog_model_id = mc.id
    where ie.id = new.equipment_id;
  elsif new.type = 'preventivo_mensual' then
    v_months := 1;
  elsif new.type = 'preventivo_semestral' then
    v_months := 6;
  elsif new.type = 'preventivo_anual' then
    v_months := 12;
  else
    v_months := null; -- correctivo: no genera vencimiento propio
  end if;

  if v_months is not null then
    new.next_due_date := new.performed_at + (v_months || ' months')::interval;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_maintenance_next_due
  before insert on maintenances
  for each row execute function fn_set_maintenance_next_due();

-- Vista para el dashboard de alertas: último mantenimiento vigente
-- por equipo y tipo, con su vencimiento.
create view v_upcoming_maintenance_due as
select distinct on (m.equipment_id, m.type)
  m.equipment_id,
  ie.airport_iata,
  m.type,
  m.performed_at,
  m.next_due_date,
  (m.next_due_date - current_date) as days_remaining
from maintenances m
join installed_equipment ie on ie.id = m.equipment_id
where m.next_due_date is not null
order by m.equipment_id, m.type, m.performed_at desc;

-- =====================================================================
-- Fin migración inicial.
-- =====================================================================
