-- =====================================================================
-- Alta de artículo (herramienta o repuesto).
-- =====================================================================
-- Igual que con equipos: trg_validate_article_kind es una constraint
-- trigger deferred que exige que exista la fila hija (tools/spare_parts)
-- para el mismo asset_number al hacer commit. Dos inserts sueltos desde
-- el cliente (dos transacciones) violarían la regla a mitad de camino,
-- así que el alta de un artículo con su fila hija va en una sola RPC.

create or replace function rpc_create_article(
  p_asset_number text,
  p_serial_number text,
  p_kind article_kind,
  p_model_name text,
  p_location_type location_type,
  p_location_airport char(3) default null,
  p_physical_status article_physical_status default 'en_servicio',
  p_tool_type text default null,
  p_calibration_due_date date default null,
  p_spare_type text default null,
  p_catalog_model_id uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para dar de alta artículos';
  end if;

  if p_location_type = 'aeropuerto' and p_location_airport is null then
    raise exception 'Debe indicar el aeropuerto cuando la ubicación es un aeropuerto';
  end if;

  if p_kind = 'herramienta' and (p_tool_type is null or p_calibration_due_date is null) then
    raise exception 'Una herramienta requiere tipo y vencimiento de calibración';
  elsif p_kind = 'repuesto' and (p_spare_type is null or p_catalog_model_id is null) then
    raise exception 'Un repuesto requiere tipo y modelo al que aplica';
  end if;

  insert into articles (
    asset_number, serial_number, kind, model_name,
    current_location_type, current_location_airport, physical_status
  ) values (
    p_asset_number, p_serial_number, p_kind, p_model_name,
    p_location_type, p_location_airport, p_physical_status
  );

  if p_kind = 'herramienta' then
    insert into tools (asset_number, tool_type, calibration_due_date)
    values (p_asset_number, p_tool_type, p_calibration_due_date);
  else
    insert into spare_parts (asset_number, spare_type, catalog_model_id)
    values (p_asset_number, p_spare_type, p_catalog_model_id);
  end if;
end;
$$;

revoke all on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, date, text, uuid
) from public;
grant execute on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, date, text, uuid
) to authenticated;
revoke execute on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, date, text, uuid
) from anon;
