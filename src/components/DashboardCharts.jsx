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
import { Thermometer, Flame, Activity, Layers, BarChart3 } from 'lucide-react';
import { aggregateForChart } from '../services/analyticsService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullTime = payload[0]?.payload?.formattedDateTime || payload[0]?.payload?.time_str || label;
    return (
      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-md text-xs space-y-1.5 min-w-[170px]">
        <p className="font-semibold text-[#202B36] border-b border-[#E2E8F0] pb-1 mb-1">
          🕒 {fullTime}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-bold text-[#202B36]">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ data, thresholds }) {
  const [viewMode, setViewMode] = useState('realtime');
  const [windowSize, setWindowSize] = useState(35);

  if (!data || data.length === 0) return null;

  const chartData = useMemo(() => {
    if (viewMode === 'realtime') {
      const slice = data.slice(-windowSize);
      return slice.map((item) => ({
        ...item,
        chartLabel: item.time_str || item.formattedTime || item.displayLabel || '',
      }));
    } else {
      const agg = aggregateForChart(data, 120);
      return agg.map((item) => ({
        ...item,
        chartLabel: item.displayLabel || item.time_str || '',
      }));
    }
  }, [data, viewMode, windowSize]);

  return (
    <div className="space-y-6 mb-6">
      
      {/* Chart Control Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          <span className="text-xs font-bold text-[#202B36]">
            {viewMode === 'realtime' ? 'Đồ thị thời gian thực' : 'Đồ thị tổng quan lịch sử'}
          </span>
          {viewMode === 'realtime' && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-100">
              Live Stream: {chartData.length} điểm
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Segmented Control */}
          <div className="bg-[#F3F5F7] p-1 rounded-lg border border-[#E2E8F0] flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('realtime')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition ${
                viewMode === 'realtime'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#202B36]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Real-time</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition ${
                viewMode === 'all'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#202B36]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Xem Toàn Bộ</span>
            </button>
          </div>

          {/* Window size selector */}
          {viewMode === 'realtime' && (
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="bg-white border border-[#E2E8F0] text-[#202B36] text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2563EB]"
              title="Số điểm đo gần nhất hiển thị"
            >
              <option value={20}>20 điểm</option>
              <option value={35}>35 điểm</option>
              <option value={50}>50 điểm</option>
              <option value={80}>80 điểm</option>
            </select>
          )}
        </div>
      </div>

      {/* Grid: 2 Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Temperature & Humidity Dual-Axis */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D99018] flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Diễn biến Nhiệt độ & Độ ẩm
                </h3>
                <p className="text-[11px] text-[#64748B]">Trục kép: Nhiệt độ (°C) và Độ ẩm (%)</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D99018]"></span>
                <span className="text-[#64748B]">Nhiệt độ (°C)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                <span className="text-[#64748B]">Độ ẩm (%)</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D99018" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D99018" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="chartLabel" 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickLine={false} 
                  minTickGap={20}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#D99018" 
                  fontSize={10} 
                  domain={[
                    (dataMin) => Math.floor(dataMin - 1), 
                    (dataMax) => Math.ceil(dataMax + 1)
                  ]} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#2563EB" 
                  fontSize={10} 
                  domain={[0, 100]} 
                />
                <Tooltip content={<CustomTooltip />} />

                {thresholds?.tempWarning && (
                  <ReferenceLine 
                    yAxisId="left" 
                    y={thresholds.tempWarning} 
                    stroke="#DC4545" 
                    strokeDasharray="4 4" 
                  />
                )}

                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="temp" 
                  name="Nhiệt độ (°C)" 
                  stroke="#D99018" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#tempGradientLight)" 
                  isAnimationActive={false}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="humidity" 
                  name="Độ ẩm (%)" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: MQ Gas Sensors (MQ2, MQ3, MQ4) */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#DC4545] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Nồng độ Khí Gas (MQ2, MQ3, MQ4)
                </h3>
                <p className="text-[11px] text-[#64748B]">Giám sát nồng độ khí gas (PPM)</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1 text-[#DC4545]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC4545]"></span>
                <span>MQ2</span>
              </span>
              <span className="flex items-center space-x-1 text-[#8B5CF6]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                <span>MQ3</span>
              </span>
              <span className="flex items-center space-x-1 text-[#16A36A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]"></span>
                <span>MQ4</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="mq2GradLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC4545" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#DC4545" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="chartLabel" 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickLine={false} 
                  minTickGap={20} 
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  domain={[0, (dataMax) => Math.max(700, Math.ceil((dataMax + 50) / 100) * 100)]} 
                />
                <Tooltip content={<CustomTooltip />} />

                <Area 
                  type="monotone" 
                  dataKey="mq2" 
                  name="Khí MQ2 (Khói/LPG)" 
                  stroke="#DC4545" 
                  strokeWidth={2} 
                  fill="url(#mq2GradLight)" 
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="mq3" 
                  name="Khí MQ3 (Cồn)" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="mq4" 
                  name="Khí MQ4 (Methane)" 
                  stroke="#16A36A" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Full-width Gas Index Chart */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                Chỉ số Gas Index tổng hợp
              </h3>
              <p className="text-[11px] text-[#64748B]">Đánh giá mức độ ô nhiễm không khí tổng hợp theo thời gian thực</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
            <span className="text-[#64748B] font-medium">Gas Index</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gasIdxLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="chartLabel" 
                stroke="#64748B" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={20} 
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={10} 
                domain={[0, (dataMax) => Math.max(0.5, Math.ceil((dataMax + 0.1) * 10) / 10)]} 
              />
              <Tooltip content={<CustomTooltip />} />

              <Area 
                type="monotone" 
                dataKey="gas_index" 
                name="Gas Index" 
                stroke="#2563EB" 
                strokeWidth={2} 
                fill="url(#gasIdxLight)" 
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
