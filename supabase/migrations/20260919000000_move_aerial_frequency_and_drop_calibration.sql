-- =====================================================================
-- 1) La frecuencia de verificación aérea exigida pasa a ser una
--    propiedad del equipo físico instalado (installed_equipment), no
--    del modelo de catálogo: dos equipos del mismo modelo en distintos
--    aeropuertos pueden tener exigencias distintas. Se fija al dar de
--    alta el equipo.
-- =====================================================================
alter table installed_equipment
  add column aerial_verification_frequency_months int;

update installed_equipment ie
  set aerial_verification_frequency_months = mc.aerial_verification_frequency_months
  from model_catalog mc
  where mc.id = ie.catalog_model_id;

alter table installed_equipment
  alter column aerial_verification_frequency_months set not null,
  add constraint installed_equipment_aerial_freq_check check (aerial_verification_frequency_months > 0);

alter table model_catalog drop column aerial_verification_frequency_months;

-- fn_set_maintenance_next_due usaba mc.aerial_verification_frequency_months;
-- ahora la lee directamente de installed_equipment.
create or replace function fn_set_maintenance_next_due() returns trigger as $$
declare
  v_preventive_months int;
  v_aerial_months int;
begin
  select mc.preventive_frequency_months, ie.aerial_verification_frequency_months
    into v_preventive_months, v_aerial_months
    from installed_equipment ie
    join model_catalog mc on mc.id = ie.catalog_model_id
    where ie.id = new.equipment_id;

  if new.type = 'verificacion_aerea' then
    new.next_due_date := new.performed_at + (v_aerial_months || ' months')::interval;
  elsif new.type in ('preventivo_mensual', 'preventivo_trimestral', 'preventivo_semestral', 'preventivo_anual') then
    new.next_due_date := new.performed_at + (v_preventive_months || ' months')::interval;
  else
    new.next_due_date := null;
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

-- ---------------------------------------------------------------------
-- 2) Se quita la fecha de calibración de los artículos (herramientas):
--    no se está usando en el flujo real y complicaba el alta sin
--    aportar trazabilidad accionable todavía.
-- ---------------------------------------------------------------------
alter table tools drop column calibration_due_date;
