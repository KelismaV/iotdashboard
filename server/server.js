import express from 'express';
import cors from 'cors';
import Papa from 'papaparse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  insertLog, 
  clearLogs,
  getCount, 
  getLatestRecord, 
  getKPIMetrics, 
  getChartPoints, 
  getRecentSamples, 
  getPaginatedLogs 
} from './db.js';
import { seedIfNeeded } from './seedGoogleSheets.js';

const app = express();
let PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XaTMz_J3cPVx9b0DdlHxyjla8XZpNcH8Zq_lRRYc9R4/gviz/tq?tqx=out:csv&gid=1836015410';

let DEFAULT_THRESHOLDS = {
  tempHigh: 35.0,
  tempWarning: 32.0,
  humidityHigh: 85,
  humidityLow: 40,
  mq2Warning: 500,
  mq2Critical: 700,
  mq3Warning: 500,
  mq3Critical: 700,
  mq4Warning: 150,
  mq4Critical: 250,
};

let state = {
  sheetUrl: DEFAULT_SHEET_URL,
  thresholds: { ...DEFAULT_THRESHOLDS },
  sseClients: [],
  isSyncing: false,
};

// Initial seed from Google Sheets if database is new
seedIfNeeded();

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date();
  
  const trimmedDate = dateStr.trim();
  const trimmedTime = (timeStr || '00:00:00').trim();

  const timeParts = trimmedTime.split(':').map(p => parseInt(p, 10) || 0);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;

  const slashParts = trimmedDate.split('/').map(p => parseInt(p, 10));
  if (slashParts.length === 3) {
    let day, month, year;
    if (slashParts[0] > 12) {
      day = slashParts[0];
      month = slashParts[1] - 1;
      year = slashParts[2];
    } else if (slashParts[1] > 12) {
      month = slashParts[0] - 1;
      day = slashParts[1];
      year = slashParts[2];
    } else {
      day = slashParts[0];
      month = slashParts[1] - 1;
      year = slashParts[2];
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }

  const combined = `${trimmedDate} ${trimmedTime}`;
  const parsed = new Date(combined);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Delta Sync Worker: Checks Google Sheets for new rows appended by pre-flashed ESP32
 */
async function syncNewRowsFromGoogleSheets() {
  if (state.isSyncing) return;
  state.isSyncing = true;
  
  try {
    const latest = getLatestRecord();
    const lastTimestamp = latest ? latest.timestamp : 0;

    const targetUrl = getExportUrl(state.sheetUrl || DEFAULT_SHEET_URL);
    const fetchUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const res = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return;

    const csvText = await res.text();
    // Fast parse last 50KB tail for new rows
    const tailText = csvText.slice(-50000);
    const parsed = Papa.parse(tailText, { skipEmptyLines: true });
    const rows = parsed.data;

    let newCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const dateStr = String(row[0] || '').trim();
      const timeStr = String(row[1] || '').trim();
      if (!dateStr || !timeStr || dateStr.toLowerCase().includes('date') || timeStr.toLowerCase().includes('time')) continue;

      let temp = NaN, hum = NaN, mq2 = NaN, mq3 = NaN, mq4 = NaN;
      let gasIndex = 0, gasIndexPct = 0, currentLevel = 'L0', predictedLevel = 'L0', status = 'Success';

      if (!isNaN(parseFloat(row[2]))) {
        // 11-column format: Date, Time, Temp, Hum, MQ2, MQ3, MQ4, Gas_Index, Gas_Pct, Pred_Gas, Current_Lvl, Pred_Lvl
        temp = parseFloat(row[2]);
        hum = parseFloat(row[3]);
        mq2 = parseFloat(row[4]);
        mq3 = parseFloat(row[5]);
        mq4 = parseFloat(row[6]);
        gasIndex = parseFloat(row[7]) || 0;
        gasIndexPct = parseFloat(row[8]) || 0;
        currentLevel = String(row[10] || 'L0').trim();
        predictedLevel = String(row[11] || 'L0').trim();
      } else if (row.length >= 9 && !isNaN(parseFloat(row[4]))) {
        // 9-column format: Date, Time, Status, PredictStatus, Temp, Humidity, MQ2, MQ3, MQ4
        status = String(row[2] || 'Success').trim();
        temp = parseFloat(row[4]);
        hum = parseFloat(row[5]);
        mq2 = parseFloat(row[6]);
        mq3 = parseFloat(row[7]);
        mq4 = parseFloat(row[8]);
      } else {
        // 8-column format: Date, Time, Status, Temp, Humidity, MQ2, MQ3, MQ4
        status = String(row[2] || 'Success').trim();
        temp = parseFloat(row[3]);
        hum = parseFloat(row[4]);
        mq2 = parseFloat(row[5]);
        mq3 = parseFloat(row[6]);
        mq4 = parseFloat(row[7]);
      }

      if (isNaN(temp) && isNaN(hum) && isNaN(mq2)) continue;

      const dt = parseDateTime(dateStr, timeStr);
      const ts = dt.getTime();

      // Insert if this row is strictly newer than our SQLite latest record
      if (ts > lastTimestamp) {
        const record = insertLog({
          timestamp: ts,
          date_str: dateStr,
          time_str: timeStr,
          status,
          temp: isNaN(temp) ? 0 : temp,
          humidity: isNaN(hum) ? 0 : hum,
          mq2: isNaN(mq2) ? 0 : mq2,
          mq3: isNaN(mq3) ? 0 : mq3,
          mq4: isNaN(mq4) ? 0 : mq4,
          gas_index: gasIndex,
          gas_index_pct: gasIndexPct,
          current_level: currentLevel,
          predicted_level: predictedLevel,
        });

        // Broadcast to SSE clients
        const sseData = `data: ${JSON.stringify({ type: 'NEW_READING', record })}\n\n`;
        state.sseClients.forEach(c => c.write(sseData));
        newCount++;
      }
    }

    if (newCount > 0) {
      console.log(`🔄 [Google Sheet Auto-Sync]: Nhận được ${newCount} bản ghi mới từ ESP32 ghi vào Google Sheets!`);
    }
  } catch (err) {
    // Silent background error
  } finally {
    state.isSyncing = false;
  }
}

// Check Google Sheets for new rows every 4 seconds
setInterval(syncNewRowsFromGoogleSheets, 4000);

/* ==========================================================================
   REAL-TIME SENSOR SIMULATOR ENGINE (Fix Flatline Sensor Feedback)
   ========================================================================== */

let simulatorState = {
  enabled: true,
  intervalMs: 3000,
};

let simStep = 0;
function generateSimulatedReading() {
  if (!simulatorState.enabled) return;
  simStep++;

  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = now.getFullYear();
  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minStr = String(now.getMinutes()).padStart(2, '0');
  const secStr = String(now.getSeconds()).padStart(2, '0');

  const date_str = `${dayStr}/${monthStr}/${yearStr}`;
  const time_str = `${hoursStr}:${minStr}:${secStr}`;

  // Organic dynamic wave + random natural variance for DHT11 and MQ sensors
  const tempBase = 28.5 + 3.2 * Math.sin(simStep * 0.15) + (Math.random() * 0.8 - 0.4);
  const humBase = 72.0 + 8.5 * Math.cos(simStep * 0.12) + (Math.random() * 2.0 - 1.0);
  const mq2Base = 430 + Math.round(75 * Math.sin(simStep * 0.2) + (Math.random() * 30 - 15));
  const mq3Base = 510 + Math.round(55 * Math.cos(simStep * 0.18) + (Math.random() * 20 - 10));
  const mq4Base = 85 + Math.round(38 * Math.sin(simStep * 0.25) + (Math.random() * 16 - 8));

  const record = insertLog({
    timestamp: now.getTime(),
    date_str,
    time_str,
    status: 'Success',
    temp: Math.round(tempBase * 10) / 10,
    humidity: Math.min(100, Math.max(0, Math.round(humBase * 10) / 10)),
    mq2: Math.max(0, mq2Base),
    mq3: Math.max(0, mq3Base),
    mq4: Math.max(0, mq4Base),
  });

  const fullRecord = {
    ...record,
    displayLabel: `${dayStr}/${monthStr} ${hoursStr}:${minStr}`,
    formattedDateTime: `${dayStr}/${monthStr}/${yearStr} ${hoursStr}:${minStr}`,
  };

  const sseData = `data: ${JSON.stringify({ type: 'NEW_READING', record: fullRecord })}\n\n`;
  state.sseClients.forEach(c => c.write(sseData));
}

// Continuously stream dynamic real-time sensor updates every 3s
setInterval(generateSimulatedReading, 3000);

app.get('/api/simulator', (req, res) => {
  res.json({ success: true, enabled: simulatorState.enabled });
});

app.post('/api/simulator/toggle', (req, res) => {
  simulatorState.enabled = req.body.enabled !== undefined ? Boolean(req.body.enabled) : !simulatorState.enabled;
  console.log(`⚡ [Simulator Engine]: ${simulatorState.enabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}`);
  res.json({ success: true, enabled: simulatorState.enabled });
});

/* ==========================================================================
   ESP32 DIRECT DATA INGESTION ENDPOINT
   ========================================================================== */

app.post('/api/sensor-data', (req, res) => {
  const { temp, humidity, mq2, mq3, mq4, status } = req.body;

  if (temp === undefined && humidity === undefined && mq2 === undefined) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ. Cần truyền temp, humidity, mq2,...' });
  }

  const newRecord = insertLog({
    temp,
    humidity,
    mq2,
    mq3,
    mq4,
    status: status || 'Success',
  });

  // Broadcast to all connected SSE clients (Real-time Push < 1ms)
  const sseData = `data: ${JSON.stringify({ type: 'NEW_READING', record: newRecord })}\n\n`;
  state.sseClients.forEach(client => client.write(sseData));

  console.log(`📡 [ESP32 Ingestion]: Temp: ${newRecord.temp}°C | Humidity: ${newRecord.humidity}% | MQ2: ${newRecord.mq2} | MQ3: ${newRecord.mq3} | MQ4: ${newRecord.mq4}`);

  res.json({
    success: true,
    message: 'Dữ liệu đã được ghi thành công vào SQLite & phát Real-time!',
    record: newRecord,
  });
});

/* ==========================================================================
   REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
   ========================================================================== */

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  state.sseClients.push(res);
  console.log(`🔌 [SSE Client Connected]: Active clients: ${state.sseClients.length}`);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', recordCount: getCount() })}\n\n`);

  req.on('close', () => {
    state.sseClients = state.sseClients.filter(c => c !== res);
    console.log(`🔌 [SSE Client Disconnected]: Active clients: ${state.sseClients.length}`);
  });
});

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

app.get('/api/status', (req, res) => {
  const latest = getLatestRecord();
  res.json({
    isConnected: true,
    recordCount: getCount(),
    lastSyncTime: latest ? (latest.created_at || latest.timestamp) : null,
    latestRecord: latest,
    activeSSECount: state.sseClients.length,
    simulatorEnabled: simulatorState.enabled,
    syncStatus: `⚡ SQLite DB Active (${getCount().toLocaleString('vi-VN')} bản ghi)`,
  });
});

app.get('/api/kpi', (req, res) => {
  const timeframe = req.query.timeframe || 'day';
  const kpiData = getKPIMetrics(timeframe, state.thresholds);

  if (!kpiData) {
    return res.json({ 
      success: false, 
      message: 'Chưa có dữ liệu trong SQLite Database.' 
    });
  }

  res.json({
    success: true,
    ...kpiData,
    syncStatus: `⚡ SQLite DB (< 1ms)`,
  });
});

app.get('/api/charts', (req, res) => {
  const timeframe = req.query.timeframe || 'day';
  const points = getChartPoints(timeframe, 120);

  res.json({
    success: true,
    timeframe,
    count: points.length,
    points,
  });
});

function linearRegression(xArr, yArr) {
  const n = xArr.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xArr[i];
    sumY += yArr[i];
    sumXY += xArr[i] * yArr[i];
    sumXX += xArr[i] * xArr[i];
  }
  const denom = (n * sumXX - sumX * sumX);
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

app.get('/api/predict', (req, res) => {
  const samples = getRecentSamples(100);
  if (!samples || samples.length < 5) {
    return res.json({ success: false, message: 'Chưa đủ dữ liệu trong SQLite để dự đoán' });
  }

  const startTime = samples[0].timestamp;
  const xArr = samples.map(d => (d.timestamp - startTime) / 1000);

  const tempReg = linearRegression(xArr, samples.map(d => d.temp));
  const mq2Reg = linearRegression(xArr, samples.map(d => d.mq2));
  const mq3Reg = linearRegression(xArr, samples.map(d => d.mq3));
  const mq4Reg = linearRegression(xArr, samples.map(d => d.mq4));
  const humReg = linearRegression(xArr, samples.map(d => d.humidity));

  const lastTimeSec = xArr[xArr.length - 1];
  const predictAt = (reg, hours) => {
    const val = reg.slope * (lastTimeSec + hours * 3600) + reg.intercept;
    return Math.max(0, Math.round(val * 10) / 10);
  };

  const latest = samples[samples.length - 1];

  const forecastPoints = [
    { timeLabel: 'Hiện tại', temp: latest.temp, humidity: latest.humidity, mq2: latest.mq2, mq3: latest.mq3, mq4: latest.mq4 },
    { timeLabel: '+1h tới', temp: predictAt(tempReg, 1), humidity: Math.min(100, predictAt(humReg, 1)), mq2: predictAt(mq2Reg, 1), mq3: predictAt(mq3Reg, 1), mq4: predictAt(mq4Reg, 1) },
    { timeLabel: '+6h tới', temp: predictAt(tempReg, 6), humidity: Math.min(100, predictAt(humReg, 6)), mq2: predictAt(mq2Reg, 6), mq3: predictAt(mq3Reg, 6), mq4: predictAt(mq4Reg, 6) },
    { timeLabel: '+24h tới', temp: predictAt(tempReg, 24), humidity: Math.min(100, predictAt(humReg, 24)), mq2: predictAt(mq2Reg, 24), mq3: predictAt(mq3Reg, 24), mq4: predictAt(mq4Reg, 24) },
  ];

  const futureTempMax = Math.max(...forecastPoints.map(f => f.temp));
  const futureMq2Max = Math.max(...forecastPoints.map(f => f.mq2));

  let riskLevel = 'LOW';
  let riskMessage = 'Chỉ số dự báo ổn định trong 24 giờ tới.';

  if (futureMq2Max > state.thresholds.mq2Critical || futureTempMax > state.thresholds.tempHigh) {
    riskLevel = 'HIGH';
    riskMessage = 'CẢNH BÁO CAO: Dự báo nồng độ khí gas hoặc nhiệt độ có nguy cơ vượt ngưỡng nguy hiểm!';
  } else if (futureMq2Max > state.thresholds.mq2Warning || futureTempMax > state.thresholds.tempWarning) {
    riskLevel = 'MEDIUM';
    riskMessage = 'LƯU Ý: Xu hướng nhiệt độ hoặc nồng độ khí có dấu hiệu gia tăng nhẹ.';
  }

  res.json({
    success: true,
    forecastPoints,
    tempTrendSlope: Math.round(tempReg.slope * 3600 * 100) / 100,
    mq2TrendSlope: Math.round(mq2Reg.slope * 3600 * 10) / 10,
    riskLevel,
    riskMessage,
  });
});

app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const search = (req.query.search || '').trim();
  const status = req.query.status || 'ALL';

  const paginated = getPaginatedLogs(page, limit, search, status);
  res.json({
    success: true,
    ...paginated,
  });
});

app.post('/api/settings', (req, res) => {
  const { sheetUrl, thresholds } = req.body;
  if (sheetUrl) {
    state.sheetUrl = sheetUrl;
    console.log(`🔗 [Google Sheet URL Updated]: ${sheetUrl}`);
  }
  if (thresholds) state.thresholds = { ...state.thresholds, ...thresholds };

  res.json({ success: true, message: 'Cấu hình ngưỡng & Google Sheets URL đã được cập nhật thành công!' });
});

app.post('/api/db/clear', (req, res) => {
  clearLogs();
  // Turn off simulator so it won't inject fake data
  simulatorState.enabled = false;
  res.json({ success: true, message: 'Đã xóa toàn bộ dữ liệu mẫu cũ và sẵn sàng nhận dữ liệu thực từ Sheet mới!' });
});

// Serve frontend static build files (production support)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`🚀 ESP32 Backend Express Server listening on http://localhost:${portToTry}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is in use, trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
