import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Wind, Bell, CheckCircle2, Clock, Info } from 'lucide-react';

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
    'L0': { text: 'Mức L0 - An toàn', badge: 'badge-normal', barClass: 'bg-[#16A36A]' },
    'L1': { text: 'Mức L1 - Trung bình', badge: 'badge-warning', barClass: 'bg-[#D99018]' },
    'L2': { text: 'Mức L2 - Cảnh báo', badge: 'badge-critical', barClass: 'bg-[#EA580C]' },
    'L3': { text: 'Mức L3 - Nguy hiểm', badge: 'badge-critical', barClass: 'bg-[#DC4545]' }
  };

  const currentLevelInfo = levelMap[currentPred] || levelMap['L0'];

  // Cấu hình linh hoạt 3 trạng thái của Box Cảnh Báo Chính
  const getBannerConfig = () => {
    if (isAlarming || currentPred === 'L2' || currentPred === 'L3') {
      return {
        borderClass: 'border-l-[#DC4545] bg-red-50/60',
        iconBg: 'bg-red-100 text-[#DC4545]',
        Icon: AlertTriangle,
        iconAnimation: 'animate-bounce',
        title: 'CẢNH BÁO: PHÁT HIỆN NGUY CƠ Ô NHIỄM KHÍ GAS',
        titleColor: 'text-[#DC4545]',
        badgeText: 'BÁO ĐỘNG BẬT',
        badgeClass: 'badge-critical',
        desc: 'Nồng độ khí gas vượt ngưỡng an toàn liên tiếp. Cần bật thông gió hoặc kiểm tra phòng khám ngay.',
        statusText: '⚠️ Cần xử lý ngay'
      };
    }
    if (currentPred === 'L1') {
      return {
        borderClass: 'border-l-[#D99018] bg-amber-50/60',
        iconBg: 'bg-amber-100 text-[#D99018]',
        Icon: Info,
        iconAnimation: '',
        title: 'MÔI TRƯỜNG TRUNG BÌNH - CẤP ĐỘ L1',
        titleColor: 'text-[#B45309]',
        badgeText: 'THEO DÕI L1',
        badgeClass: 'badge-warning',
        desc: 'Nồng độ khí gas tăng nhẹ, vẫn trong ngưỡng an toàn. Hệ thống đang tiếp tục theo dõi.',
        statusText: '👀 Đang theo dõi'
      };
    }
    return {
      borderClass: 'border-l-[#16A36A] bg-emerald-50/40',
      iconBg: 'bg-emerald-100 text-[#16A36A]',
      Icon: ShieldCheck,
      iconAnimation: '',
      title: 'MÔI TRƯỜNG AN TOÀN - CẤP ĐỘ L0',
      titleColor: 'text-[#16A36A]',
      badgeText: 'AN TOÀN L0',
      badgeClass: 'badge-normal',
      desc: 'Tất cả các thông số khí gas và nhiệt ẩm đều ở mức an toàn, không khí trong lành.',
      statusText: '✅ Giám sát liên tục'
    };
  };

  const banner = getBannerConfig();
  const BannerIcon = banner.Icon;

  return (
    <div className="space-y-6 mb-6">
      
      {/* Box Cảnh Báo Chính - 3 Mức Linh Hoạt (L0 - L1 - L2/L3) */}
      <div className={`card p-6 border-l-4 transition-all duration-300 ${banner.borderClass}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${banner.iconBg}`}>
              <BannerIcon className={`w-6 h-6 ${banner.iconAnimation}`} />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="alert-box" className={`text-base sm:text-lg font-bold uppercase tracking-wide ${banner.titleColor}`}>
                  {banner.title}
                </h2>
                <span className={banner.badgeClass}>
                  {banner.badgeText}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {banner.desc}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] text-[#64748B]">Trạng thái hệ thống:</p>
            <span className="text-xs font-bold text-[#202B36]">
              {banner.statusText}
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
                Dự báo chu kỳ 3 phút tới (Mô hình MOLR t+6)
              </h3>
              <p className="text-[11px] text-[#64748B]">Ánh xạ ranh giới phân cụm K-Means kết hợp bộ lọc xác nhận Debounce (N=3)</p>
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
            <span className={`w-1/4 text-center ${currentPred === 'L0' ? 'text-[#16A36A] font-bold' : ''}`}>L0: An toàn</span>
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
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Thiết bị / Cảm biến</th>
                <th className="py-2.5 px-3">Sự kiện</th>
                <th className="py-2.5 px-3">Mức độ</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {alarmEvents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#64748B] text-xs">
                    <CheckCircle2 className="w-6 h-6 text-[#16A36A] mx-auto mb-1.5 opacity-60" />
                    Chưa có sự kiện cảnh báo nào được ghi nhận trong ca trực này.
                  </td>
                </tr>
              ) : (
                alarmEvents.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#64748B] flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{evt.time}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#202B36]">{evt.sensor}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{evt.event}</td>
                    <td className="py-2.5 px-3">
                      <span className={levelMap[evt.level]?.badge || 'badge-normal'}>
                        {evt.level === 'L3' ? 'Cực nguy hại (L3)' : evt.level === 'L2' ? 'Gây hại (L2)' : 'Trung bình (L1)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-semibold ${evt.status.includes('chuông') ? 'text-[#DC4545]' : 'text-[#64748B]'}`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
