import React from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function PredictivePanel({ data }) {
  const latest = data && data.length > 0 ? data[data.length - 1] : null;

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-sm">
        <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-pulse" />
        Đang chờ kết nối dữ liệu từ Google Sheet...
      </div>
    );
  }

  const currentLevel = latest?.current_level || 'L0';
  const predictedLevel = latest?.predicted_level || 'L0';
  const pctChange = latest?.gas_index_pct !== undefined ? latest.gas_index_pct : 0;
  const gasIndexCurrent = latest?.gas_index || 0;

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
                  Phân Tích & Dự Đoán Biến Thiên Khí Gas (Gas Index Forecast)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>AI Trend Model</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Theo dõi % biến thiên xu hướng (<span className="text-indigo-300 font-medium">Gas_Index_pct_change</span>) và cấp độ cảnh báo tương lai (<span className="text-purple-300 font-medium">Predicted_Level</span>)
              </p>
            </div>
          </div>

          {/* Level Badges */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Cấp độ Hiện Tại:</p>
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${
                currentLevel === 'L0' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                currentLevel === 'L1' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              }`}>
                Level {currentLevel}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400">Dự Báo Tương Lai:</p>
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${
                predictedLevel === 'L0' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                predictedLevel === 'L1' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              }`}>
                Level {predictedLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Prediction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Gas Index Pct Change */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Tỷ Lệ Biến Thiên Dự Đoán</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black ${pctChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {pctChange > 0 ? `+${pctChange}` : pctChange}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Minh họa mức độ thay đổi % của Gas Index so với hiện tại.
          </p>
        </div>

        {/* Card 2: Gas Index Current */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Chỉ Số Gộp Gas Index</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BrainCircuit className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {gasIndexCurrent}
            </span>
            <span className="text-xs text-slate-400">Index</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Tổng hợp dữ liệu đồng thời từ các cảm biến MQ2, MQ3 & MQ4.
          </p>
        </div>

        {/* Card 3: Predicted Level Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Nhãn Cảnh Báo Tương Lai</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-purple-300">
              {predictedLevel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Cấp độ rủi ro khí gas dự kiến trong chu kỳ kế tiếp.
          </p>
        </div>

      </div>

      {/* Chart 1: Trend Projection Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sub-Chart 1: % Gas Index Pct Change */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Tỷ Lệ Biến Thiên (% Gas Index Pct Change)
              </h3>
            </div>
            <div className="text-[11px] text-slate-400">
              ESP32 Machine Learning Model
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayLabel" stroke="#94a3b8" fontSize={10} minTickGap={25} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="gas_index_pct" name="% Thay đổi Gas Index" stroke="#a855f7" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-Chart 2: Gas Index Current vs Predicted t+24 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Gas Index Thực Tế vs Dự Báo ML (t+24)
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-slate-300">Thực tế</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                <span className="text-slate-300">Dự báo ML (t+24)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-50)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayLabel" stroke="#94a3b8" fontSize={10} minTickGap={25} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="gas_index" name="Gas Index Thực Tế" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="predicted_gas_index" name="Dự Báo Gas Index (t+24)" stroke="#ec4899" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
