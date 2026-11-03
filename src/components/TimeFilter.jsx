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
    <div className="card p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      
      {/* Time filter pill buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = timeframe === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTimeframe(opt.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white text-[#64748B] hover:text-[#202B36] hover:bg-slate-50 border border-[#E2E8F0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Record info count */}
      <div className="text-xs text-[#64748B] flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-md border border-[#E2E8F0]">
        <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
        <span>
          Đã lọc <strong className="text-[#202B36] font-semibold">{filteredCount}</strong> / {totalCount} bản ghi
        </span>
      </div>

    </div>
  );
}
