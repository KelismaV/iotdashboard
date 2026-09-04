import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Thermometer, Flame, BarChart3, Activity, Layers } from 'lucide-react';
import { aggregateForChart } from '../services/analyticsService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullTime = payload[0]?.payload?.formattedDateTime || label;
    return (
      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-2">
          <span>🕒 {fullTime}</span>
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-bold text-slate-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ data, thresholds }) {
  // Mode: 'realtime' (Cửa sổ trượt tịnh tiến phải -> trái) hoặc 'all' (Xem toàn bộ lịch sử)
  const [viewMode, setViewMode] = useState('realtime');
  const [windowSize, setWindowSize] = useState(35);

  if (!data || data.length === 0) return null;

  // Tính toán dữ liệu hiển thị theo chế độ
  const chartData = useMemo(() => {
    if (viewMode === 'realtime') {
      // Lấy đúng N điểm mới nhất (cửa sổ trượt), định dạng nhãn theo giờ:phút:giây để thấy rõ tịnh tiến
      const slice = data.slice(-windowSize);
      return slice.map((item) => ({
        ...item,
        chartLabel: item.time_str || item.formattedTime || item.displayLabel || '',
      }));
    } else {
      // Chế độ xem toàn bộ lịch sử có nén mẫu
      const agg = aggregateForChart(data, 120);
      return agg.map((item) => ({
        ...item,
        chartLabel: item.displayLabel || item.time_str || '',
      }));
    }
  }, [data, viewMode, windowSize]);

  return (
    <div className="space-y-6 mb-6">

      {/* Real-time Mode Control Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            {viewMode === 'realtime'
              ? 'Đồ Thị Thời Gian Thực (Tịnh tiến trượt từ Phải sang Trái)'
              : 'Đồ Thị Tổng Quan Lịch Sử'}
          </span>
          {viewMode === 'realtime' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Live Stream Window: {chartData.length} điểm
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Chuyển đổi Real-time / Lịch sử */}
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('realtime')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold transition-all duration-200 ${
                viewMode === 'realtime'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Real-time (Trượt)</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold transition-all duration-200 ${
                viewMode === 'all'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Xem Toàn Bộ</span>
            </button>
          </div>

          {/* Chọn kích thước cửa sổ trượt nếu đang ở chế độ Real-time */}
          {viewMode === 'realtime' && (
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50"
              title="Số điểm đo gần nhất hiển thị trên cửa sổ trượt"
            >
              <option value={20}>Trượt 20 điểm</option>
              <option value={35}>Trượt 35 điểm</option>
              <option value={50}>Trượt 50 điểm</option>
              <option value={80}>Trượt 80 điểm</option>
            </select>
          )}
        </div>
      </div>
      
      {/* Chart 1: Temperature & Humidity Dual-Axis */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Diễn Biến Nhiệt Độ (°C) & Độ Ẩm (%)
              </h3>
              <p className="text-xs text-slate-400">
                {viewMode === 'realtime' 
                  ? 'Cập nhật trực tiếp: Điểm mới xuất hiện bên phải, tịnh tiến dần sang trái' 
                  : 'Theo dõi trực tiếp theo mốc thời gian'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Nhiệt độ (°C)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Độ ẩm (%)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="chartLabel" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={20}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#f59e0b" 
                fontSize={11} 
                domain={[
                  dataMin => Math.floor(dataMin - 1), 
                  dataMax => Math.ceil(dataMax + 1)
                ]} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#06b6d4" 
                fontSize={11} 
                domain={[0, 100]} 
              />
              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine 
                yAxisId="left" 
                y={thresholds.tempWarning} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ value: 'Cảnh báo nhiệt', fill: '#ef4444', fontSize: 10 }} 
              />

              {/* isAnimationActive={false} giúp đồ thị trượt mượt mà, KHÔNG vẽ lại từ đầu */}
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="temp" 
                name="Nhiệt độ (°C)" 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#tempGradient)" 
                isAnimationActive={false}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="humidity" 
                name="Độ ẩm (%)" 
                stroke="#06b6d4" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: MQ Gas Sensors (MQ2, MQ3, MQ4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Nồng Độ Khí Gas (MQ2, MQ3, MQ4)
                </h3>
                <p className="text-xs text-slate-400">Giám sát khí độc hại & nguy cơ rò rỉ</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>MQ2</span>
              </span>
              <span className="flex items-center space-x-1 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>MQ3</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>MQ4</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mq2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="chartLabel" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  minTickGap={20} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[
                    0, 
                    dataMax => Math.max(700, Math.ceil((dataMax + 50) / 100) * 100)
                  ]} 
                />
                <Tooltip content={<CustomTooltip />} />

                {/* isAnimationActive={false} triệt tiêu hiện tượng giật màn hình */}
                <Area 
                  type="monotone" 
                  dataKey="mq2" 
                  name="MQ2 (Khói/LPG)" 
                  stroke="#f43f5e" 
                  strokeWidth={2} 
                  fill="url(#mq2Grad)" 
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="mq3" 
                  name="MQ3 (Cồn)" 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="mq4" 
                  name="MQ4 (Methane)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Combined Gas Index Area Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Chỉ Số Gộp Gas Index
              </h3>
              <p className="text-xs text-slate-400">Hợp nhất từ MQ2, MQ3 & MQ4</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasIdxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="chartLabel" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  minTickGap={20} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[
                    0, 
                    dataMax => Math.max(0.5, Math.ceil((dataMax + 0.1) * 10) / 10)
                  ]} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="gas_index" 
                  name="Gas Index" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fill="url(#gasIdxGrad)" 
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
