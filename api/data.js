const METABASE_URL = 'https://metabase.crackthecode.la';
const DB_ID = 6;

async function runQuery(apiKey, sql) {
  const res = await fetch(`${METABASE_URL}/api/dataset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ database: DB_ID, type: 'native', native: { query: sql }, parameters: [] }),
  });
  if (!res.ok) throw new Error(`Metabase error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Query error: ${json.error}`);
  const cols = json.data.cols.map(c => c.name);
  return json.data.rows.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// Grano: UNA fila por sesión (IE/grado a nivel salón — sin fanout por enrollment).
// Coherente con la SSOT de cancelaciones: incluye TODOS los motivos (también
// 33/34/35); única exclusión, las ventanas de paro 2024. El front decide filtros.
const SQL_SESIONES = (from, to) => `
SELECT
  rs.id AS sesion_id,
  CAST(rs.start_date AS VARCHAR) AS fecha,
  DATE_FORMAT(DATE_TRUNC('week', rs.start_date), '%Y-%m-%d') AS semana,
  DATE_FORMAT(rs.start_date, '%W') AS dia,
  SUBSTR(rs.start_time, 1, 2) AS hora,
  COALESCE(p.id, 0) AS project_id,
  COALESCE(p.internal_name, p.name, 'B2C') AS proyecto,
  COALESCE(p.type, 'B2C') AS canal,
  COALESCE(NULLIF(TRIM(ei.name), ''), 'Sin IE') AS ie,
  COALESCE(rr.college_grade, '-') AS grado,
  rr.id AS room_id,
  rr.name AS salon,
  rs.state,
  rs.cancellation_reason_id AS reason_id,
  CASE WHEN rs.state = 'false' THEN COALESCE(rc.name, 'Sin especificar') END AS motivo,
  rs.risk_cancellation AS riesgo,
  rs.make_up_class,
  rs.given_by_external,
  CONCAT(au.last_name, ', ', au.first_name) AS profesor,
  rs.academic_hours,
  TRY_CAST(rs.duration_time AS INTEGER) AS duracion_min,
  rs.cancellation_at
FROM datalake.room_roomsessions rs
LEFT JOIN datalake.room_room rr ON rs.room_id = rr.id
LEFT JOIN datalake.projects p ON p.id = rr.project_b2b_id
LEFT JOIN datalake.educational_institution ei ON ei.id = rr.educational_institution_id
LEFT JOIN datalake.catalog_reasonsessioncancellation rc ON rs.cancellation_reason_id = rc.id
LEFT JOIN datalake.account_user au ON rs.teacher_id = au.id
WHERE rs.start_date >= DATE '${from}' AND rs.start_date <= DATE '${to}'
  AND NOT (rs.state = 'false' AND rr.project_b2b_id IN (19, 14) AND ((rs.start_date BETWEEN DATE '2024-06-17' AND DATE '2024-07-05') OR (rs.start_date BETWEEN DATE '2024-10-07' AND DATE '2024-10-14')))
  AND NOT (rs.state = 'false' AND rr.project_b2b_id IN (47, 48, 56) AND (rs.start_date BETWEEN DATE '2024-10-07' AND DATE '2024-10-14'))
ORDER BY rs.start_date`;

// Particiona [from, to] en tramos de ~7 días para no chocar con el tope de filas
// de la API de Metabase (una semana típica ≈ 900 sesiones).
function tramosSemanales(from, to) {
  const tramos = [];
  let a = new Date(from + 'T00:00:00Z');
  const fin = new Date(to + 'T00:00:00Z');
  while (a <= fin) {
    const b = new Date(a); b.setUTCDate(b.getUTCDate() + 6);
    const bReal = b > fin ? fin : b;
    tramos.push([a.toISOString().slice(0, 10), bReal.toISOString().slice(0, 10)]);
    a = new Date(bReal); a.setUTCDate(a.getUTCDate() + 1);
  }
  return tramos;
}

const reFecha = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.METABASE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'METABASE_API_KEY not configured' });

  // Default: últimas 12 semanas
  const hoy = new Date().toISOString().slice(0, 10);
  const hace12 = new Date(Date.now() - 12 * 7 * 86400000).toISOString().slice(0, 10);
  const from = reFecha.test(req.query?.from || '') ? req.query.from : hace12;
  const to = reFecha.test(req.query?.to || '') ? req.query.to : hoy;

  // Tope de sanidad: máximo 1 año por request
  if ((new Date(to) - new Date(from)) / 86400000 > 370) {
    return res.status(400).json({ ok: false, error: 'Rango máximo: 1 año por consulta' });
  }

  try {
    const tramos = tramosSemanales(from, to);
    // De a 4 tramos en paralelo para no saturar Metabase
    const rows = [];
    for (let i = 0; i < tramos.length; i += 4) {
      const lote = tramos.slice(i, i + 4);
      const resultados = await Promise.all(lote.map(([a, b]) => runQuery(apiKey, SQL_SESIONES(a, b))));
      for (const r of resultados) rows.push(...r);
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ ok: true, updated_at: new Date().toISOString(), from, to, n: rows.length, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
