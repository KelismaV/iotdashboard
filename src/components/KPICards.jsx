import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Wine, 
  Wind, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function KPICards({ kpiData, thresholds }) {
  if (!kpiData) return null;

  const cards = [
    {
      id: 'temp',
      title: 'Nhiệt độ',
      unit: '°C',
      data: kpiData.temp,
      icon: Thermometer,
      warningLimit: thresholds.tempWarning,
      criticalLimit: thresholds.tempHigh,
      color: 'from-amber-500 to-orange-500',
      textAccent: 'text-amber-400',
      bgGlow: 'shadow-amber-500/10 border-amber-500/20',
    },
    {
      id: 'humidity',
      title: 'Độ ẩm',
      unit: '%',
      data: kpiData.humidity,
      icon: Droplets,
      warningLimit: thresholds.humidityHigh,
      criticalLimit: 90,
      color: 'from-cyan-500 to-blue-500',
      textAccent: 'text-cyan-400',
      bgGlow: 'shadow-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'mq2',
      title: 'Khí Gas MQ2 (Khói/LPG)',
      unit: 'PPM',
      data: kpiData.mq2,
      icon: Flame,
      warningLimit: thresholds.mq2Warning,
      criticalLimit: thresholds.mq2Critical,
      color: 'from-rose-500 to-red-600',
      textAccent: 'text-rose-400',
      bgGlow: 'shadow-rose-500/10 border-rose-500/20',
    },
    {
      id: 'mq3',
      title: 'Khí Gas MQ3 (Cồn/Ethanol)',
      unit: 'PPM',
      data: kpiData.mq3,
      icon: Wine,
      warningLimit: thresholds.mq3Warning,
      criticalLimit: thresholds.mq3Critical,
      color: 'from-purple-500 to-indigo-500',
      textAccent: 'text-purple-400',
      bgGlow: 'shadow-purple-500/10 border-purple-500/20',
    },
    {
      id: 'mq4',
      title: 'Khí Gas MQ4 (Methane)',
      unit: 'PPM',
      data: kpiData.mq4,
      icon: Wind,
      warningLimit: thresholds.mq4Warning,
      criticalLimit: thresholds.mq4Critical,
      color: 'from-emerald-500 to-teal-500',
      textAccent: 'text-emerald-400',
      bgGlow: 'shadow-emerald-500/10 border-emerald-500/20',
    },
  ];

  const getStatusBadge = (card) => {
    const val = card.data.current;
    if (val >= card.criticalLimit) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>Nguy hiểm</span>
        </span>
      );
    }
    if (val >= card.warningLimit) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>Cảnh báo</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        <span>An toàn</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const trend = card.data.trend;
        const isUp = trend >= 0;

        return (
          <div
            key={card.id}
            className={`glass-card p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${card.bgGlow}`}
          >
            {/* Card Top */}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                <Icon className="w-4 h-4" />
              </div>
              {getStatusBadge(card)}
            </div>

            {/* Title */}
            <h3 className="text-xs font-medium text-slate-400 mb-1 truncate" title={card.title}>
              {card.title}
            </h3>

            {/* Current Main Value */}
            <div className="flex items-baseline space-x-1.5 mb-3">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {card.data.current}
              </span>
              <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
            </div>

            {/* Trend & Sub Stats */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-1">
                {isUp ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                )}
                <span className={isUp ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {isUp ? `+${trend}%` : `${trend}%`}
                </span>
              </div>

              <div className="text-[10px] text-slate-400">
                TB: <span className="font-semibold text-slate-300">{card.data.avg}</span>
              </div>
            </div>

            {/* Min / Max Range line */}
            <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Min: {card.data.min}</span>
              <span>Max: {card.data.max}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
