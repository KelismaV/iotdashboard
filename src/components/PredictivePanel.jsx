import React from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { generateForecasts } from '../services/analyticsService';

export default function PredictivePanel({ data, thresholds }) {
  const forecasts = generateForecasts(data, thresholds);

  if (!forecasts) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-sm">
        <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-pulse" />
        Đang thu thập đủ mẫu dữ liệu (tối thiểu 5 bản ghi) để tính toán dự đoán AI...
      </div>
    );
  }

  const { forecastPoints, tempTrendSlope, mq2TrendSlope, riskLevel, riskMessage } = forecasts;

  const current = forecastPoints[0];
  const f1h = forecastPoints[1];
  const f6h = forecastPoints[2];
  const f24h = forecastPoints[3];

  const renderTrendBadge = (currVal, futureVal, unit = '') => {
    const diff = Math.round((futureVal - currVal) * 10) / 10;
    if (diff > 0.2) {
      return (
        <span className="flex items-center text-[11px] font-semibold text-rose-400">
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          +{diff} {unit}
        </span>
      );
    }
    if (diff < -0.2) {
      return (
        <span className="flex items-center text-[11px] font-semibold text-emerald-400">
          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
          {diff} {unit}
        </span>
      );
    }
    return (
      <span className="flex items-center text-[11px] font-semibold text-slate-400">
        <Minus className="w-3.5 h-3.5 mr-0.5" />
        Ổn định
      </span>
    );
  };

  return (
    <div className="space-y-6 mb-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Mô Hình Dự Đoán Xu Hướng Tương Lai (AI Forecast)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Linear Regression & EWMA</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dự báo chỉ số Nhiệt độ, Độ ẩm & Khí gas trong 1h, 6h và 24h tới dựa trên chuỗi thời gian ESP32
              </p>
            </div>
          </div>

          {/* Risk Badge */}
          <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
            riskLevel === 'HIGH'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
              : riskLevel === 'MEDIUM'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            {riskLevel === 'HIGH' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{riskMessage}</span>
          </div>
        </div>
      </div>

      {/* Forecast Cards Grid (+1h, +6h, +24h) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* +1 Hour Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-bl-xl text-[10px] font-bold border-l border-b border-cyan-500/30">
            Dự Báo +1 Giờ
          </div>

          <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Tốc Độ Tải Ngắn Hạn (+1h)
          </h4>

          <div className="space-y-3">
            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nhiệt độ dự kiến</p>
                <p className="text-lg font-extrabold text-amber-400">{f1h.temp}°C</p>
              </div>
              {renderTrendBadge(current.temp, f1h.temp, '°C')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">MQ2 (Khói/Gas)</p>
                <p className="text-lg font-extrabold text-rose-400">{f1h.mq2} PPM</p>
              </div>
              {renderTrendBadge(current.mq2, f1h.mq2, 'PPM')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Độ ẩm dự kiến</p>
                <p className="text-lg font-extrabold text-cyan-400">{f1h.humidity}%</p>
              </div>
              {renderTrendBadge(current.humidity, f1h.humidity, '%')}
            </div>
          </div>
        </div>

        {/* +6 Hours Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-bl-xl text-[10px] font-bold border-l border-b border-indigo-500/30">
            Dự Báo +6 Giờ
          </div>

          <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Xu Hướng Trung Hạn (+6h)
          </h4>

          <div className="space-y-3">
            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nhiệt độ dự kiến</p>
                <p className="text-lg font-extrabold text-amber-400">{f6h.temp}°C</p>
              </div>
              {renderTrendBadge(current.temp, f6h.temp, '°C')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">MQ2 (Khói/Gas)</p>
                <p className="text-lg font-extrabold text-rose-400">{f6h.mq2} PPM</p>
              </div>
              {renderTrendBadge(current.mq2, f6h.mq2, 'PPM')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Độ ẩm dự kiến</p>
                <p className="text-lg font-extrabold text-cyan-400">{f6h.humidity}%</p>
              </div>
              {renderTrendBadge(current.humidity, f6h.humidity, '%')}
            </div>
          </div>
        </div>

        {/* +24 Hours Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-bl-xl text-[10px] font-bold border-l border-b border-purple-500/30">
            Dự Báo +24 Giờ
          </div>

          <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Dự Báo Dài Hạn (+24h)
          </h4>

          <div className="space-y-3">
            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nhiệt độ dự kiến</p>
                <p className="text-lg font-extrabold text-amber-400">{f24h.temp}°C</p>
              </div>
              {renderTrendBadge(current.temp, f24h.temp, '°C')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">MQ2 (Khói/Gas)</p>
                <p className="text-lg font-extrabold text-rose-400">{f24h.mq2} PPM</p>
              </div>
              {renderTrendBadge(current.mq2, f24h.mq2, 'PPM')}
            </div>

            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Độ ẩm dự kiến</p>
                <p className="text-lg font-extrabold text-cyan-400">{f24h.humidity}%</p>
              </div>
              {renderTrendBadge(current.humidity, f24h.humidity, '%')}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Forecast Line Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Đường Tiệm Cận Dự Báo Tương Lai (Forecast Projection)
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            Tốc độ biến thiên nhiệt: <strong className="text-amber-400">{tempTrendSlope} °C/h</strong>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <ReferenceLine y={thresholds.tempWarning} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ngưỡng nhiệt cảnh báo', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="temp" name="Nhiệt độ dự báo (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="mq2" name="MQ2 dự báo (PPM)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
