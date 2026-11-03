/**
 * Analytics and Data Downsampling Service for ESP32 Sensor Data
 */

export const DEFAULT_THRESHOLDS = {
  tempHigh: 35.0,    // °C
  tempWarning: 32.0, // °C
  humidityHigh: 85,  // %
  humidityLow: 40,   // %
  mq2Warning: 500,   // Smoke/LPG
  mq2Critical: 700,
  mq3Warning: 500,   // Alcohol
  mq3Critical: 700,
  mq4Warning: 150,   // Methane
  mq4Critical: 250,
};

/**
 * Downsample / aggregate high-density dataset for smooth chart rendering (History mode)
 */
export function aggregateForChart(data, targetPointCount = 120) {
  if (!data || data.length <= targetPointCount) return data;

  const step = Math.ceil(data.length / targetPointCount);
  const aggregated = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    if (chunk.length === 0) continue;

    const avgTemp = chunk.reduce((sum, d) => sum + (d.temp || 0), 0) / chunk.length;
    const avgHum = chunk.reduce((sum, d) => sum + (d.humidity || 0), 0) / chunk.length;
    const avgMq2 = chunk.reduce((sum, d) => sum + (d.mq2 || 0), 0) / chunk.length;
    const avgMq3 = chunk.reduce((sum, d) => sum + (d.mq3 || 0), 0) / chunk.length;
    const avgMq4 = chunk.reduce((sum, d) => sum + (d.mq4 || 0), 0) / chunk.length;
    const avgGasIdx = chunk.reduce((sum, d) => sum + (d.gas_index || 0), 0) / chunk.length;

    const midPoint = chunk[Math.floor(chunk.length / 2)];

    aggregated.push({
      ...midPoint,
      temp: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHum * 10) / 10,
      mq2: Math.round(avgMq2),
      mq3: Math.round(avgMq3),
      mq4: Math.round(avgMq4),
      gas_index: Math.round(avgGasIdx * 10000) / 10000,
    });
  }

  return aggregated;
}
