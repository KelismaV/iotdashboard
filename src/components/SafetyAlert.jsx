import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Wind } from 'lucide-react';

export default function SafetyAlert({ data = [] }) {
  // Logic đánh giá dựa trên thuật toán của user
  const { isAlarming, currentPred } = useMemo(() => {
    let alarmCount = 0;
    let isAlarming = false;
    let currentPred = 'L0';

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const level = record.predicted_level || 'L0';
      currentPred = level;
      
      if (level === 'L2' || level === 'L3') {
        alarmCount++;
      } else {
        alarmCount = 0;
      }

      if (alarmCount >= 3 && !isAlarming) {
        isAlarming = true;
      } else if (alarmCount === 0 && isAlarming) {
        isAlarming = false;
      }
    }

    return { isAlarming, currentPred };
  }, [data]);

  const levelMap = {
    'L0': { text: 'Bình thường', textColor: 'text-emerald-400' },
    'L1': { text: 'Trung bình', textColor: 'text-amber-400' },
    'L2': { text: 'Gây hại', textColor: 'text-orange-400' },
    'L3': { text: 'Cực nguy hại', textColor: 'text-rose-500' }
  };

  const currentLevelInfo = levelMap[currentPred] || levelMap['L0'];

  return (
    <div className="space-y-6">
      {/* Box Cảnh Báo Chính */}
      <div className={`glass-panel p-8 rounded-3xl border-2 transition-all duration-500 ${
        isAlarming 
          ? 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)]' 
          : 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
      }`}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`p-6 rounded-full ${isAlarming ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isAlarming ? <AlertTriangle className="w-16 h-16" /> : <ShieldCheck className="w-16 h-16" />}
          </div>
          
          <div>
            <h2 id="alert-box" className={`text-3xl font-black uppercase tracking-wider mb-2 ${isAlarming ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isAlarming ? 'CẢNH BÁO: Ô NHIỄM NGHIÊM TRỌNG!' : 'Môi trường an toàn.'}
            </h2>
            <p className="text-slate-300">
              {isAlarming 
                ? 'Phát hiện nồng độ khí gas nguy hiểm liên tục 3 lần (45s). Đã bật hệ thống báo động!' 
                : 'Các chỉ số hiện tại đang ở mức an toàn. Hệ thống vẫn đang tiếp tục giám sát.'}
            </p>
          </div>
        </div>
      </div>

      {/* Box Dự Báo Tương Lai */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-6">
          <Wind className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-bold text-slate-100">
            Dự báo 4 phút tới sẽ: <span className={currentLevelInfo.textColor}>{currentLevelInfo.text}</span>
          </h3>
        </div>

        {/* Thanh màu chỉ hiển thị màu ứng với các mốc */}
        <div className="relative h-6 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-700">
            <div className={`h-full flex-1 transition-opacity duration-300 ${currentPred === 'L0' ? 'bg-emerald-500 opacity-100' : 'bg-emerald-500/20 opacity-30'}`}></div>
            <div className={`h-full flex-1 transition-opacity duration-300 ${currentPred === 'L1' ? 'bg-amber-500 opacity-100' : 'bg-amber-500/20 opacity-30'}`}></div>
            <div className={`h-full flex-1 transition-opacity duration-300 ${currentPred === 'L2' ? 'bg-orange-500 opacity-100' : 'bg-orange-500/20 opacity-30'}`}></div>
            <div className={`h-full flex-1 transition-opacity duration-300 ${currentPred === 'L3' ? 'bg-rose-600 opacity-100' : 'bg-rose-600/20 opacity-30'}`}></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase px-2">
            <span className="w-1/4 text-center">Bình thường</span>
            <span className="w-1/4 text-center">Trung bình</span>
            <span className="w-1/4 text-center">Gây hại</span>
            <span className="w-1/4 text-center">Cực nguy hại</span>
        </div>
      </div>
    </div>
  );
}
