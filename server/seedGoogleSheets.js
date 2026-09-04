import Papa from 'papaparse';
import { getCount, insertBatchLogs } from './db.js';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XaTMz_J3cPVx9b0DdlHxyjla8XZpNcH8Zq_lRRYc9R4/gviz/tq?tqx=out:csv&gid=1836015410';

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

export function getExportUrl(sheetUrl) {
  if (!sheetUrl) return DEFAULT_SHEET_URL;
  if (sheetUrl.includes('/gviz/tq?tqx=out:csv')) return sheetUrl;
  
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const id = match[1];
    let gid = '0';
    const gidMatch = sheetUrl.match(/[?&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }
  return sheetUrl;
}

export async function seedIfNeeded(sheetUrl = DEFAULT_SHEET_URL) {
  const currentCount = getCount();
  if (currentCount > 0) {
    console.log(`✅ [SQLite Database Ready]: Cơ sở dữ liệu đã có sẵn ${currentCount.toLocaleString('vi-VN')} bản ghi. Khởi động 0.001s!`);
    return currentCount;
  }

  console.log('---------------------------------------------------------');
  console.log('🔄 [Seed Database]: Phát hiện Database mới tạo.');
  console.log('⏳ Đang di dời (migrate) dữ liệu từ Google Sheets vào SQLite...');
  const startTime = Date.now();

  try {
    const targetUrl = getExportUrl(sheetUrl);
    const res = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { skipEmptyLines: true });
    const rows = parsed.data;

    if (!rows || rows.length === 0) return 0;

    let headerIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const rowStr = rows[i].join(' ').toLowerCase();
      if ((rowStr.includes('date') || rowStr.includes('ngày')) && 
          (rowStr.includes('temperature') || rowStr.includes('temp') || rowStr.includes('nhiệt độ'))) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex === -1) headerIndex = 0;

    const headers = rows[headerIndex].map(h => String(h).trim().toLowerCase());
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('ngày'));
    const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('giờ'));
    const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('trạng thái'));
    const tempIdx = headers.findIndex(h => h.includes('temp') || h.includes('nhiệt'));
    const humIdx = headers.findIndex(h => h.includes('hum') || h.includes('ẩm'));
    const mq2Idx = headers.findIndex(h => h.includes('mq2'));
    const mq3Idx = headers.findIndex(h => h.includes('mq3'));
    const mq4Idx = headers.findIndex(h => h.includes('mq4'));
    const gasIndexIdx = headers.findIndex(h => h.includes('gas_index') && !h.includes('pct') && !h.includes('predict'));
    const gasPctIdx = headers.findIndex(h => h.includes('pct') || h.includes('change'));
    const predGasIdx = headers.findIndex(h => h.includes('predicted_gas_index') || (h.includes('predict') && h.includes('gas')));
    const currentLevelIdx = headers.findIndex(h => h.includes('current_level') || (h.includes('current') && h.includes('level')));
    const predictedLevelIdx = headers.findIndex(h => h.includes('predicted_level') || (h.includes('predict') && h.includes('level')));

    const records = [];
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const dateStr = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
      const timeStr = timeIdx !== -1 ? String(row[timeIdx] || '').trim() : '';
      if (!dateStr && !timeStr) continue;

      const temp = parseFloat(row[tempIdx]);
      const hum = parseFloat(row[humIdx]);
      const mq2 = parseFloat(row[mq2Idx]);
      const mq3 = parseFloat(row[mq3Idx]);
      const mq4 = parseFloat(row[mq4Idx]);
      const gasIndex = gasIndexIdx !== -1 ? parseFloat(row[gasIndexIdx]) : 0;
      const gasIndexPct = gasPctIdx !== -1 ? parseFloat(row[gasPctIdx]) : 0;
      const predGasIndex = predGasIdx !== -1 ? parseFloat(row[predGasIdx]) : 0;
      const currentLevel = currentLevelIdx !== -1 ? String(row[currentLevelIdx] || 'L0').trim() : 'L0';
      const predictedLevel = predictedLevelIdx !== -1 ? String(row[predictedLevelIdx] || 'L0').trim() : 'L0';

      if (isNaN(temp) && isNaN(hum) && isNaN(mq2) && isNaN(gasIndex)) continue;

      const dt = parseDateTime(dateStr, timeStr);

      records.push({
        timestamp: dt.getTime(),
        rawDate: dateStr,
        rawTime: timeStr,
        formattedDate: dateStr,
        formattedTime: timeStr,
        status: statusIdx !== -1 ? String(row[statusIdx] || 'Success').trim() : 'Success',
        temp: isNaN(temp) ? 0 : Math.round(temp * 10) / 10,
        humidity: isNaN(hum) ? 0 : Math.round(hum * 10) / 10,
        mq2: isNaN(mq2) ? 0 : Math.round(mq2),
        mq3: isNaN(mq3) ? 0 : Math.round(mq3),
        mq4: isNaN(mq4) ? 0 : Math.round(mq4),
        gas_index: isNaN(gasIndex) ? 0 : Math.round(gasIndex * 10000) / 10000,
        gas_index_pct: isNaN(gasIndexPct) ? 0 : Math.round(gasIndexPct * 100) / 100,
        predicted_gas_index: isNaN(predGasIndex) ? 0 : Math.round(predGasIndex * 10000) / 10000,
        current_level: currentLevel,
        predicted_level: predictedLevel,
      });
    }

    records.sort((a, b) => a.timestamp - b.timestamp);
    const count = insertBatchLogs(records);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ [Seed Success]: Đã chèn ${count.toLocaleString('vi-VN')} bản ghi vào SQLite trong ${durationSec}s!`);
    console.log('---------------------------------------------------------');
    return count;
  } catch (err) {
    console.error('❌ [Seed Migration Error]:', err.message);
    return 0;
  }
}
