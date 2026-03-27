# Migración a Supabase Unificado

## Por qué un solo proyecto Supabase

| Problema | Solución |
|----------|----------|
| Plan gratis = máx. 2 proyectos | 1 proyecto compartido entre las 3 apps |
| Proyectos se pausan a los 7 días | Cron job keep-alive cada 3 días |
| 3 tablas `users` separadas | 1 tabla `users` centralizada |
| 3 sistemas de suscripción separados | 1 tabla `subscriptions` controla todo |

---

## Paso 1 — Crear el nuevo proyecto Supabase

1. Ir a **https://supabase.com/dashboard**
2. **New Project** con estos datos:
   - Nombre: `italianto-unified`
   - Contraseña DB: genera una segura (guárdala en tu gestor de contraseñas)
   - Región: `us-east-1` (East US — mejor latencia desde Venezuela/LATAM)
3. Esperar ~2 minutos a que se cree el proyecto

## Paso 2 — Ejecutar el schema unificado

1. En el dashboard de Supabase: **SQL Editor** → **New Query**
2. Copiar el contenido completo de `supabase/schema-unified.sql`
3. Clic en **Run** (o Ctrl+Enter)
4. Verificar que no hay errores en el output

## Paso 3 — Obtener las credenciales

En **Settings → API**:
```
Project URL:          https://xxxxxxxxxxxx.supabase.co
anon public:          eyJhbGciOiJIUzI1NiIs...
service_role secret:  eyJhbGciOiJIUzI1NiIs...
```

**IMPORTANTE**: El `service_role` key tiene acceso total. Nunca lo expongas en el frontend.

---

## Paso 4 — Actualizar italianto-master (plataforma)

En tu `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://NUEVO-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key nueva)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role key nueva)
```

---

## Paso 5 — Actualizar Dialogue Studio

En `/mnt/c/Proyectos/dialogue-studio/.env` (o `.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://NUEVO-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (misma anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (misma service role key)
```

### Mapeo de nombres de planes (dialogue-studio → unificado)

El schema de dialogue-studio usaba `basic/standard/pro`. El unificado usa `free/essenziale/avanzato/maestro`.

En `dialogue-studio/src/lib/stripe.ts` (o donde esté el mapeo), actualizar:

```typescript
// ANTES (dialogue-studio original)
const PLAN_MAP = {
  basic: 'basic',
  standard: 'standard',
  pro: 'pro',
}

// DESPUÉS (schema unificado)
const PLAN_MAP = {
  basic: 'essenziale',      // basic → essenziale
  standard: 'avanzato',     // standard → avanzato
  pro: 'maestro',           // pro → maestro
}
```

También actualizar el webhook de Stripe en dialogue-studio para usar los mismos `plan_type` del schema unificado.

---

## Paso 6 — Actualizar ItaliantoApp

En `/mnt/c/Proyectos/ItaliantoApp/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://NUEVO-ID.supabase.co
SUPABASE_ANON_KEY=eyJ... (misma anon key)
```

### Mapeo de planes (ItaliantoApp → unificado)

ItaliantoApp usaba `free/mensile/annuale` como `plan_type`. Actualizar en el webhook de Stripe de ItaliantoApp:

```typescript
// ANTES
plan_type: 'mensile'   // o 'annuale'

// DESPUÉS (schema unificado)
// mensile → essenziale o avanzato según el precio
// annuale → essenziale o avanzato según el precio
```

---

## Paso 7 — Configurar Keep-Alive

### Opción A: cron-job.org (recomendado, más fácil)

1. Ir a **https://cron-job.org** → Crear cuenta gratuita
2. **CREATE CRONJOB**:

   **Keep-alive (cada 3 días)**:
   ```
   Título:   Italianto Keep-Alive
   URL:      https://italianto.com/api/keep-alive
   Método:   GET
   Headers:  Authorization: Bearer <TU_KEEP_ALIVE_SECRET>
   Schedule: Every 3 days (0 8 */3 * *)
   ```

   **Quota reset (primer día del mes)**:
   ```
   Título:   Italianto Quota Reset
   URL:      https://italianto.com/api/quota-reset
   Método:   POST
   Headers:  Authorization: Bearer <TU_CRON_SECRET>
   Schedule: 5 0 1 * *
   ```

3. Activar ambos jobs.

> **Nota**: cron-job.org tiene notificaciones por email si el job falla. Actívalas para saber si Supabase se pausó.

### Opción B: GitHub Actions (si tienes el repo en GitHub)

Ya está configurado en `.github/workflows/keep-alive.yml` y `quota-reset.yml`.

Agregar estos **Secrets** en tu repo de GitHub:
```
Settings → Secrets and variables → Actions → New repository secret

APP_URL           = https://italianto.com
KEEP_ALIVE_SECRET = (valor de KEEP_ALIVE_SECRET de tu .env)
CRON_SECRET       = (valor de CRON_SECRET de tu .env)
```

---

## Paso 8 — Migrar datos existentes (si aplica)

Si tienes usuarios en el Supabase viejo de dialogue-studio, exportar e importar:

```sql
-- En el proyecto VIEJO de dialogue-studio (SQL Editor):
-- Exportar usuarios
COPY (SELECT id, email, stripe_customer_id, created_at FROM users) TO '/tmp/users.csv' CSV HEADER;

-- Exportar suscripciones
COPY (SELECT * FROM subscriptions) TO '/tmp/subscriptions.csv' CSV HEADER;
```

O usar la interfaz de Supabase: **Table Editor → Export**.

En el proyecto NUEVO, importar los CSV via **Table Editor → Import**.

---

## Verificación final

```sql
-- Ejecutar en SQL Editor del proyecto nuevo:
SELECT
  (SELECT count(*) FROM users) as usuarios,
  (SELECT count(*) FROM subscriptions) as suscripciones,
  (SELECT count(*) FROM coupons) as cupones,
  keep_alive() as db_status;
```

Si ves `db_status = 'ok'`, todo está funcionando correctamente. ✅

---

## Resumen de credenciales a actualizar

| App | Archivo | Variables a cambiar |
|-----|---------|---------------------|
| italianto-master | `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| dialogue-studio | `.env` / `.env.local` | Mismas 3 variables |
| ItaliantoApp | `.env` | `EXPO_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY` |
