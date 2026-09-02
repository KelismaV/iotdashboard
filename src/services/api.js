/**
 * Frontend API client communicating via Vite Proxy (/api) to Express Backend & SQLite DB
 */

const API_BASE = '/api';

export async function fetchServerStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Không thể kết nối đến Express Backend');
  return await res.json();
}

export async function fetchKPIMetrics(timeframe = 'day') {
  const res = await fetch(`${API_BASE}/kpi?timeframe=${timeframe}`);
  if (!res.ok) throw new Error('Lỗi lấy chỉ số KPI từ SQLite');
  return await res.json();
}

export async function fetchChartData(timeframe = 'day') {
  const res = await fetch(`${API_BASE}/charts?timeframe=${timeframe}`);
  if (!res.ok) throw new Error('Lỗi lấy dữ liệu biểu đồ từ SQLite');
  return await res.json();
}

export async function fetchForecasts() {
  const res = await fetch(`${API_BASE}/predict`);
  if (!res.ok) throw new Error('Lỗi lấy dự đoán AI');
  return await res.json();
}

export async function fetchTableData(page = 1, limit = 15, search = '', status = 'ALL') {
  const params = new URLSearchParams({ page, limit, search, status });
  const res = await fetch(`${API_BASE}/data?${params.toString()}`);
  if (!res.ok) throw new Error('Lỗi lấy nhật ký từ SQLite');
  return await res.json();
}

export async function updateServerSettings(sheetUrl, thresholds) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrl, thresholds }),
  });
  if (!res.ok) throw new Error('Lỗi lưu cài đặt');
  return await res.json();
}

/**
 * Subscribe to Real-Time Server-Sent Events (SSE) Stream
 */
export function subscribeToSensorStream(onNewData, onError) {
  const eventSource = new EventSource(`${API_BASE}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onNewData) onNewData(data);
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE connection error:', err);
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
