-- =====================================================================
-- Fix: rpc_check_tool_return fallaba con "column return_state is of
-- type tool_return_state but expression is of type text". El CASE con
-- literales de texto se resuelve como "text", no como "unknown", así
-- que el cast implícito a enum que sí aplica para literales sueltos no
-- se dispara acá. Se agrega el cast explícito a tool_return_state.
-- =====================================================================

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
    (case when p_returned then 'devuelta' else 'no_devuelta' end)::tool_return_state,
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
