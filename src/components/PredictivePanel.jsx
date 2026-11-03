import React from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullTime = payload[0]?.payload?.formattedDateTime || payload[0]?.payload?.displayLabel || label;
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

export default function PredictivePanel({ data }) {
  const latest = data && data.length > 0 ? data[data.length - 1] : null;

  if (!data || data.length === 0) {
    return (
      <div className="card p-12 text-center text-[#64748B] text-sm space-y-2">
        <BrainCircuit className="w-8 h-8 mx-auto text-[#2563EB] animate-pulse" />
        <p className="font-medium text-[#202B36]">Đang chờ nạp dữ liệu phân tích...</p>
        <p className="text-xs">Kết nối luồng dữ liệu cảm biến để kích hoạt mô hình dự đoán AI.</p>
      </div>
    );
  }

  const currentLevel = latest?.current_level || 'L0';
  const predictedLevel = latest?.predicted_level || 'L0';
  const pctChange = latest?.gas_index_pct !== undefined ? latest.gas_index_pct : 0;
  const gasIndexCurrent = latest?.gas_index || 0;

  const getLevelBadge = (lvl) => {
    if (lvl === 'L3') return <span className="badge-critical font-bold">Level L3 (Cực nguy hại)</span>;
    if (lvl === 'L2') return <span className="badge-critical font-bold">Level L2 (Gây hại)</span>;
    if (lvl === 'L1') return <span className="badge-warning font-bold">Level L1 (Trung bình)</span>;
    return <span className="badge-normal font-bold">Level L0 (Bình thường)</span>;
  };

  return (
    <div className="space-y-6 mb-6">
      
      {/* Header Banner */}
      <div className="card p-6 bg-white border border-[#E2E8F0]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#202B36]">
                  Dự đoán xu hướng (Machine Learning)
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Mô hình AI chu kỳ t+24</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Theo dõi tỷ lệ biến thiên xu hướng (<span className="text-[#202B36] font-medium">Gas_Index_pct</span>) và cấp độ rủi ro tương lai (<span className="text-[#202B36] font-medium">Predicted_Level</span>)
              </p>
            </div>
          </div>

          {/* Current & Predicted Level Badges */}
          <div className="flex items-center space-x-4">
            <div className="text-left md:text-right">
              <p className="text-[11px] text-[#64748B] mb-0.5">Cấp độ hiện tại:</p>
              {getLevelBadge(currentLevel)}
            </div>

            <div className="h-8 w-px bg-[#E2E8F0] hidden sm:block"></div>

            <div className="text-left md:text-right">
              <p className="text-[11px] text-[#64748B] mb-0.5">Dự báo kế tiếp:</p>
              {getLevelBadge(predictedLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Gas Index Pct Change */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">Tỷ lệ biến thiên dự đoán</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${pctChange >= 0 ? 'text-[#DC4545]' : 'text-[#16A36A]'}`}>
              {pctChange > 0 ? `+${pctChange}` : pctChange}%
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Mức độ tăng giảm % của chỉ số Gas Index so với chu kỳ đo lường trước.
          </p>
        </div>

        {/* Card 2: Gas Index Current */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">Chỉ số Gas Index hiện tại</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#2563EB] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#202B36]">
              {gasIndexCurrent}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">Index</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Chỉ số tổng hợp theo trọng số từ các cảm biến khí gas MQ2, MQ3, MQ4.
          </p>
        </div>

        {/* Card 3: Predicted Level */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">Cấp độ rủi ro tương lai</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#202B36]">
              {predictedLevel}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Dự báo cấp độ nguy cơ ô nhiễm trong 4 phút kế tiếp.
          </p>
        </div>

      </div>

      {/* 2 Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sub-Chart 1: % Gas Index Pct Change */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Tỷ lệ biến thiên (% Gas Index)
                </h3>
                <p className="text-[11px] text-[#64748B]">Độ dốc tăng trưởng nồng độ khí gas</p>
              </div>
            </div>
            <span className="text-[11px] text-[#64748B] bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded">
              50 điểm gần nhất
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="displayLabel" stroke="#64748B" fontSize={10} minTickGap={25} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="gas_index_pct" 
                  name="% Thay đổi Gas Index" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-Chart 2: Gas Index Actual vs Predicted t+24 */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Gas Index: Thực tế vs Dự báo ML (t+24)
                </h3>
                <p className="text-[11px] text-[#64748B]">So sánh chỉ số thực tế và dự đoán mô hình</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                <span className="text-[#64748B]">Thực tế</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
                <span className="text-[#64748B]">Dự báo (t+24)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="displayLabel" stroke="#64748B" fontSize={10} minTickGap={25} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="gas_index" 
                  name="Gas Index Thực Tế" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_gas_index" 
                  name="Dự Báo Gas Index (t+24)" 
                  stroke="#EC4899" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
