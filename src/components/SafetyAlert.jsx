import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Wind, Bell, CheckCircle2, Clock } from 'lucide-react';

export default function SafetyAlert({ data = [] }) {
  // Logic đánh giá cảnh báo an toàn: 3 lần liên tiếp đạt L2 hoặc L3
  const { isAlarming, currentPred, alarmEvents } = useMemo(() => {
    let alarmCount = 0;
    let isAlarming = false;
    let currentPred = 'L0';
    const events = [];

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

      // Collect abnormal events for the alert table
      if (level === 'L1' || level === 'L2' || level === 'L3') {
        events.push({
          time: record.formattedDateTime || record.displayLabel || `Bản ghi #${record.id || i}`,
          sensor: 'Cụm cảm biến MQ (Khí Gas)',
          event: level === 'L3' ? 'Phát hiện nồng độ cực nguy hại' : level === 'L2' ? 'Vượt ngưỡng gây hại' : 'Nồng độ vượt ngưỡng trung bình',
          level: level,
          status: isAlarming ? 'Đang kích hoạt chuông' : 'Đã ghi nhận nhật ký',
        });
      }
    }

    return { 
      isAlarming, 
      currentPred, 
      alarmEvents: events.slice(-8).reverse() // 8 events most recent first
    };
  }, [data]);

  const levelMap = {
    'L0': { text: 'Bình thường (L0)', badge: 'badge-normal', barClass: 'bg-[#16A36A]' },
    'L1': { text: 'Trung bình (L1)', badge: 'badge-warning', barClass: 'bg-[#D99018]' },
    'L2': { text: 'Gây hại (L2)', badge: 'badge-critical', barClass: 'bg-[#EA580C]' },
    'L3': { text: 'Cực nguy hại (L3)', badge: 'badge-critical', barClass: 'bg-[#DC4545]' }
  };

  const currentLevelInfo = levelMap[currentPred] || levelMap['L0'];

  return (
    <div className="space-y-6 mb-6">
      
      {/* Box Cảnh Báo Chính */}
      <div className={`card p-6 border-l-4 transition-all duration-300 ${
        isAlarming 
          ? 'border-l-[#DC4545] bg-red-50/60' 
          : 'border-l-[#16A36A] bg-emerald-50/40'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
              isAlarming ? 'bg-red-100 text-[#DC4545]' : 'bg-emerald-100 text-[#16A36A]'
            }`}>
              {isAlarming ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="alert-box" className={`text-base sm:text-lg font-bold uppercase tracking-wide ${
                  isAlarming ? 'text-[#DC4545]' : 'text-[#16A36A]'
                }`}>
                  {isAlarming ? 'Cảnh báo: Ô nhiễm khí gas nghiêm trọng!' : 'Hệ thống an toàn - Môi trường bình thường'}
                </h2>
                <span className={isAlarming ? 'badge-critical' : 'badge-normal'}>
                  {isAlarming ? 'BÁO ĐỘNG BẬT' : 'AN TOÀN'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {isAlarming 
                  ? 'Phát hiện nồng độ khí gas nguy hiểm liên tục 3 lần (45s). Hệ thống cảnh báo tự động đã kích hoạt.' 
                  : 'Tất cả các thông số khí Gas (MQ2, MQ3, MQ4) và nhiệt ẩm đều nằm trong giới hạn an toàn cho phép.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] text-[#64748B]">Trạng thái hệ thống:</p>
            <span className="text-xs font-bold text-[#202B36]">
              {isAlarming ? '⚠️ Cần kiểm tra ngay' : '✅ Giám sát liên tục'}
            </span>
          </div>
        </div>
      </div>

      {/* Box Dự Báo Tương Lai & Thang Đo */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                Dự báo chu kỳ 4 phút tới
              </h3>
              <p className="text-[11px] text-[#64748B]">Đánh giá theo thuật toán dự đoán AI Machine Learning</p>
            </div>
          </div>

          <div>
            <span className={currentLevelInfo.badge}>
              Dự báo: {currentLevelInfo.text}
            </span>
          </div>
        </div>

        {/* Level bar indicator */}
        <div className="space-y-2 mt-4">
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-[#E2E8F0]">
            <div className={`h-full flex-1 transition-all duration-300 ${currentPred === 'L0' ? 'bg-[#16A36A]' : 'bg-[#16A36A]/20'}`}></div>
            <div className={`h-full flex-1 transition-all duration-300 ${currentPred === 'L1' ? 'bg-[#D99018]' : 'bg-[#D99018]/20'}`}></div>
            <div className={`h-full flex-1 transition-all duration-300 ${currentPred === 'L2' ? 'bg-[#EA580C]' : 'bg-[#EA580C]/20'}`}></div>
            <div className={`h-full flex-1 transition-all duration-300 ${currentPred === 'L3' ? 'bg-[#DC4545]' : 'bg-[#DC4545]/20'}`}></div>
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-[#64748B] px-1">
            <span className={`w-1/4 text-center ${currentPred === 'L0' ? 'text-[#16A36A] font-bold' : ''}`}>L0: Bình thường</span>
            <span className={`w-1/4 text-center ${currentPred === 'L1' ? 'text-[#D99018] font-bold' : ''}`}>L1: Trung bình</span>
            <span className={`w-1/4 text-center ${currentPred === 'L2' ? 'text-[#EA580C] font-bold' : ''}`}>L2: Gây hại</span>
            <span className={`w-1/4 text-center ${currentPred === 'L3' ? 'text-[#DC4545] font-bold' : ''}`}>L3: Cực nguy hại</span>
          </div>
        </div>
      </div>

      {/* Structured Alert Events Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#202B36] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202B36]">
                Nhật ký sự kiện & Cảnh báo an toàn
              </h3>
              <p className="text-[11px] text-[#64748B]">Danh sách các mốc cảnh báo ghi nhận gần đây</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
          <table className="w-full text-left text-xs text-[#202B36]">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Thiết bị / Cảm biến</th>
                <th className="px-4 py-3">Sự kiện</th>
                <th className="px-4 py-3">Mức độ cảnh báo</th>
                <th className="px-4 py-3">Trạng thái xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {/* Always show current alarm row if alarming */}
              {isAlarming && (
                <tr className="bg-red-50/70 hover:bg-red-50">
                  <td className="px-4 py-3 font-medium text-[#DC4545] flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Hiện tại (Thời gian thực)</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#202B36]">ESP32 Station #TD3 (MQ2/MQ3/MQ4)</td>
                  <td className="px-4 py-3 text-[#DC4545] font-bold">CẢNH BÁO LIÊN TỤC 3 LẦN VƯỢT NGƯỠNG NGUY HẠI</td>
                  <td className="px-4 py-3">
                    <span className="badge-critical font-bold">CỰC NGUY HẠI</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#DC4545]">
                    Đang kích hoạt còi cảnh báo
                  </td>
                </tr>
              )}

              {/* Current Status Row */}
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-[#64748B]">Bản ghi hiện thời</td>
                <td className="px-4 py-3 font-medium text-[#202B36]">ESP32 Station #TD3</td>
                <td className="px-4 py-3 text-[#64748B]">Trạng thái giám sát khí gas chu kỳ hiện tại</td>
                <td className="px-4 py-3">
                  <span className={currentLevelInfo.badge}>{currentLevelInfo.text}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#16A36A] font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoạt động bình thường</span>
                </td>
              </tr>

              {/* Historical abnormal events */}
              {alarmEvents.length > 0 ? (
                alarmEvents.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-[#64748B]">{evt.time}</td>
                    <td className="px-4 py-3 font-medium text-[#202B36]">{evt.sensor}</td>
                    <td className="px-4 py-3 text-[#202B36]">{evt.event}</td>
                    <td className="px-4 py-3">
                      <span className={
                        evt.level === 'L3' || evt.level === 'L2' ? 'badge-critical' : 'badge-warning'
                      }>
                        Level {evt.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{evt.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#64748B]">
                    Không có sự kiện vượt ngưỡng nào gần đây. Hệ thống duy trì mức an toàn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
