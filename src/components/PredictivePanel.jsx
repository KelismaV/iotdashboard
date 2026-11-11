import React from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullTime = payload[0]?.payload?.formattedDateTime || payload[0]?.payload?.displayLabel || label;
    return (
      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-md text-xs space-y-1.5 min-w-[190px]">
        <p className="font-semibold text-[#202B36] border-b border-[#E2E8F0] pb-1 mb-1">
          🕒 {fullTime}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-bold text-[#202B36]">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('vi-VN') : entry.value}
              {entry.dataKey === 'gas_index_pct' ? '%' : ''}
            </span>
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
        <p className="text-xs">Kết nối luồng dữ liệu cảm biến để kích hoạt mô hình dự đoán.</p>
      </div>
    );
  }

  const currentLevel = latest?.current_level || 'L0';
  const predictedLevel = latest?.predicted_level || 'L0';
  const pctChange = latest?.gas_index_pct !== undefined ? latest.gas_index_pct : 0;
  const gasIndexCurrent = latest?.gas_index !== undefined ? latest.gas_index : 0;

  const getLevelBadge = (lvl) => {
    switch (lvl) {
      case 'L3':
        return <span className="badge-critical font-bold">Mức L3 - Nguy hiểm</span>;
      case 'L2':
        return <span className="badge-critical font-bold">Mức L2 - Cảnh báo</span>;
      case 'L1':
        return <span className="badge-warning font-bold">Mức L1 - Trung bình</span>;
      default:
        return <span className="badge-normal font-bold">Mức L0 - An toàn</span>;
    }
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#202B36]">
                  Dự đoán chất lượng không khí
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                  <Cpu className="w-3 h-3 text-purple-600" />
                  <span>Dự báo trước 3 phút</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Theo dõi xu hướng biến thiên và cảnh báo sớm mức độ ô nhiễm không khí trong phòng khám.
              </p>
            </div>
          </div>

          {/* Current & Predicted Level Badges */}
          <div className="flex items-center space-x-4">
            <div className="text-left md:text-right">
              <p className="text-[11px] text-[#64748B] mb-0.5">Trạng thái hiện tại:</p>
              {getLevelBadge(currentLevel)}
            </div>

            <div className="h-8 w-px bg-[#E2E8F0] hidden sm:block"></div>

            <div className="text-left md:text-right">
              <p className="text-[11px] text-[#64748B] mb-0.5">Dự báo 3 phút tới:</p>
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
            Mức độ biến thiên so với mức bình thường sau khi lọc trôi cảm biến.
          </p>
        </div>

        {/* Card 2: Gas Index Current */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">Chỉ số gộp Gas Index</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#2563EB] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#202B36]">
              {gasIndexCurrent}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">Idx</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Tổng hợp nồng độ từ các cảm biến khí MQ2, MQ3, MQ4 trên thang 0.0 – 1.0.
          </p>
        </div>

        {/* Card 3: Predicted Level */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">Cảnh báo rủi ro dự kiến</span>
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
            Mức độ ô nhiễm dự kiến trong 3 phút tới để xử lý kịp thời.
          </p>
        </div>

      </div>

      {/* 2 Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Biểu đồ 1: Tỷ lệ biến thiên */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Tỷ lệ biến thiên nồng độ khí
                </h3>
                <p className="text-[11px] text-[#64748B]">Biên độ biến thiên và các ngưỡng cảnh báo</p>
              </div>
            </div>
            <span className="text-[11px] text-[#64748B] bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded self-start sm:self-auto">
              50 chu kỳ gần nhất
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="displayLabel" stroke="#64748B" fontSize={10} minTickGap={25} />
                <YAxis stroke="#64748B" fontSize={10} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Đường Baseline 0% */}
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                
                {/* Ngưỡng L2 */}
                <ReferenceLine y={33.1} stroke="#EA580C" strokeDasharray="4 4" strokeWidth={1.5} />
                
                {/* Ngưỡng L3 */}
                <ReferenceLine y={176.9} stroke="#DC4545" strokeDasharray="4 4" strokeWidth={1.5} />

                <Line 
                  type="monotone" 
                  dataKey="gas_index_pct" 
                  name="% Biến thiên" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E2E8F0]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#8B5CF6]"></span> Tỷ lệ biến thiên
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#EA580C] border-b border-dashed"></span> Ngưỡng cảnh báo L2
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#DC4545] border-b border-dashed"></span> Ngưỡng nguy hiểm L3
            </span>
          </div>
        </div>

        {/* Biểu đồ 2: Đối sánh Thực tế vs Dự báo */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                  Chỉ số Gas Index: Thực tế và Dự báo
                </h3>
                <p className="text-[11px] text-[#64748B]">Đối sánh số liệu thực tế và xu hướng dự báo 3 phút tới</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                <span className="text-[#64748B]">Thực tế</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
                <span className="text-[#64748B]">Dự báo 3 phút tới</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="displayLabel" stroke="#64748B" fontSize={10} minTickGap={25} />
                <YAxis stroke="#64748B" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                
                <Line 
                  type="monotone" 
                  dataKey="gas_index" 
                  name="Gas Index Thực tế" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_gas_index" 
                  name="Dự báo 3 phút tới" 
                  stroke="#EC4899" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E2E8F0]">
            <span>Thời gian dự báo trước: <strong>3 phút</strong></span>
            <span>Độ tin cậy: <strong>Bám sát xu hướng thực tế</strong></span>
          </div>
        </div>

      </div>

      {/* Visual Level Gauge Bar */}
      <div className="card p-5 bg-[#F8FAFC] border border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-bold text-[#202B36]">
              Thang phân cấp mức độ ô nhiễm
            </span>
          </div>
          <span className="text-[11px] text-[#64748B]">
            Phân loại 4 mức độ dựa trên dữ liệu phòng khám
          </span>
        </div>

        <div className="space-y-1.5 mt-3">
          <div className="relative h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div className={`h-full flex-1 transition-all ${predictedLevel === 'L0' ? 'bg-[#16A36A]' : 'bg-[#16A36A]/30'}`}></div>
            <div className={`h-full flex-1 transition-all ${predictedLevel === 'L1' ? 'bg-[#D99018]' : 'bg-[#D99018]/30'}`}></div>
            <div className={`h-full flex-1 transition-all ${predictedLevel === 'L2' ? 'bg-[#EA580C]' : 'bg-[#EA580C]/30'}`}></div>
            <div className={`h-full flex-1 transition-all ${predictedLevel === 'L3' ? 'bg-[#DC4545]' : 'bg-[#DC4545]/30'}`}></div>
          </div>
          <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
            <span className={`w-1/4 text-center ${predictedLevel === 'L0' ? 'text-[#16A36A] font-bold' : ''}`}>
              L0: An toàn
            </span>
            <span className={`w-1/4 text-center ${predictedLevel === 'L1' ? 'text-[#D99018] font-bold' : ''}`}>
              L1: Trung bình
            </span>
            <span className={`w-1/4 text-center ${predictedLevel === 'L2' ? 'text-[#EA580C] font-bold' : ''}`}>
              L2: Cảnh báo
            </span>
            <span className={`w-1/4 text-center ${predictedLevel === 'L3' ? 'text-[#DC4545] font-bold' : ''}`}>
              L3: Nguy hiểm
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
