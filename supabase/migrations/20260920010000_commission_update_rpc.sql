-- =====================================================================
-- Edición de una comisión planificada: reemplaza fechas, vehículo,
-- destinos y cuadrilla en una sola transacción (borra y recrea las
-- filas de las tablas puente, igual que el alta).
-- =====================================================================

create or replace function rpc_update_commission(
  p_commission_id uuid,
  p_planned_departure_date date,
  p_planned_arrival_date date,
  p_airport_iatas char(3)[],
  p_technician_ids uuid[],
  p_vehicle_id uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status commission_status;
  v_airport char(3);
  v_technician_id uuid;
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para editar comisiones';
  end if;

  select status into v_status from commissions where id = p_commission_id;
  if v_status is null then
    raise exception 'La comisión % no existe', p_commission_id;
  elsif v_status <> 'planificada' then
    raise exception 'Solo se puede editar una comisión mientras está planificada';
  end if;

  if array_length(p_airport_iatas, 1) is null then
    raise exception 'Debe indicar al menos un aeropuerto destino';
  elsif array_length(p_technician_ids, 1) is null then
    raise exception 'Debe asignar al menos un técnico';
  end if;

  update commissions
    set planned_departure_date = p_planned_departure_date,
        planned_arrival_date = p_planned_arrival_date,
        vehicle_id = p_vehicle_id
    where id = p_commission_id;

  delete from commission_airports where commission_id = p_commission_id;
  delete from commission_technicians where commission_id = p_commission_id;

  foreach v_airport in array p_airport_iatas loop
    insert into commission_airports (commission_id, airport_iata) values (p_commission_id, v_airport);
  end loop;

  foreach v_technician_id in array p_technician_ids loop
    insert into commission_technicians (commission_id, technician_id) values (p_commission_id, v_technician_id);
  end loop;
end;
$$;

revoke all on function rpc_update_commission(uuid, date, date, char(3)[], uuid[], uuid) from public;
grant execute on function rpc_update_commission(uuid, date, date, char(3)[], uuid[], uuid) to authenticated;
revoke execute on function rpc_update_commission(uuid, date, date, char(3)[], uuid[], uuid) from anon;
