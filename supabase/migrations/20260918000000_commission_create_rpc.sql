-- =====================================================================
-- Alta de comisión (planificación: fechas, transporte, destinos y
-- cuadrilla asignada) en una sola RPC. No hay una constraint trigger
-- deferred acá como con equipos/artículos, pero igual conviene que la
-- comisión no quede a mitad de crear si falla un destino o un técnico:
-- todo el alta va en una única transacción.
-- =====================================================================

create or replace function rpc_create_commission(
  p_planned_departure_date date,
  p_planned_arrival_date date,
  p_airport_iatas char(3)[],
  p_technician_ids uuid[],
  p_vehicle_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_commission_id uuid;
  v_airport char(3);
  v_technician_id uuid;
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para crear comisiones';
  end if;

  if array_length(p_airport_iatas, 1) is null then
    raise exception 'Debe indicar al menos un aeropuerto destino';
  elsif array_length(p_technician_ids, 1) is null then
    raise exception 'Debe asignar al menos un técnico';
  end if;

  insert into commissions (planned_departure_date, planned_arrival_date, vehicle_id, created_by)
  values (p_planned_departure_date, p_planned_arrival_date, p_vehicle_id, auth.uid())
  returning id into v_commission_id;

  foreach v_airport in array p_airport_iatas loop
    insert into commission_airports (commission_id, airport_iata) values (v_commission_id, v_airport);
  end loop;

  foreach v_technician_id in array p_technician_ids loop
    insert into commission_technicians (commission_id, technician_id) values (v_commission_id, v_technician_id);
  end loop;

  return v_commission_id;
end;
$$;

revoke all on function rpc_create_commission(date, date, char(3)[], uuid[], uuid) from public;
grant execute on function rpc_create_commission(date, date, char(3)[], uuid[], uuid) to authenticated;
revoke execute on function rpc_create_commission(date, date, char(3)[], uuid[], uuid) from anon;
