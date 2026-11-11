import React, { useState } from 'react';
import { X, Save, Link, Sliders, CheckCircle, Trash2, Database, ShieldCheck } from 'lucide-react';
import { DEFAULT_SHEET_URL } from '../services/sheetService';

export default function SettingsModal({
  isOpen,
  onClose,
  sheetUrl,
  setSheetUrl,
  onReloadData,
  onClearDatabase
}) {
  const [urlInput, setUrlInput] = useState(sheetUrl);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setSheetUrl(urlInput);
    setStatusMsg({ type: 'success', text: 'Cài đặt liên kết đã được lưu thành công!' });
    setTimeout(() => {
      onReloadData(urlInput);
      onClose();
    }, 600);
  };

  const handleResetDefault = () => {
    setUrlInput(DEFAULT_SHEET_URL);
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
              <h3 className="text-base font-bold text-[#202B36]">Cấu hình Nguồn Dữ Liệu & Đồng Bộ</h3>
              <p className="text-xs text-[#64748B]">Quản lý kết nối trạm quan trắc IoT</p>
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
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Google Sheet URL section */}
          <div>
            <label className="block font-semibold mb-1.5 text-[#202B36] flex items-center space-x-1.5">
              <Link className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Google Sheet URL (Link bảng tính chia sẻ công khai):</span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-white text-[#202B36] p-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] font-mono text-xs"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
            <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
              Hệ thống tự động phát hiện mã tab tháng (<code className="bg-slate-100 px-1 py-0.5 rounded text-[#202B36]">gid</code>) và chuyển luồng đồng bộ theo chu kỳ thời gian thực.
            </p>
          </div>

          {/* Phân loại cảnh báo K-Means Explanation */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center space-x-2 text-[#202B36] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
              <span>Cơ chế cảnh báo thông minh K-Means</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Theo phương pháp nghiên cứu, hệ thống <strong>không dùng ngưỡng tĩnh cố định</strong> (nhằm triệt tiêu hiện tượng trôi dạt cảm biến). Mức cảnh báo được tự động phân lớp thành 4 mức rủi ro dựa trên phương sai biến thiên thực tế của chỉ số Gas Index:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1">
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <strong className="text-[#16A36A]">L0 (An toàn):</strong> ≤ -13.1%
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <strong className="text-[#D99018]">L1 (Trung bình):</strong> -13.1% → 33.1%
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <strong className="text-[#EA580C]">L2 (Cao):</strong> 33.1% → 176.9%
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <strong className="text-[#DC4545]">L3 (Rất cao):</strong> &gt; 176.9%
              </div>
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
              Link mặc định
            </button>
            {onClearDatabase && (
              <button
                onClick={async () => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu cục bộ và đồng bộ lại từ đầu từ Google Sheets?')) {
                    await onClearDatabase();
                    setStatusMsg({ type: 'success', text: 'Đã hoàn tất đồng bộ lại toàn bộ dữ liệu từ Sheet!' });
                  }
                }}
                className="flex items-center space-x-1 text-xs text-[#DC4545] hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md border border-red-200 transition font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Đồng bộ mới lại từ Sheet</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 text-xs font-semibold transition"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
