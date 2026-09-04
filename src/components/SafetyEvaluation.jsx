import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer, 
  Droplets,
  Wind,
  Flame,
  Wine,
  Lightbulb
} from 'lucide-react';
import { evaluateSafety } from '../services/analyticsService';

export default function SafetyEvaluation({ latestRecord, thresholds }) {
  const safety = evaluateSafety(latestRecord, thresholds);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (score >= 50) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const strokeDashoffset = 283 - (283 * safety.score) / 100;

  // Generate smart recommendations based on actual values
  const recommendations = [];

  if (latestRecord) {
    if (latestRecord.temp > thresholds.tempWarning) {
      recommendations.push('Bật hệ thống tản nhiệt hoặc hệ thống quạt thông gió làm mát không khí.');
    }
    if (latestRecord.humidity > thresholds.humidityHigh) {
      recommendations.push('Sử dụng máy hút ẩm hoặc tăng lưu thông không khí để tránh đọng sương.');
    }
    if (latestRecord.mq2 > thresholds.mq2Warning) {
      recommendations.push('CẢNH BÁO KHÓI/GAS: Kiểm tra ngay nguồn nhiệt, thiết bị đun nấu hoặc bình gas!');
    }
    if (latestRecord.mq3 > thresholds.mq3Warning) {
      recommendations.push('Phát hiện nồng độ cồn/dung môi hữu cơ gia tăng. Đảm bảo thông thoáng phòng.');
    }
    if (latestRecord.mq4 > thresholds.mq4Warning) {
      recommendations.push('CẢNH BÁO METHANE: Kiểm tra đường ống dẫn khí thiên nhiên hoặc hệ thống thoát khí.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Môi trường làm việc & lưu trữ đang ở mức lý tưởng. Duy trì chế độ giám sát tự động.');
    recommendations.push('Tất cả các chỉ số cảm biến ESP32 hoạt động ổn định trong ngưỡng an toàn.');
  }

  return (
    <div className="space-y-6 mb-6">
      
      {/* Top Banner: Score Gauge & Main Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gauge Score Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Chỉ Số An Toàn Môi Trường
          </h3>

          {/* SVG Circular Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={`transition-all duration-1000 ease-out ${getScoreColor(safety.score)}`}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-3xl font-extrabold ${safety.statusColor}`}>
                {safety.score}%
              </span>
              <span className="text-[10px] text-slate-400">Score</span>
            </div>
          </div>

          {/* Status badge */}
          <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold border ${safety.statusBg} ${safety.statusColor}`}>
            {safety.statusText}
          </div>
        </div>

        {/* Breakdown parameters */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>Đánh Giá Chi Tiết Theo Cảm Biến</span>
              </h3>
              <span className="text-xs text-slate-400">Cập nhật: {latestRecord?.formattedTime || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Temp Assessment */}
              <div className="glass-card p-2.5 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-1 mb-1 text-slate-400 text-[11px]">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nhiệt độ</span>
                </div>
                <div className="text-base font-bold text-white">
                  {latestRecord?.temp || 0}°C
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {latestRecord?.temp > thresholds.tempWarning ? '⚠️ Hơi cao' : '✅ Đạt chuẩn'}
                </p>
              </div>

              {/* Humidity Assessment */}
              <div className="glass-card p-2.5 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-1 mb-1 text-slate-400 text-[11px]">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Độ ẩm</span>
                </div>
                <div className="text-base font-bold text-white">
                  {latestRecord?.humidity || 0}%
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {latestRecord?.humidity > thresholds.humidityHigh ? '⚠️ Ẩm cao' : '✅ Vừa phải'}
                </p>
              </div>

              {/* MQ2 Assessment */}
              <div className="glass-card p-2.5 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-1 mb-1 text-slate-400 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>MQ2 Khói</span>
                </div>
                <div className="text-base font-bold text-white">
                  {latestRecord?.mq2 || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {latestRecord?.mq2 > thresholds.mq2Warning ? '🚨 Vượt ngưỡng' : '✅ An toàn'}
                </p>
              </div>

              {/* MQ3 Assessment */}
              <div className="glass-card p-2.5 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-1 mb-1 text-slate-400 text-[11px]">
                  <Wine className="w-3.5 h-3.5 text-purple-400" />
                  <span>MQ3 Cồn</span>
                </div>
                <div className="text-base font-bold text-white">
                  {latestRecord?.mq3 || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {latestRecord?.mq3 > thresholds.mq3Warning ? '🚨 Vượt ngưỡng' : '✅ An toàn'}
                </p>
              </div>

              {/* MQ4 Assessment */}
              <div className="glass-card p-2.5 rounded-xl text-center">
                <div className="flex items-center justify-center space-x-1 mb-1 text-slate-400 text-[11px]">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MQ4 Methane</span>
                </div>
                <div className="text-base font-bold text-white">
                  {latestRecord?.mq4 || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {latestRecord?.mq4 > thresholds.mq4Warning ? '🚨 Vượt ngưỡng' : '✅ An toàn'}
                </p>
              </div>
            </div>
          </div>

          {/* Warnings List */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Cảnh Báo Hiện Tại ({safety.warnings.length}):</h4>
            {safety.warnings.length === 0 ? (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Không có sự cố nào được ghi nhận. Hệ thống an toàn tuyệt đối.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {safety.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2 text-xs p-2.5 rounded-xl border ${
                      w.type === 'danger'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong>[{w.param}]</strong> {w.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Recommendations Box */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">
            Khuyến Nghị & Hành Động Đề Xuất
          </h3>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
