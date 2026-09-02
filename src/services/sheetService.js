import Papa from 'papaparse';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1kzYAxH2W3ia5sU__4ycZNgGVxvj1bSBiXHULtjBmhQo/export?format=csv&gid=0';

/**
 * Converts a Google Sheet shareable link to a CSV export URL.
 */
export function getExportUrl(sheetUrl) {
  if (!sheetUrl) return DEFAULT_SHEET_URL;
  if (sheetUrl.includes('/export?format=csv')) return sheetUrl;
  
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const id = match[1];
    let gid = '0';
    const gidMatch = sheetUrl.match(/[?&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }
  return sheetUrl;
}

/**
 * Parses date string in formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
 * combined with HH:mm:ss time string.
 */
export function parseDateTime(dateStr, timeStr) {
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
 * Fetches CSV text via local Vite Proxy or Fallback CORS proxies to prevent CORS blocks.
 */
async function fetchCSVText(customUrl) {
  const csvUrl = getExportUrl(customUrl);
  const timestamp = Date.now();
  
  // Strategy 1: Use Vite local proxy (/api/gsheet)
  try {
    const proxyUrl = `/api/gsheet?url=${encodeURIComponent(csvUrl)}&_t=${timestamp}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 50) return text;
    }
  } catch (e) {
    console.warn('Local proxy fetch failed/timed out, trying CORS proxies...', e);
  }

  // Strategy 2: Use Public CORS proxy (allorigins)
  try {
    const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}&_t=${timestamp}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(corsUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 50) return text;
    }
  } catch (e) {
    console.warn('AllOrigins proxy failed, trying direct...', e);
  }

  // Strategy 3: Direct fetch
  const directUrl = `${csvUrl}${csvUrl.includes('?') ? '&' : '?'}_t=${timestamp}`;
  const res = await fetch(directUrl);
  if (!res.ok) {
    throw new Error(`Không thể kết nối Google Sheets (HTTP ${res.status}): ${res.statusText}`);
  }
  return await res.text();
}

/**
 * Optimizes huge CSVs by extracting header + last 500KB tail (latest ~5,000 real-time records).
 */
function optimizeCSVText(rawText) {
  if (!rawText || rawText.length < 500000) return rawText;

  // Extract top 1,500 chars (contains header row)
  const topSlice = rawText.slice(0, 1500);
  const topLines = topSlice.split('\n');
  
  // Keep first 15 lines from top (headers)
  const headerText = topLines.slice(0, 15).join('\n');

  // Take the last 400,000 characters (latest real-time records appended by ESP32)
  const tailText = rawText.slice(-400000);
  const tailLines = tailText.split('\n');
  
  // Drop first incomplete line of tail
  const cleanTail = tailLines.slice(1).join('\n');

  return `${headerText}\n${cleanTail}`;
}

/**
 * Fetches CSV data from Google Sheet export link, cleans and parses it.
 */
export async function fetchSheetData(customUrl = DEFAULT_SHEET_URL) {
  const rawCsvText = await fetchCSVText(customUrl);
  
  // Fast tail slice to keep browser ultra responsive
  const csvText = optimizeCSVText(rawCsvText);
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            return resolve([]);
          }

          // Locate header row containing 'Date' & 'Temperature'
          let headerIndex = -1;
          for (let i = 0; i < Math.min(rows.length, 25); i++) {
            const rowStr = rows[i].join(' ').toLowerCase();
            if ((rowStr.includes('date') || rowStr.includes('ngày')) && 
                (rowStr.includes('temperature') || rowStr.includes('temp') || rowStr.includes('nhiệt độ'))) {
              headerIndex = i;
              break;
            }
          }

          if (headerIndex === -1) {
            headerIndex = 0;
          }

          const headers = rows[headerIndex].map(h => String(h).trim().toLowerCase());
          
          const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('ngày'));
          const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('giờ'));
          const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('trạng thái'));
          const tempIdx = headers.findIndex(h => h.includes('temp') || h.includes('nhiệt'));
          const humIdx = headers.findIndex(h => h.includes('hum') || h.includes('ẩm'));
          const mq2Idx = headers.findIndex(h => h.includes('mq2') || h.includes('mq-2'));
          const mq3Idx = headers.findIndex(h => h.includes('mq3') || h.includes('mq-3'));
          const mq4Idx = headers.findIndex(h => h.includes('mq4') || h.includes('mq-4'));

          const cleanData = [];

          for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 4) continue;

            const dateStr = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
            const timeStr = timeIdx !== -1 ? String(row[timeIdx] || '').trim() : '';

            if (!dateStr && !timeStr) continue;

            const temp = parseFloat(row[tempIdx]);
            const hum = parseFloat(row[humIdx]);
            const mq2 = parseFloat(row[mq2Idx]);
            const mq3 = parseFloat(row[mq3Idx]);
            const mq4 = parseFloat(row[mq4Idx]);

            if (isNaN(temp) && isNaN(hum) && isNaN(mq2)) continue;

            const dt = parseDateTime(dateStr, timeStr);

            cleanData.push({
              id: cleanData.length + 1,
              rawDate: dateStr,
              rawTime: timeStr,
              timestamp: dt.getTime(),
              dateObj: dt,
              formattedDate: dt.toLocaleDateString('vi-VN'),
              formattedTime: dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              formattedDateTime: `${dt.toLocaleDateString('vi-VN')} ${dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
              status: statusIdx !== -1 ? String(row[statusIdx] || 'Success').trim() : 'Success',
              temp: isNaN(temp) ? 0 : Math.round(temp * 10) / 10,
              humidity: isNaN(hum) ? 0 : Math.round(hum * 10) / 10,
              mq2: isNaN(mq2) ? 0 : Math.round(mq2),
              mq3: isNaN(mq3) ? 0 : Math.round(mq3),
              mq4: isNaN(mq4) ? 0 : Math.round(mq4),
            });
          }

          cleanData.sort((a, b) => a.timestamp - b.timestamp);

          resolve(cleanData);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}
