# Radioayudas — Sistema de Trazabilidad

Plataforma de logística, mantenimiento y control de inventario de
infraestructura de radioayudas aeronáuticas (VOR, ILS, DME).

## Stack

- **Backend/DB**: Supabase (Postgres + Auth). El frontend habla
  directo con Supabase; la seguridad se resuelve con RLS por rol
  (`admin`, `dev`, `tecnico`). Los flujos de negocio complejos (cierre
  de comisión, movimientos de inventario) se implementan como
  funciones RPC `SECURITY DEFINER`.
- **Proyecto de desarrollo**: `radioayudas-dev` (Supabase, org
  "Francisco", región `sa-east-1`).

## Estado actual

- [x] Modelo de datos (`supabase/migrations/20260915000000_initial_schema.sql`)
- [x] RLS baseline + hardening (`20260915010000_rls_and_hardening.sql`,
      `20260915020000_move_helpers_to_private_schema.sql`)
- [ ] Funciones RPC para el flujo de cierre de comisión
- [ ] Frontend

## Migraciones

Viven en `supabase/migrations/`, versionadas y numeradas
cronológicamente. Se aplicaron directo contra el proyecto cloud de
desarrollo (no hay stack local porque no hay Docker instalado en esta
máquina). Si más adelante se instala Docker + Supabase CLI, se puede
levantar el stack local con:

```bash
supabase init
supabase link --project-ref pwhoyhabdmpaleubmjpi
supabase db pull   # trae el estado actual como baseline
supabase start     # levanta Postgres/Auth/Storage local
```

## Permisos (RLS) — estado provisorio

El modelo de roles fino (qué puede hacer exactamente un `tecnico`)
todavía no está cerrado. El baseline actual es:

- **Lectura**: cualquier usuario autenticado puede leer casi todas las
  tablas (necesario para el trabajo diario en campo).
- **Escritura**: `admin`/`dev` tienen acceso total. Un `tecnico` solo
  puede escribir directamente en `commissions`, `commission_equipment`
  y `commission_tool_checklist` de las comisiones donde figura
  asignado (vía `commission_technicians`), y en `tickets` propios.
- Escrituras más finas para técnicos (mover inventario, cambiar estado
  de un Tx, cerrar una comisión) se resuelven vía funciones RPC en el
  paso de "flujo de cierre de comisión", no por acceso directo a la
  tabla.

Revisar y ajustar cuando se defina el modelo de roles definitivo.

## Variables de entorno

Ver `.env.local` (no versionado). Contiene la URL del proyecto y la
publishable key (no es secreta, se usa desde el cliente).
