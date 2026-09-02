import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { Thermometer, Flame, BarChart3 } from 'lucide-react';
import { aggregateForChart } from '../services/analyticsService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">{label}</p>
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
  if (!data || data.length === 0) return null;

  // Aggregate if dataset is large for smooth rendering
  const chartData = aggregateForChart(data, 120);

  return (
    <div className="space-y-6 mb-6">
      
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
              <p className="text-xs text-slate-400">Theo dõi trực tiếp theo mốc thời gian</p>
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
              <XAxis dataKey="displayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#f59e0b" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
              <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine yAxisId="left" y={thresholds.tempWarning} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Cảnh báo nhiệt', fill: '#ef4444', fontSize: 10 }} />

              <Area yAxisId="left" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" />
              <Line yAxisId="right" type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#06b6d4" strokeWidth={2} dot={false} />
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
                <XAxis dataKey="displayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />

                <Area type="monotone" dataKey="mq2" name="MQ2 (Khói/LPG)" stroke="#f43f5e" strokeWidth={2} fill="url(#mq2Grad)" />
                <Line type="monotone" dataKey="mq3" name="MQ3 (Cồn)" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mq4" name="MQ4 (Methane)" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Average Gas Comparison Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                So Sánh Chỉ Số Khí Gas
              </h3>
              <p className="text-xs text-slate-400">Giá trị trung bình khoảng thời gian</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'MQ2 (Khói)',
                    value: Math.round(data.reduce((s, d) => s + d.mq2, 0) / data.length),
                    fill: '#f43f5e',
                  },
                  {
                    name: 'MQ3 (Cồn)',
                    value: Math.round(data.reduce((s, d) => s + d.mq3, 0) / data.length),
                    fill: '#a855f7',
                  },
                  {
                    name: 'MQ4 (Methane)',
                    value: Math.round(data.reduce((s, d) => s + d.mq4, 0) / data.length),
                    fill: '#10b981',
                  },
                ]}
                margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Nồng độ (PPM)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
