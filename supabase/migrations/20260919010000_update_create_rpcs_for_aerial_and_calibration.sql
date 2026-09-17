-- =====================================================================
-- Actualiza rpc_create_equipment (ahora pide la frecuencia de
-- verificación aérea de cada equipo físico, no la toma del catálogo) y
-- rpc_create_article (ya no recibe fecha de calibración).
-- =====================================================================

drop function if exists rpc_create_equipment(char(3), uuid, uuid, date);

create or replace function rpc_create_equipment(
  p_airport_iata char(3),
  p_catalog_model_id uuid,
  p_aerial_verification_frequency_months int,
  p_dme_catalog_model_id uuid default null,
  p_dme_aerial_verification_frequency_months int default null,
  p_installed_at date default current_date
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_own_type equipment_type;
  v_dme_type equipment_type;
  v_parent_id uuid;
  v_dme_id uuid;
begin
  if not private.fn_is_admin_or_dev() then
    raise exception 'No autorizado para dar de alta equipos';
  end if;

  select type into v_own_type from model_catalog where id = p_catalog_model_id;
  if v_own_type is null then
    raise exception 'El modelo % no existe', p_catalog_model_id;
  elsif v_own_type not in ('ILS', 'VOR') then
    raise exception 'El sistema principal debe ser ILS o VOR (es %)', v_own_type;
  end if;

  if p_aerial_verification_frequency_months is null or p_aerial_verification_frequency_months <= 0 then
    raise exception 'Debe indicar la frecuencia de verificación aérea del equipo';
  end if;

  if v_own_type = 'ILS' and p_dme_catalog_model_id is null then
    raise exception 'Un ILS siempre debe llevar su DME asociado';
  end if;

  if p_dme_catalog_model_id is not null then
    select type into v_dme_type from model_catalog where id = p_dme_catalog_model_id;
    if v_dme_type is null then
      raise exception 'El modelo de DME % no existe', p_dme_catalog_model_id;
    elsif v_dme_type <> 'DME' then
      raise exception 'El equipo asociado debe ser un modelo DME (es %)', v_dme_type;
    end if;
    if p_dme_aerial_verification_frequency_months is null or p_dme_aerial_verification_frequency_months <= 0 then
      raise exception 'Debe indicar la frecuencia de verificación aérea del DME';
    end if;
  end if;

  insert into installed_equipment (catalog_model_id, airport_iata, installed_at, aerial_verification_frequency_months)
  values (p_catalog_model_id, p_airport_iata, p_installed_at, p_aerial_verification_frequency_months)
  returning id into v_parent_id;

  if p_dme_catalog_model_id is not null then
    insert into installed_equipment (
      catalog_model_id, airport_iata, installed_at, parent_equipment_id, aerial_verification_frequency_months
    )
    values (
      p_dme_catalog_model_id, p_airport_iata, p_installed_at, v_parent_id, p_dme_aerial_verification_frequency_months
    )
    returning id into v_dme_id;
  end if;

  return jsonb_build_object('equipment_id', v_parent_id, 'dme_equipment_id', v_dme_id);
end;
$$;

revoke all on function rpc_create_equipment(char(3), uuid, int, uuid, int, date) from public;
grant execute on function rpc_create_equipment(char(3), uuid, int, uuid, int, date) to authenticated;
revoke execute on function rpc_create_equipment(char(3), uuid, int, uuid, int, date) from anon;

-- ---------------------------------------------------------------------
-- rpc_create_article sin fecha de calibración
-- ---------------------------------------------------------------------
drop function if exists rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, date, text, uuid
);

create or replace function rpc_create_article(
  p_asset_number text,
  p_serial_number text,
  p_kind article_kind,
  p_model_name text,
  p_location_type location_type,
  p_location_airport char(3) default null,
  p_physical_status article_physical_status default 'en_servicio',
  p_tool_type text default null,
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

  if p_kind = 'herramienta' and p_tool_type is null then
    raise exception 'Una herramienta requiere el tipo';
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
    insert into tools (asset_number, tool_type)
    values (p_asset_number, p_tool_type);
  else
    insert into spare_parts (asset_number, spare_type, catalog_model_id)
    values (p_asset_number, p_spare_type, p_catalog_model_id);
  end if;
end;
$$;

revoke all on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, text, uuid
) from public;
grant execute on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, text, uuid
) to authenticated;
revoke execute on function rpc_create_article(
  text, text, article_kind, text, location_type, char(3),
  article_physical_status, text, text, uuid
) from anon;
