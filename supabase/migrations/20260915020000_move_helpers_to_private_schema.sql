-- =====================================================================
-- Evita exponer fn_is_admin_or_dev / fn_is_commission_technician como
-- endpoints RPC públicos (PostgREST solo expone el schema "public" por
-- defecto). Se mueven a un schema "private" no expuesto, y las
-- políticas se actualizan para llamarlas calificadas.
-- =====================================================================

create schema if not exists private;

create or replace function private.fn_is_admin_or_dev() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from app_users where id = auth.uid() and role in ('admin', 'dev')
  );
$$;

create or replace function private.fn_is_commission_technician(p_commission_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from commission_technicians ct
    join app_users au on au.technician_id = ct.technician_id
    where ct.commission_id = p_commission_id and au.id = auth.uid()
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.fn_is_admin_or_dev() to anon, authenticated;
grant execute on function private.fn_is_commission_technician(uuid) to anon, authenticated;

-- Recrear todas las policies que usaban las funciones viejas, apuntando
-- a la versión calificada en "private".
drop policy app_users_select_self_or_admin on app_users;
drop policy app_users_write_admin on app_users;
create policy app_users_select_self_or_admin on app_users
  for select using (id = auth.uid() or private.fn_is_admin_or_dev());
create policy app_users_write_admin on app_users
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy technicians_write on technicians;
create policy technicians_write on technicians
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy airports_write on airports;
create policy airports_write on airports
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy model_catalog_write on model_catalog;
create policy model_catalog_write on model_catalog
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy installed_equipment_write on installed_equipment;
create policy installed_equipment_write on installed_equipment
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy transmitters_write on transmitters;
create policy transmitters_write on transmitters
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy status_history_write on status_history;
create policy status_history_write on status_history
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy articles_write on articles;
create policy articles_write on articles
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy tools_write on tools;
create policy tools_write on tools
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy spare_parts_write on spare_parts;
create policy spare_parts_write on spare_parts
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy movements_write on movements;
create policy movements_write on movements
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy vehicles_write on vehicles;
create policy vehicles_write on vehicles
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy commissions_write_admin on commissions;
drop policy commissions_update_assigned_technician on commissions;
create policy commissions_write_admin on commissions
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());
create policy commissions_update_assigned_technician on commissions
  for update using (private.fn_is_commission_technician(id))
  with check (private.fn_is_commission_technician(id));

drop policy commission_technicians_write on commission_technicians;
create policy commission_technicians_write on commission_technicians
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy commission_airports_write on commission_airports;
create policy commission_airports_write on commission_airports
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy commission_equipment_write_admin on commission_equipment;
drop policy commission_equipment_write_assigned on commission_equipment;
create policy commission_equipment_write_admin on commission_equipment
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());
create policy commission_equipment_write_assigned on commission_equipment
  for all using (private.fn_is_commission_technician(commission_id))
  with check (private.fn_is_commission_technician(commission_id));

drop policy commission_tool_checklist_write_admin on commission_tool_checklist;
drop policy commission_tool_checklist_write_assigned on commission_tool_checklist;
create policy commission_tool_checklist_write_admin on commission_tool_checklist
  for all using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());
create policy commission_tool_checklist_write_assigned on commission_tool_checklist
  for all using (private.fn_is_commission_technician(commission_id))
  with check (private.fn_is_commission_technician(commission_id));

drop policy maintenances_update_admin on maintenances;
create policy maintenances_update_admin on maintenances
  for update using (private.fn_is_admin_or_dev()) with check (private.fn_is_admin_or_dev());

drop policy tickets_update on tickets;
create policy tickets_update on tickets
  for update using (private.fn_is_admin_or_dev() or created_by = auth.uid())
  with check (private.fn_is_admin_or_dev() or created_by = auth.uid());

drop policy audit_log_read on audit_log;
create policy audit_log_read on audit_log
  for select using (private.fn_is_admin_or_dev());

-- Las funciones públicas viejas quedan sin uso; se eliminan.
drop function if exists fn_is_admin_or_dev();
drop function if exists fn_is_commission_technician(uuid);
