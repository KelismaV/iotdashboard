import React, { useState } from 'react';
import { X, Save, Link, Sliders, CheckCircle, Trash2 } from 'lucide-react';
import { DEFAULT_SHEET_URL } from '../services/sheetService';

export default function SettingsModal({
  isOpen,
  onClose,
  sheetUrl,
  setSheetUrl,
  thresholds,
  setThresholds,
  onReloadData,
  onClearDatabase
}) {
  const [urlInput, setUrlInput] = useState(sheetUrl);
  const [tempThresh, setTempThresh] = useState(thresholds.tempHigh);
  const [mq2Thresh, setMq2Thresh] = useState(thresholds.mq2Warning);
  const [mq3Thresh, setMq3Thresh] = useState(thresholds.mq3Warning);
  const [mq4Thresh, setMq4Thresh] = useState(thresholds.mq4Warning);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setSheetUrl(urlInput);
    setThresholds((prev) => ({
      ...prev,
      tempHigh: Number(tempThresh),
      tempWarning: Number(tempThresh) - 3,
      mq2Warning: Number(mq2Thresh),
      mq2Critical: Number(mq2Thresh) + 200,
      mq3Warning: Number(mq3Thresh),
      mq3Critical: Number(mq3Thresh) + 200,
      mq4Warning: Number(mq4Thresh),
      mq4Critical: Number(mq4Thresh) + 100,
    }));

    setStatusMsg({ type: 'success', text: 'Cài đặt đã được lưu thành công!' });
    setTimeout(() => {
      onReloadData(urlInput);
      onClose();
    }, 600);
  };

  const handleResetDefault = () => {
    setUrlInput(DEFAULT_SHEET_URL);
    setTempThresh(35);
    setMq2Thresh(500);
    setMq3Thresh(500);
    setMq4Thresh(150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-xl border border-[#E2E8F0] shadow-2xl p-6 relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202B36]">Cấu hình Nguồn Dữ Liệu & Ngưỡng Cảnh Báo</h3>
              <p className="text-xs text-[#64748B]">Tùy chỉnh thông số vận hành trạm ESP32</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#202B36] hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs text-[#202B36]">
          
          {/* Status Alert */}
          {statusMsg && (
            <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-[#16A36A] flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Google Sheet URL section */}
          <div>
            <label className="block font-semibold mb-1 text-[#202B36] flex items-center space-x-1">
              <Link className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Google Sheet URL (Link chia sẻ công khai):</span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-white text-[#202B36] p-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] font-mono text-xs"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              Hệ thống tự động chuyển đổi sang endpoint CSV real-time.
            </p>
          </div>

          {/* Threshold sliders */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
            <h4 className="font-bold text-[#202B36] uppercase tracking-wider text-[11px]">
              Cài đặt ngưỡng cảnh báo an toàn:
            </h4>

            {/* Temp Limit */}
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="font-medium text-[#202B36]">Ngưỡng Nhiệt Độ Cao (°C):</span>
                <strong className="text-[#D99018] font-bold">{tempThresh}°C</strong>
              </div>
              <input
                type="range"
                min="25"
                max="50"
                step="0.5"
                value={tempThresh}
                onChange={(e) => setTempThresh(e.target.value)}
                className="w-full accent-[#D99018] cursor-pointer"
              />
            </div>

            {/* MQ2 Limit */}
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="font-medium text-[#202B36]">Ngưỡng Khí MQ2 (PPM):</span>
                <strong className="text-[#DC4545] font-bold">{mq2Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={mq2Thresh}
                onChange={(e) => setMq2Thresh(e.target.value)}
                className="w-full accent-[#DC4545] cursor-pointer"
              />
            </div>

            {/* MQ3 Limit */}
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="font-medium text-[#202B36]">Ngưỡng Khí MQ3 (PPM):</span>
                <strong className="text-[#8B5CF6] font-bold">{mq3Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={mq3Thresh}
                onChange={(e) => setMq3Thresh(e.target.value)}
                className="w-full accent-[#8B5CF6] cursor-pointer"
              />
            </div>

            {/* MQ4 Limit */}
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between mb-1.5 text-xs">
                <span className="font-medium text-[#202B36]">Ngưỡng Khí MQ4 (PPM):</span>
                <strong className="text-[#16A36A] font-bold">{mq4Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="5"
                value={mq4Thresh}
                onChange={(e) => setMq4Thresh(e.target.value)}
                className="w-full accent-[#16A36A] cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-[#E2E8F0] mt-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetDefault}
              className="text-xs text-[#64748B] hover:text-[#202B36] underline"
            >
              Khôi phục mặc định
            </button>
            {onClearDatabase && (
              <button
                onClick={async () => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa sạch dữ liệu mẫu cũ để bắt đầu dữ liệu thực từ Google Sheet mới?')) {
                    await onClearDatabase();
                    setStatusMsg({ type: 'success', text: 'Đã xóa toàn bộ dữ liệu cũ! Sẵn sàng đón dữ liệu mới.' });
                  }
                }}
                className="flex items-center space-x-1 text-xs text-[#DC4545] hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa dữ liệu cũ</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu & Tải Lại</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
