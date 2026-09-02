/**
 * Analytics and Data Processing Service for ESP32 Sensor Data
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
 * Filter and aggregate data based on selected time window.
 */
export function filterDataByTimeframe(data, timeframe) {
  if (!data || data.length === 0) return [];

  const now = data[data.length - 1].timestamp; // Use latest dataset timestamp as anchor

  switch (timeframe) {
    case 'hour': {
      // Last 24 hours of data
      const cutoff = now - 24 * 60 * 60 * 1000;
      return data.filter(d => d.timestamp >= cutoff);
    }
    case 'day': {
      // Last 7 days of data
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      return data.filter(d => d.timestamp >= cutoff);
    }
    case 'week': {
      // Last 4 weeks of data
      const cutoff = now - 28 * 24 * 60 * 60 * 1000;
      return data.filter(d => d.timestamp >= cutoff);
    }
    case 'month': {
      // Last 12 months of data
      const cutoff = now - 365 * 24 * 60 * 60 * 1000;
      return data.filter(d => d.timestamp >= cutoff);
    }
    case 'year': {
      return data;
    }
    case 'all':
    default:
      return data;
  }
}

/**
 * Aggregate high-density dataset for smooth chart rendering
 */
export function aggregateForChart(data, targetPointCount = 100) {
  if (!data || data.length <= targetPointCount) return data;

  const step = Math.ceil(data.length / targetPointCount);
  const aggregated = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    if (chunk.length === 0) continue;

    const avgTemp = chunk.reduce((sum, d) => sum + d.temp, 0) / chunk.length;
    const avgHum = chunk.reduce((sum, d) => sum + d.humidity, 0) / chunk.length;
    const avgMq2 = chunk.reduce((sum, d) => sum + d.mq2, 0) / chunk.length;
    const avgMq3 = chunk.reduce((sum, d) => sum + d.mq3, 0) / chunk.length;
    const avgMq4 = chunk.reduce((sum, d) => sum + d.mq4, 0) / chunk.length;

    const midPoint = chunk[Math.floor(chunk.length / 2)];

    aggregated.push({
      ...midPoint,
      temp: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHum * 10) / 10,
      mq2: Math.round(avgMq2),
      mq3: Math.round(avgMq3),
      mq4: Math.round(avgMq4),
    });
  }

  return aggregated;
}

/**
 * Calculate KPI summary metrics (Latest, Min, Max, Average, Trend %)
 */
export function calculateKPIs(data, thresholds = DEFAULT_THRESHOLDS) {
  if (!data || data.length === 0) {
    return null;
  }

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : latest;

  const calcStats = (key) => {
    const values = data.map(d => d[key]).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return { current: 0, avg: 0, min: 0, max: 0, trend: 0 };

    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const curr = latest[key];
    const prev = previous[key];
    const trend = prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

    return {
      current: curr,
      previous: prev,
      avg: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      trend: Math.round(trend * 10) / 10,
    };
  };

  return {
    temp: calcStats('temp'),
    humidity: calcStats('humidity'),
    mq2: calcStats('mq2'),
    mq3: calcStats('mq3'),
    mq4: calcStats('mq4'),
    latestTimestamp: latest.timestamp,
    latestDateTimeStr: latest.formattedDateTime,
    count: data.length,
  };
}

/**
 * Linear Regression algorithm for trend forecasting: y = m * x + c
 */
export function linearRegression(xArr, yArr) {
  const n = xArr.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xArr[i];
    sumY += yArr[i];
    sumXY += xArr[i] * yArr[i];
    sumXX += xArr[i] * xArr[i];
    sumYY += yArr[i] * yArr[i];
  }

  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Coefficient of determination R^2
  const numR2 = (n * sumXY - sumX * sumY);
  const denR2 = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const r2 = denR2 !== 0 ? Math.pow(numR2 / denR2, 2) : 0;

  return { slope, intercept, r2 };
}

/**
 * Generates future forecasts for Temperature, Humidity, and Gas levels.
 */
export function generateForecasts(data, thresholds = DEFAULT_THRESHOLDS) {
  if (!data || data.length < 5) return null;

  // Take recent sample window (up to 100 latest points) for high quality short-term prediction
  const sample = data.slice(-Math.min(data.length, 100));
  const startTime = sample[0].timestamp;
  const xArr = sample.map(d => (d.timestamp - startTime) / 1000); // seconds relative to start

  const tempReg = linearRegression(xArr, sample.map(d => d.temp));
  const mq2Reg = linearRegression(xArr, sample.map(d => d.mq2));
  const mq3Reg = linearRegression(xArr, sample.map(d => d.mq3));
  const mq4Reg = linearRegression(xArr, sample.map(d => d.mq4));
  const humReg = linearRegression(xArr, sample.map(d => d.humidity));

  const lastTimeSec = xArr[xArr.length - 1];

  const predictAt = (reg, hoursAhead) => {
    const futureSec = lastTimeSec + hoursAhead * 3600;
    const val = reg.slope * futureSec + reg.intercept;
    return Math.max(0, Math.round(val * 10) / 10);
  };

  const currentLatest = data[data.length - 1];

  const forecastPoints = [
    {
      timeLabel: 'Hiện tại',
      temp: currentLatest.temp,
      humidity: currentLatest.humidity,
      mq2: currentLatest.mq2,
      mq3: currentLatest.mq3,
      mq4: currentLatest.mq4,
      isPrediction: false,
    },
    {
      timeLabel: '+1h tới',
      temp: predictAt(tempReg, 1),
      humidity: Math.min(100, predictAt(humReg, 1)),
      mq2: predictAt(mq2Reg, 1),
      mq3: predictAt(mq3Reg, 1),
      mq4: predictAt(mq4Reg, 1),
      isPrediction: true,
    },
    {
      timeLabel: '+6h tới',
      temp: predictAt(tempReg, 6),
      humidity: Math.min(100, predictAt(humReg, 6)),
      mq2: predictAt(mq2Reg, 6),
      mq3: predictAt(mq3Reg, 6),
      mq4: predictAt(mq4Reg, 6),
      isPrediction: true,
    },
    {
      timeLabel: '+24h tới',
      temp: predictAt(tempReg, 24),
      humidity: Math.min(100, predictAt(humReg, 24)),
      mq2: predictAt(mq2Reg, 24),
      mq3: predictAt(mq3Reg, 24),
      mq4: predictAt(mq4Reg, 24),
      isPrediction: true,
    },
  ];

  // Evaluate risk based on forecasts
  const futureTempMax = Math.max(...forecastPoints.map(f => f.temp));
  const futureMq2Max = Math.max(...forecastPoints.map(f => f.mq2));

  let riskLevel = 'LOW';
  let riskMessage = 'Chỉ số dự báo ổn định trong 24 giờ tới.';

  if (futureMq2Max > thresholds.mq2Critical || futureTempMax > thresholds.tempHigh) {
    riskLevel = 'HIGH';
    riskMessage = 'CẢNH BÁO CAO: Dự báo nồng độ khí gas hoặc nhiệt độ có nguy cơ vượt ngưỡng nguy hiểm trong 24h tới!';
  } else if (futureMq2Max > thresholds.mq2Warning || futureTempMax > thresholds.tempWarning) {
    riskLevel = 'MEDIUM';
    riskMessage = 'LƯU Ý: Xu hướng nhiệt độ hoặc nồng độ khí có dấu hiệu gia tăng nhẹ.';
  }

  return {
    forecastPoints,
    tempTrendSlope: Math.round(tempReg.slope * 3600 * 100) / 100, // °C change per hour
    mq2TrendSlope: Math.round(mq2Reg.slope * 3600 * 10) / 10,     // Gas change per hour
    riskLevel,
    riskMessage,
  };
}

/**
 * Evaluates Overall Safety Score & Air Quality Assessment
 */
export function evaluateSafety(latest, thresholds = DEFAULT_THRESHOLDS) {
  if (!latest) {
    return {
      score: 100,
      statusText: 'Không có dữ liệu',
      statusColor: 'text-gray-400',
      warnings: [],
    };
  }

  let penalty = 0;
  const warnings = [];

  // Temp evaluation
  if (latest.temp > thresholds.tempHigh) {
    penalty += 30;
    warnings.push({
      type: 'danger',
      param: 'Nhiệt độ',
      message: `Nhiệt độ ${latest.temp}°C vượt quá ngưỡng an toàn (${thresholds.tempHigh}°C)! Nguy cơ quá nhiệt.`,
    });
  } else if (latest.temp > thresholds.tempWarning) {
    penalty += 15;
    warnings.push({
      type: 'warning',
      param: 'Nhiệt độ',
      message: `Nhiệt độ ${latest.temp}°C hơi cao so với mức tiêu chuẩn (${thresholds.tempWarning}°C).`,
    });
  }

  // Humidity evaluation
  if (latest.humidity > thresholds.humidityHigh) {
    penalty += 15;
    warnings.push({
      type: 'warning',
      param: 'Độ ẩm',
      message: `Độ ẩm ${latest.humidity}% quá cao. Nguy cơ ẩm mốc & đọng nước.`,
    });
  } else if (latest.humidity < thresholds.humidityLow) {
    penalty += 10;
    warnings.push({
      type: 'warning',
      param: 'Độ ẩm',
      message: `Độ ẩm ${latest.humidity}% quá thấp. Môi trường hanh khô.`,
    });
  }

  // MQ2 Gas Sensor (Smoke / LPG)
  if (latest.mq2 > thresholds.mq2Critical) {
    penalty += 45;
    warnings.push({
      type: 'danger',
      param: 'Cảm biến MQ2 (Khói/LPG)',
      message: `Phát hiện nồng độ Khói/Gas MQ2 = ${latest.mq2} ở mức CỰC KỲ NGUY HIỂM! Nguy cơ cháy nổ.`,
    });
  } else if (latest.mq2 > thresholds.mq2Warning) {
    penalty += 20;
    warnings.push({
      type: 'warning',
      param: 'Cảm biến MQ2',
      message: `Nồng độ Khói/Gas MQ2 = ${latest.mq2} vượt ngưỡng cảnh báo.`,
    });
  }

  // MQ3 Gas Sensor (Alcohol / Ethanol)
  if (latest.mq3 > thresholds.mq3Critical) {
    penalty += 35;
    warnings.push({
      type: 'danger',
      param: 'Cảm biến MQ3 (Cồn/Ethanol)',
      message: `Nồng độ Cồn MQ3 = ${latest.mq3} vượt mức cho phép!`,
    });
  } else if (latest.mq3 > thresholds.mq3Warning) {
    penalty += 15;
    warnings.push({
      type: 'warning',
      param: 'Cảm biến MQ3',
      message: `Nồng độ Cồn MQ3 = ${latest.mq3} có sự gia tăng bất thường.`,
    });
  }

  // MQ4 Gas Sensor (Methane / Natural Gas)
  if (latest.mq4 > thresholds.mq4Critical) {
    penalty += 35;
    warnings.push({
      type: 'danger',
      param: 'Cảm biến MQ4 (Methane)',
      message: `Nồng độ Methane MQ4 = ${latest.mq4} ở mức báo động!`,
    });
  } else if (latest.mq4 > thresholds.mq4Warning) {
    penalty += 15;
    warnings.push({
      type: 'warning',
      param: 'Cảm biến MQ4',
      message: `Nồng độ Methane MQ4 = ${latest.mq4} hơi cao.`,
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  let statusText = 'AN TOÀN TỐT';
  let statusColor = 'text-emerald-400';
  let statusBg = 'bg-emerald-500/10 border-emerald-500/30';

  if (score < 50) {
    statusText = 'CỰC KỲ NGUY HIỂM';
    statusColor = 'text-rose-400';
    statusBg = 'bg-rose-500/10 border-rose-500/30';
  } else if (score < 80) {
    statusText = 'CẢNH BÁO';
    statusColor = 'text-amber-400';
    statusBg = 'bg-amber-500/10 border-amber-500/30';
  }

  return {
    score,
    statusText,
    statusColor,
    statusBg,
    warnings,
  };
}
