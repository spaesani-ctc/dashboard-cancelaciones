# 🚫 Dashboard de Cancelaciones — CTC

Dashboard interactivo de cancelaciones de sesiones, hosteado en Vercel con datos en vivo desde Metabase/Athena. Misma identidad visual que el [informe de satisfacción](https://informe-satisfaccion.vercel.app) (paleta papel, DM Serif Display / DM Sans / DM Mono, modo oscuro).

## Secciones

KPIs (programadas, canceladas, % cancelación, salones afectados, horas académicas) · Serie semanal (canceladas + % dual-axis) · Motivos · Por proyecto · Por IE · Heatmap día × hora · Por profesor (de la sesión, contempla reemplazos) · Tabla detalle con export CSV.

## Filtros

Período (presets 4/12/26 semanas, YTD, o rango libre — máx. 1 año) · Canal · Proyecto · IE · Grado · Salón · Motivo · Switch **Sin/Con motivos 33-34-35** (Cambio operativo BO / Feriado / Vacaciones — excluidos por defecto, como el dashboard oficial; al excluirlos salen también del denominador). Los selects son en cascada.

## Arquitectura

```
├── api/data.js        ← serverless: SSOT de cancelaciones a grano SESIÓN (sin fanout),
│                        troceada por semana para evitar el tope de filas de la API,
│                        cache 5 min. Params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
├── public/index.html  ← estático: filtrado y agregación 100% client-side (Chart.js)
└── vercel.json
```

La fuente es la **SSOT de Cancelaciones** (ver repo data-skill / skill `ctc-analytics`): incluye todos los `cancellation_reason_id`; única exclusión de filas, las ventanas de paro 2024 (proyectos 19/14 y 47/48/56). IE y grado a nivel salón (catálogo), motivo crudo + rotulado, horas académicas solo donde el campo está cargado (con cobertura indicada — sin conversiones desde reloj).

## Deploy

1. Crear el proyecto en Vercel apuntando a este repo.
2. Variable de entorno: `METABASE_API_KEY` (API key de Metabase con acceso a la DB 6).
3. Deploy. El botón "↻ Actualizar" del dashboard fuerza el bypass del cache.
