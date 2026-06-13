# Diseño — Analítica de navegación y tiempo por usuario

- **Fecha:** 2026-06-13
- **Autor:** Mario Moreno (con Claude Code)
- **Estado:** Aprobado (pendiente de revisión final del spec)
- **Servicios afectados:** `italianto` (marketing + aula + admin), `italiantoapp` (app), `dialoghi-studio` (studio) — comparten el mismo Supabase.

## 1. Contexto y problema

La sección de analítica del panel admin (`/admin/analiticas` y `/admin/sesiones`) no refleja la navegación real:

- **`page_visits`** registra solo visitas **anónimas**, únicamente la **página de entrada** de marketing y **una vez por sesión de navegador** (guard `it_pv_sent` en `sessionStorage` + `VisitTracker` montado en un layout persistente con `useEffect([])`). Por eso `visitas totales == sesiones únicas` siempre, y la navegación SPA interna nunca se cuenta. Sin `user_id`, sin tiempo.
- **`app_sessions`** registra solo usuarios **logueados** y el **tiempo total** de la sesión, pero **no** desglosa navegación ni tiempo **por sección**.

**Conclusión:** el dato de "tiempo por sección" no existe hoy en ninguna tabla. El objetivo requiere una capa nueva de captura de eventos, no un re-maquetado.

## 2. Objetivo

1. Registrar **todas las visitas** (registrados y anónimos) a **todas las rutas** de los **3 servicios**.
2. Capturar **tiempo por sección** y el **recorrido cronológico** de cada usuario.
3. Rediseñar el panel admin: una sola sección con métricas generales + lista de **usuarios logueados** clicable, con drill-down por usuario (tiempo por sección + recorrido), búsqueda, filtros y reportes.

### Decisiones acordadas
- **Alcance:** los 3 servicios.
- **Anónimos:** solo en métricas generales; **no** aparecen en la lista clicable de usuarios.
- **Sección:** se guarda la **ruta exacta** y se muestra **agrupada** por etiqueta legible.
- **Reportes:** PDF + CSV, ámbito general y por usuario.
- **Estructura:** unificar `Analíticas` + `Sesiones` en una sola página; jubilar la de Sesiones tras validar.
- **Drill-down:** un usuario a la vez (sin multi-selección).

## 3. Enfoque elegido

**Enfoque A — Tabla de eventos de navegación con tiempo de permanencia.** Una tabla `page_views` y un tracker cliente en el layout raíz de cada servicio. Aditivo (no toca `page_visits` ni `app_sessions`), uniforme para anónimos y logueados, alimenta tanto el panel general como el drill-down por usuario.

Descartados: (B) extender `app_sessions` con filas hijas — más acoplamiento sobre código que funciona, y `app_sessions` no existe para anónimos; (C) herramienta externa (PostHog/Plausible) — no vive en el panel con las identidades propias, dependencia/coste/privacidad.

## 4. Modelo de datos

### Tabla `page_views` (nueva, aditiva)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK `default uuid_generate_v4()` | |
| `user_id` | text NULL → `users(id) on delete cascade` | nulo si anónimo |
| `anon_id` | text NOT NULL | cookie persistente `it_visitor` (UUID, 1 año) |
| `service` | text NOT NULL | `'marketing'` \| `'app'` \| `'studio'` |
| `path` | text NOT NULL | ruta exacta (ej. `/lezioni/saluti`) |
| `section` | text NOT NULL | etiqueta agrupada calculada al escribir (fallback `'Otras'`) |
| `entered_at` | timestamptz NOT NULL `default now()` | |
| `duration_seconds` | integer NULL | se rellena al salir; nulo = duración desconocida |
| `referrer` | text NULL | |
| `user_agent` | text NULL | |

Índices: `idx_page_views_user_id (user_id)`, `idx_page_views_section (section)`, `idx_page_views_service (service)`, `idx_page_views_entered_at (entered_at)`.

RLS **activado** con política deny-by-default (igual que `app_sessions`). Acceso solo vía service-role server-side.

### Mapa de agrupación `section-map.ts`

Constante compartida que traduce `path → sección legible`, por servicio. Ejemplos:
- **marketing:** `/`→`Home`, `/precios`→`Precios`, `/lancio*`→`Lanzamiento`, `/contacto`→`Contacto`, `/cookies`→`Cookies`.
- **aula (dashboard):** `/lezioni*`→`Lecciones`, `/corsi*`→`Cursos`, `/tutor*`→`Tutor`, `/canzoni`→`Canciones`, `/dashboard`→`Inicio`, `/downloads`→`Descargas`, `/impostazioni`→`Ajustes`.
- **app:** `/conjugador`→`Conjugador`, `/traductor`→`Traductor`, `/pronuncia`→`Pronunciación`, `/tutor*`→`Tutor`, `/profilo`→`Perfil`.
- **studio:** `/studio`→`Studio`, `/pricing`→`Precios`, `/account`→`Cuenta`, `/about`→`Acerca`.

Rutas no mapeadas → `section = 'Otras'`. Las rutas `/admin*` se excluyen del tracking (no medimos al propio admin).

### Identidad
- `user_id`: resuelto server-side vía Clerk (`currentUser()`); nulo si no hay login.
- `anon_id`: cookie `it_visitor` (UUID v4), `Domain=.italianto.com`, `SameSite=Lax`, `HttpOnly`, `Max-Age` 1 año. Compartida entre subdominios → enlaza recorrido entre servicios y desde anónimo hasta registro.

## 5. Capa de captura

### Componente `PageViewTracker` (cliente)
Montado en el `layout.tsx` raíz de cada servicio. Usa `usePathname()` para detectar cada cambio de ruta (resuelve el bug de navegación SPA no registrada).

Ciclo **insertar-al-entrar + actualizar-al-salir** (mismo patrón que `/api/sessions/track`):
1. Al entrar a una ruta → `POST /api/analytics/pageview` (crea fila, devuelve `id`, arranca cronómetro).
2. Al cambiar de ruta o al ocultar/cerrar pestaña (`visibilitychange`→hidden, `pagehide`) → `PATCH` con `duration` vía `navigator.sendBeacon`.

La visita siempre se cuenta aunque se pierda la duración (cierre brusco → `duration_seconds` nulo). Sin heartbeat por defecto (1 POST + 1 PATCH por página); heartbeat queda como interruptor opcional. Rutas `/admin*` excluidas.

### Endpoint `/api/analytics/pageview` (uno por servicio)
- `POST`: resuelve `user_id` vía Clerk **sin exigir login** (anónimo → `user_id` nulo, sin 401). Lee/emite cookie `it_visitor`. Mapea `path → section`. Inserta fila. Devuelve `{ id }`.
- `PATCH`: actualiza `duration_seconds` por `id`.
- Blindaje: validación de payload, tope de longitud de `path`/`referrer`, descarta campos inesperados. Rate-limiting por `anon_id`/IP opcional.

### Coexistencia y fuentes de datos
- `page_views` (nuevo) es la fuente de **navegación, tiempo por sección, visitas y visitantes únicos** (anónimos + registrados).
- `app_sessions` + `SessionTracker` **se conservan permanentemente** como fuente de **sesiones de login y tiempo medio por sesión** de usuarios registrados (ya funciona; no se duplica esa lógica en `page_views`).
- `VisitTracker` + `page_visits` (anónimo, roto/incompleto) **sí** se retiran tras validar, porque `page_views` los reemplaza por completo.

## 6. Panel admin unificado (`/admin/analiticas`)

Sigue el estilo visual actual (`StatsCard`, tarjetas `rounded-2xl border-verde-900/40`). En implementación se usará la skill `frontend-design` para pulir UI/UX.

### Bloque A — Métricas generales (anónimos + registrados)
- Selector de rango (7d / 30d / 90d / custom) que aplica a todo el panel y a los reportes.
- KPIs: Visitas totales y Visitantes únicos (por `anon_id`, desde `page_views`); Usuarios registrados activos; Tiempo medio por sesión (desde `app_sessions`).
- "Secciones más visitadas" (agrupado) con visitas + tiempo, toggle `todos · anónimos · registrados`.
- Reparto por servicio.
- Botón "Reporte general".

### Bloque B — Usuarios logueados
- Barra de búsqueda por nombre/correo (filtra en vivo) + filtros por servicio y rango.
- Tabla: Usuario, Correo, Sesiones, Páginas, Tiempo total, Última actividad. Filas clicables.
- Datos: `page_views` con `user_id` no nulo (páginas, tiempo por sección, última actividad), unido a `users`; nº de sesiones desde `app_sessions`.

### Drill-down (slide-over al clic en un usuario)
- Cabecera: tiempo total, nº páginas (de `page_views`), nº sesiones (de `app_sessions`), nº servicios.
- "Tiempo por sección" (agregado de sus filas por `section`).
- "Recorrido reciente" (cronológico, agrupado por día, con duración por página).
- Botón "Reporte usuario".

## 7. Reportes (PDF + CSV)

Endpoints en `italianto`, tras `requireAdmin()`. Respetan rango/filtros activos.
- `GET /api/admin/analytics/report?scope=general&format=pdf|csv&from=&to=`
- `GET /api/admin/analytics/report?scope=user&userId=&format=pdf|csv&from=&to=`

**PDF** (server-side, `@react-pdf/renderer`): resumen presentable con cabecera/logo.
- General: totales, secciones top con tiempo, reparto por servicio, rango y fecha de generación.
- Usuario: nombre/correo, totales, tiempo por sección, recorrido resumido.

**CSV** (streaming, `Content-Disposition: attachment`, sin dependencias):
- General: fila por `page_view` (o agregada por sección según parámetro).
- Usuario: filas de navegación con tiempo por sección.
- Sanitizado anti CSV injection (prefijo `'` ante `= + - @`).

**Seguridad reportes:** solo tras `requireAdmin()`; `Cache-Control: no-store` (contienen PII).

## 8. Seguridad de datos

- RLS deny-by-default en `page_views`; lectura/escritura solo vía service-role server-side. La clave pública/anónima no puede leer la tabla.
- PII (correo + recorrido): solo accesible tras `requireAdmin()`.
- Endpoint público de captura blindado (validación, tope de longitud, rate-limiting opcional).
- CSV injection sanitizado.

## 9. Rollout incremental (aditivo, sin romper nada)

1. **Migración** SQL: crea `page_views` + índices. Cero cambios destructivos.
2. **Captura** en los 3 servicios (trackers + endpoints). Trackers viejos siguen activos en paralelo.
3. **Panel unificado** nuevo leyendo de `page_views` (+ `app_sessions` para KPIs de sesión). `/admin/sesiones` se mantiene como respaldo.
4. **Validación** con datos reales (unos días): llegan filas, duraciones se rellenan, drill-down cuadra.
5. **Retiro limpio** (solo tras validar): quitar `VisitTracker`, `page_visits` y su widget viejo, y la página/enlace de Sesiones (su contenido ya vive en el panel unificado). **`SessionTracker` + `app_sessions` se conservan** como fuente de las KPIs de sesión.

Despliegue vía EasyPanel/git; no se edita el código en `/etc/easypanel/...` (solo lectura del código desplegado).

## 10. Pruebas (basadas en intención)

- **Unit:** `section-map` (ruta→sección + fallback `'Otras'`); sanitización CSV.
- **Endpoint:** POST crea fila con `user_id`/`anon_id`/`section` correctos; admite anónimo; emite cookie si falta; PATCH actualiza `duration`; reportes exigen admin (403 sin sesión admin).
- **Manual:** navegar los 3 sitios → verificar filas y duraciones; panel → totales, búsqueda, filtros, drill-down y descargas PDF/CSV.

## 11. Fuera de alcance

Retención/borrado automático de datos antiguos y heartbeat de precisión — anotados para una iteración futura.
