import React, { useState } from 'react';
import { X, Save, RefreshCw, Link, Sliders, CheckCircle, AlertCircle } from 'lucide-react';
import { DEFAULT_SHEET_URL } from '../services/sheetService';

export default function SettingsModal({
  isOpen,
  onClose,
  sheetUrl,
  setSheetUrl,
  thresholds,
  setThresholds,
  onReloadData
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Cấu Hình Nguồn Dữ Liệu & Cảnh Báo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs text-slate-300">
          
          {/* Status Alert */}
          {statusMsg && (
            <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Google Sheet URL section */}
          <div>
            <label className="block font-semibold mb-1 text-slate-200 flex items-center space-x-1">
              <Link className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Sheet URL (Link chia sẻ công khai):</span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-900/90 text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Hệ thống tự động chuyển đổi sang URL xuất CSV real-time.
            </p>
          </div>

          {/* Threshold sliders */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              Cài Đặt Ngưỡng Cảnh Báo An Toàn:
            </h4>

            {/* Temp Limit */}
            <div>
              <div className="flex justify-between mb-1">
                <span>Ngưỡng Nhiệt Độ Cao (°C):</span>
                <strong className="text-amber-400 font-mono">{tempThresh}°C</strong>
              </div>
              <input
                type="range"
                min="25"
                max="50"
                step="0.5"
                value={tempThresh}
                onChange={(e) => setTempThresh(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* MQ2 Limit */}
            <div>
              <div className="flex justify-between mb-1">
                <span>Ngưỡng MQ2 (Khói/LPG PPM):</span>
                <strong className="text-rose-400 font-mono">{mq2Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={mq2Thresh}
                onChange={(e) => setMq2Thresh(e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* MQ3 Limit */}
            <div>
              <div className="flex justify-between mb-1">
                <span>Ngưỡng MQ3 (Cồn/Ethanol PPM):</span>
                <strong className="text-purple-400 font-mono">{mq3Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={mq3Thresh}
                onChange={(e) => setMq3Thresh(e.target.value)}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* MQ4 Limit */}
            <div>
              <div className="flex justify-between mb-1">
                <span>Ngưỡng MQ4 (Methane PPM):</span>
                <strong className="text-emerald-400 font-mono">{mq4Thresh} PPM</strong>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="5"
                value={mq4Thresh}
                onChange={(e) => setMq4Thresh(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-6">
          <button
            onClick={handleResetDefault}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Khôi phục mặc định
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition"
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
