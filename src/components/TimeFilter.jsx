import React from 'react';
import { Calendar, Clock, Database, Layers } from 'lucide-react';

export default function TimeFilter({ timeframe, setTimeframe, totalCount, filteredCount }) {
  const options = [
    { id: 'hour', label: 'Theo Giờ (24h)', icon: Clock },
    { id: 'day', label: 'Theo Ngày (7d)', icon: Calendar },
    { id: 'week', label: 'Theo Tuần (4w)', icon: Layers },
    { id: 'month', label: 'Theo Tháng (12m)', icon: Calendar },
    { id: 'all', label: 'Tất Cả', icon: Database },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3 rounded-2xl mb-6 border border-slate-800">
      
      {/* Time buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = timeframe === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTimeframe(opt.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Record info count */}
      <div className="text-xs text-slate-400 flex items-center space-x-2 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-800/60">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span>
          Đã lọc <strong className="text-cyan-300 font-semibold">{filteredCount}</strong> / {totalCount} bản ghi
        </span>
      </div>

    </div>
  );
}
