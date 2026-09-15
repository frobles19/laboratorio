-- =====================================================================
-- RLS (baseline provisorio) + hardening de funciones/vista
-- =====================================================================
-- NOTA: los permisos finos de "tecnico" quedaron pendientes de definir
-- en el diseño (ver conversación). Este baseline es intencionalmente
-- amplio en lectura (cualquier usuario autenticado puede leer casi
-- todo, necesario para el trabajo diario en campo) y conservador en
-- escritura (admin/dev, o el técnico asignado a la comisión en
-- cuestión). Los flujos complejos de escritura para técnicos —cerrar
-- una comisión, mover inventario, cambiar estado de un Tx en el
-- terreno— se implementarán como funciones RPC SECURITY DEFINER en el
-- paso de "flujo de cierre de comisión", que validan la regla de
-- negocio puntual y hacen el write por dentro, sin necesitar abrir la
-- tabla entera por RLS. Revisar y ajustar cuando se cierre el modelo
-- de roles definitivo.

-- ---------------------------------------------------------------------
-- Fix: search_path mutable en funciones existentes
-- ---------------------------------------------------------------------
alter function fn_validate_equipment_parent() set search_path = public;
alter function fn_validate_equipment_children() set search_path = public;
alter function fn_create_transmitters_for_equipment() set search_path = public;
alter function fn_recompute_equipment_status() set search_path = public;
alter function fn_apply_movement() set search_path = public;
alter function fn_validate_article_kind() set search_path = public;
alter function fn_set_maintenance_next_due() set search_path = public;

-- ---------------------------------------------------------------------
-- Fix: vista con SECURITY DEFINER implícito -> security_invoker
-- ---------------------------------------------------------------------
drop view if exists v_upcoming_maintenance_due;

create view v_upcoming_maintenance_due
with (security_invoker = true) as
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

-- ---------------------------------------------------------------------
-- Funciones auxiliares para las políticas
-- ---------------------------------------------------------------------
create or replace function fn_is_admin_or_dev() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from app_users where id = auth.uid() and role in ('admin', 'dev')
  );
$$;

create or replace function fn_is_commission_technician(p_commission_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from commission_technicians ct
    join app_users au on au.technician_id = ct.technician_id
    where ct.commission_id = p_commission_id and au.id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ---------------------------------------------------------------------
alter table technicians enable row level security;
alter table app_users enable row level security;
alter table airports enable row level security;
alter table model_catalog enable row level security;
alter table installed_equipment enable row level security;
alter table transmitters enable row level security;
alter table status_history enable row level security;
alter table articles enable row level security;
alter table tools enable row level security;
alter table spare_parts enable row level security;
alter table vehicles enable row level security;
alter table commissions enable row level security;
alter table commission_technicians enable row level security;
alter table commission_airports enable row level security;
alter table commission_equipment enable row level security;
alter table commission_tool_checklist enable row level security;
alter table movements enable row level security;
alter table maintenances enable row level security;
alter table tickets enable row level security;
alter table audit_log enable row level security;

-- ---------------------------------------------------------------------
-- APP_USERS: cada uno ve su propia fila; admin/dev ven y administran todo
-- ---------------------------------------------------------------------
create policy app_users_select_self_or_admin on app_users
  for select using (id = auth.uid() or fn_is_admin_or_dev());

create policy app_users_write_admin on app_users
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

-- ---------------------------------------------------------------------
-- Catálogo / infraestructura: lectura para cualquier autenticado,
-- escritura solo admin/dev
-- ---------------------------------------------------------------------
create policy technicians_read on technicians
  for select using (auth.role() = 'authenticated');
create policy technicians_write on technicians
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy airports_read on airports
  for select using (auth.role() = 'authenticated');
create policy airports_write on airports
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy model_catalog_read on model_catalog
  for select using (auth.role() = 'authenticated');
create policy model_catalog_write on model_catalog
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy installed_equipment_read on installed_equipment
  for select using (auth.role() = 'authenticated');
create policy installed_equipment_write on installed_equipment
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy transmitters_read on transmitters
  for select using (auth.role() = 'authenticated');
create policy transmitters_write on transmitters
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy status_history_read on status_history
  for select using (auth.role() = 'authenticated');
create policy status_history_write on status_history
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

-- ---------------------------------------------------------------------
-- Inventario: lectura para cualquier autenticado, escritura admin/dev
-- (los movimientos de técnicos durante una comisión se resuelven vía
-- RPC en el flujo de cierre, no por escritura directa a estas tablas)
-- ---------------------------------------------------------------------
create policy articles_read on articles
  for select using (auth.role() = 'authenticated');
create policy articles_write on articles
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy tools_read on tools
  for select using (auth.role() = 'authenticated');
create policy tools_write on tools
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy spare_parts_read on spare_parts
  for select using (auth.role() = 'authenticated');
create policy spare_parts_write on spare_parts
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy movements_read on movements
  for select using (auth.role() = 'authenticated');
create policy movements_write on movements
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy vehicles_read on vehicles
  for select using (auth.role() = 'authenticated');
create policy vehicles_write on vehicles
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

-- ---------------------------------------------------------------------
-- Comisiones: lectura para cualquier autenticado (visibilidad logística
-- compartida); escritura admin/dev o el técnico asignado a esa comisión
-- ---------------------------------------------------------------------
create policy commissions_read on commissions
  for select using (auth.role() = 'authenticated');
create policy commissions_write_admin on commissions
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());
create policy commissions_update_assigned_technician on commissions
  for update using (fn_is_commission_technician(id))
  with check (fn_is_commission_technician(id));

create policy commission_technicians_read on commission_technicians
  for select using (auth.role() = 'authenticated');
create policy commission_technicians_write on commission_technicians
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy commission_airports_read on commission_airports
  for select using (auth.role() = 'authenticated');
create policy commission_airports_write on commission_airports
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

create policy commission_equipment_read on commission_equipment
  for select using (auth.role() = 'authenticated');
create policy commission_equipment_write_admin on commission_equipment
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());
create policy commission_equipment_write_assigned on commission_equipment
  for all using (fn_is_commission_technician(commission_id))
  with check (fn_is_commission_technician(commission_id));

create policy commission_tool_checklist_read on commission_tool_checklist
  for select using (auth.role() = 'authenticated');
create policy commission_tool_checklist_write_admin on commission_tool_checklist
  for all using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());
create policy commission_tool_checklist_write_assigned on commission_tool_checklist
  for all using (fn_is_commission_technician(commission_id))
  with check (fn_is_commission_technician(commission_id));

-- ---------------------------------------------------------------------
-- Mantenimientos: lectura abierta, alta admin/dev o técnico asignado a
-- la comisión (si aplica) o cualquier técnico autenticado (mantenimiento
-- correctivo fuera de comisión)
-- ---------------------------------------------------------------------
create policy maintenances_read on maintenances
  for select using (auth.role() = 'authenticated');
create policy maintenances_insert on maintenances
  for insert with check (auth.role() = 'authenticated');
create policy maintenances_update_admin on maintenances
  for update using (fn_is_admin_or_dev()) with check (fn_is_admin_or_dev());

-- ---------------------------------------------------------------------
-- Tickets: sistema ágil, cualquier autenticado puede crear y ver;
-- solo admin/dev o el creador pueden editar/resolver
-- ---------------------------------------------------------------------
create policy tickets_read on tickets
  for select using (auth.role() = 'authenticated');
create policy tickets_insert on tickets
  for insert with check (auth.role() = 'authenticated');
create policy tickets_update on tickets
  for update using (fn_is_admin_or_dev() or created_by = auth.uid())
  with check (fn_is_admin_or_dev() or created_by = auth.uid());

-- ---------------------------------------------------------------------
-- Auditoría: solo admin/dev pueden leer; no hay policy de insert
-- (las inserciones se hacen desde funciones SECURITY DEFINER)
-- ---------------------------------------------------------------------
create policy audit_log_read on audit_log
  for select using (fn_is_admin_or_dev());
