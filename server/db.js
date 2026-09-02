import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for ultra fast concurrent reads & writes
db.pragma('journal_mode = WAL');

// Initialize Table Schema & Indexes
db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    date_str TEXT NOT NULL,
    time_str TEXT NOT NULL,
    status TEXT DEFAULT 'Success',
    temp REAL NOT NULL,
    humidity REAL NOT NULL,
    mq2 REAL NOT NULL,
    mq3 REAL NOT NULL,
    mq4 REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_status ON sensor_logs(status);
`);

/**
 * Inserts a single sensor reading into SQLite (< 1ms)
 */
export function insertLog(data) {
  const dt = data.dateObj || new Date(data.timestamp || Date.now());
  const ts = dt.getTime();
  const dateStr = data.date_str || dt.toLocaleDateString('vi-VN');
  const timeStr = data.time_str || dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Sanitize & Clamp Values
  const rawHum = parseFloat(data.humidity) || 0;
  const clampedHum = Math.min(100, Math.max(0, Math.round(rawHum * 10) / 10));

  const stmt = db.prepare(`
    INSERT INTO sensor_logs (timestamp, date_str, time_str, status, temp, humidity, mq2, mq3, mq4)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    ts,
    dateStr,
    timeStr,
    data.status || 'Success',
    Math.round((parseFloat(data.temp) || 0) * 10) / 10,
    clampedHum,
    Math.round(parseFloat(data.mq2) || 0),
    Math.round(parseFloat(data.mq3) || 0),
    Math.round(parseFloat(data.mq4) || 0)
  );

  return {
    id: result.lastInsertRowid,
    timestamp: ts,
    date_str: dateStr,
    time_str: timeStr,
    formattedDate: dateStr,
    formattedTime: timeStr,
    formattedDateTime: `${dateStr} ${timeStr}`,
    status: data.status || 'Success',
    temp: Math.round((parseFloat(data.temp) || 0) * 10) / 10,
    humidity: clampedHum,
    mq2: Math.round(parseFloat(data.mq2) || 0),
    mq3: Math.round(parseFloat(data.mq3) || 0),
    mq4: Math.round(parseFloat(data.mq4) || 0),
  };
}

/**
 * Bulk Insert for Google Sheets Migration
 */
export function insertBatchLogs(records) {
  if (!records || records.length === 0) return 0;

  const insertStmt = db.prepare(`
    INSERT INTO sensor_logs (timestamp, date_str, time_str, status, temp, humidity, mq2, mq3, mq4)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    let count = 0;
    for (const r of rows) {
      const clampedHum = Math.min(100, Math.max(0, r.humidity || 0));
      insertStmt.run(
        r.timestamp,
        r.rawDate || r.formattedDate,
        r.rawTime || r.formattedTime,
        r.status || 'Success',
        r.temp,
        clampedHum,
        r.mq2,
        r.mq3,
        r.mq4
      );
      count++;
    }
    return count;
  });

  return insertMany(records);
}

export function getCount() {
  const row = db.prepare('SELECT COUNT(*) as count FROM sensor_logs').get();
  return row ? row.count : 0;
}

export function getLatestRecord() {
  const row = db.prepare('SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 1').get();
  if (!row) return null;
  return {
    ...row,
    formattedDate: row.date_str,
    formattedTime: row.time_str,
    formattedDateTime: `${row.date_str} ${row.time_str}`,
  };
}

/**
 * Robust KPI metrics query with smart fallback if dataset has a date gap
 */
export function getKPIMetrics(timeframe = 'day', thresholds) {
  const latest = getLatestRecord();
  if (!latest) return null;

  const maxTs = latest.timestamp;
  let cutoff = 0;

  switch (timeframe) {
    case 'hour': cutoff = maxTs - 24 * 3600 * 1000; break;
    case 'day': cutoff = maxTs - 7 * 86400 * 1000; break;
    case 'week': cutoff = maxTs - 30 * 86400 * 1000; break;
    case 'month': cutoff = maxTs - 90 * 86400 * 1000; break;
    case 'year':
    case 'all':
    default: cutoff = 0; break;
  }

  let stats = db.prepare(`
    SELECT 
      AVG(temp) as avg_temp, MIN(temp) as min_temp, MAX(temp) as max_temp,
      AVG(humidity) as avg_hum, MIN(humidity) as min_hum, MAX(humidity) as max_hum,
      AVG(mq2) as avg_mq2, MIN(mq2) as min_mq2, MAX(mq2) as max_mq2,
      AVG(mq3) as avg_mq3, MIN(mq3) as min_mq3, MAX(mq3) as max_mq3,
      AVG(mq4) as avg_mq4, MIN(mq4) as min_mq4, MAX(mq4) as max_mq4,
      COUNT(*) as filtered_count
    FROM sensor_logs
    WHERE timestamp >= ?
  `).get(cutoff);

  // If timestamp gap caused fewer than 10 records, fallback to recent 1,000 records for smooth display
  if (!stats || stats.filtered_count < 10) {
    stats = db.prepare(`
      SELECT 
        AVG(temp) as avg_temp, MIN(temp) as min_temp, MAX(temp) as max_temp,
        AVG(humidity) as avg_hum, MIN(humidity) as min_hum, MAX(humidity) as max_hum,
        AVG(mq2) as avg_mq2, MIN(mq2) as min_mq2, MAX(mq2) as max_mq2,
        AVG(mq3) as avg_mq3, MIN(mq3) as min_mq3, MAX(mq3) as max_mq3,
        AVG(mq4) as avg_mq4, MIN(mq4) as min_mq4, MAX(mq4) as max_mq4,
        COUNT(*) as filtered_count
      FROM (SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 1000)
    `).get();
  }

  const prevRow = db.prepare('SELECT * FROM sensor_logs WHERE timestamp < ? ORDER BY timestamp DESC LIMIT 1').get(latest.timestamp);
  const prev = prevRow || latest;

  const calc = (curr, previousVal, avg, min, max) => {
    const trend = previousVal !== 0 ? ((curr - previousVal) / previousVal) * 100 : 0;
    return {
      current: curr,
      previous: previousVal,
      avg: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      trend: Math.round(trend * 10) / 10,
    };
  };

  return {
    latest,
    metrics: {
      temp: calc(latest.temp, prev.temp, stats.avg_temp || 0, stats.min_temp || 0, stats.max_temp || 0),
      humidity: calc(latest.humidity, prev.humidity, stats.avg_hum || 0, stats.min_hum || 0, stats.max_hum || 0),
      mq2: calc(latest.mq2, prev.mq2, stats.avg_mq2 || 0, stats.min_mq2 || 0, stats.max_mq2 || 0),
      mq3: calc(latest.mq3, prev.mq3, stats.avg_mq3 || 0, stats.min_mq3 || 0, stats.max_mq3 || 0),
      mq4: calc(latest.mq4, prev.mq4, stats.avg_mq4 || 0, stats.min_mq4 || 0, stats.max_mq4 || 0),
    },
    totalCount: getCount(),
    filteredCount: stats.filtered_count || 0,
    thresholds,
  };
}

/**
 * Smart chart downsampling query with gap fallback
 */
export function getChartPoints(timeframe = 'day', maxPoints = 120) {
  const latest = getLatestRecord();
  if (!latest) return [];

  const maxTs = latest.timestamp;
  let cutoff = 0;

  switch (timeframe) {
    case 'hour': cutoff = maxTs - 24 * 3600 * 1000; break;
    case 'day': cutoff = maxTs - 7 * 86400 * 1000; break;
    case 'week': cutoff = maxTs - 30 * 86400 * 1000; break;
    case 'month': cutoff = maxTs - 90 * 86400 * 1000; break;
    case 'year':
    case 'all':
    default: cutoff = 0; break;
  }

  let countRow = db.prepare('SELECT COUNT(*) as cnt FROM sensor_logs WHERE timestamp >= ?').get(cutoff);
  let totalInWindow = countRow ? countRow.cnt : 0;

  let query = `
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as row_num
      FROM sensor_logs
      WHERE timestamp >= ?
    )
    WHERE (row_num - 1) % ? = 0
    ORDER BY timestamp ASC
  `;
  let queryParams = [cutoff];

  // If gap caused fewer than 10 records in timestamp cutoff, fallback to recent 1,000 records
  if (totalInWindow < 10) {
    totalInWindow = Math.min(1000, getCount());
    query = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as row_num
        FROM (SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 1000)
      )
      WHERE (row_num - 1) % ? = 0
      ORDER BY timestamp ASC
    `;
    queryParams = [];
  }

  const step = Math.max(1, Math.floor(totalInWindow / maxPoints));
  const rows = db.prepare(query).all(...queryParams, step);

  return rows.map(r => {
    const dt = new Date(r.timestamp);
    const dayStr = String(dt.getDate()).padStart(2, '0');
    const monthStr = String(dt.getMonth() + 1).padStart(2, '0');
    const hoursStr = String(dt.getHours()).padStart(2, '0');
    const minStr = String(dt.getMinutes()).padStart(2, '0');

    let displayLabel = r.time_str;
    if (timeframe === 'hour') displayLabel = `${hoursStr}:${minStr}`;
    else if (timeframe === 'day') displayLabel = `${dayStr}/${monthStr} ${hoursStr}:${minStr}`;
    else if (timeframe === 'week' || timeframe === 'month') displayLabel = `${dayStr}/${monthStr}`;
    else if (timeframe === 'year' || timeframe === 'all') displayLabel = `${monthStr}/${dt.getFullYear()}`;

    return {
      ...r,
      formattedDate: r.date_str,
      formattedTime: r.time_str,
      formattedDateTime: `${r.date_str} ${r.time_str}`,
      displayLabel,
    };
  });
}

export function getRecentSamples(limit = 100) {
  const rows = db.prepare('SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  rows.reverse();
  return rows.map(r => ({
    ...r,
    formattedDate: r.date_str,
    formattedTime: r.time_str,
    formattedDateTime: `${r.date_str} ${r.time_str}`,
  }));
}

export function getPaginatedLogs(page = 1, limit = 15, search = '', statusFilter = 'ALL') {
  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (date_str LIKE ? OR time_str LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (statusFilter !== 'ALL') {
    where += ' AND UPPER(status) = ?';
    params.push(statusFilter);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM sensor_logs ${where}`).get(...params);
  const totalRecords = countRow ? countRow.count : 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const offset = (page - 1) * limit;

  const rows = db.prepare(`
    SELECT * FROM sensor_logs
    ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const items = rows.map(r => ({
    ...r,
    formattedDate: r.date_str,
    formattedTime: r.time_str,
    formattedDateTime: `${r.date_str} ${r.time_str}`,
  }));

  return { page, limit, totalRecords, totalPages, items };
}

export default db;
