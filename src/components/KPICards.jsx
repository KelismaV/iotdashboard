import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Wine, 
  Wind, 
  Activity,
  TrendingUp, 
  TrendingDown
} from 'lucide-react';

export default function KPICards({ kpiData }) {
  if (!kpiData) return null;

  const cards = [
    {
      id: 'temp',
      title: 'Nhiệt độ',
      unit: '°C',
      data: kpiData.temp,
      icon: Thermometer,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      id: 'humidity',
      title: 'Độ ẩm không khí',
      unit: '%',
      data: kpiData.humidity,
      icon: Droplets,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      id: 'mq2',
      title: 'Khí Gas MQ2',
      unit: 'PPM',
      data: kpiData.mq2,
      icon: Flame,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    {
      id: 'mq3',
      title: 'Khí Gas MQ3',
      unit: 'PPM',
      data: kpiData.mq3,
      icon: Wine,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
    },
    {
      id: 'mq4',
      title: 'Khí Gas MQ4',
      unit: 'PPM',
      data: kpiData.mq4,
      icon: Wind,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      id: 'gas_index',
      title: 'Chỉ số Gas Index',
      unit: 'Idx',
      data: kpiData.gas_index || { current: 0, avg: 0, min: 0, max: 0, trend: 0 },
      icon: Activity,
      iconBg: 'bg-indigo-50 text-[#2563EB] border border-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const trend = card.data?.trend ?? 0;
        const isUp = trend >= 0;

        return (
          <div
            key={card.id}
            className="card p-4 transition-all duration-150 hover:shadow-md flex flex-col justify-between"
          >
            {/* Top row: Icon */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xs font-medium text-[#64748B] mb-1 truncate" title={card.title}>
                {card.title}
              </h3>

              {/* Main Reading Value */}
              <div className="flex items-baseline space-x-1 mb-3">
                <span className="text-2xl font-bold tracking-tight text-[#202B36]">
                  {card.data?.current ?? '--'}
                </span>
                <span className="text-xs font-semibold text-[#64748B]">{card.unit}</span>
              </div>
            </div>

            {/* Footer: Trend & Min/Max */}
            <div className="pt-2.5 border-t border-[#E2E8F0] space-y-1 text-[11px] text-[#64748B]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 font-medium">
                  {isUp ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#16A36A]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[#DC4545]" />
                  )}
                  <span className={isUp ? 'text-[#16A36A]' : 'text-[#DC4545]'}>
                    {isUp ? `+${trend}%` : `${trend}%`}
                  </span>
                </div>
                <div>
                  TB: <strong className="text-[#202B36] font-semibold">{card.data?.avg ?? 0}</strong>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>Min: {card.data?.min ?? 0}</span>
                <span>Max: {card.data?.max ?? 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
