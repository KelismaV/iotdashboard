import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Papa from 'papaparse';

export default function DataTable({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    // Sort descending (newest first for table view)
    const reversed = [...data].reverse();

    return reversed.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        (item.formattedDate && item.formattedDate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.formattedTime && item.formattedTime.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.status && item.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.current_level && item.current_level.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (item.status && item.status.toUpperCase() === statusFilter.toUpperCase()) ||
        (item.current_level && item.current_level.toUpperCase() === statusFilter.toUpperCase());

      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const exportRows = filteredData.map((d) => ({
      'STT': d.id,
      'Ngày': d.formattedDate,
      'Thời Gian': d.formattedTime,
      'Trạng Thái': d.status,
      'Nhiệt Độ (°C)': d.temp,
      'Độ Ẩm (%)': d.humidity,
      'Khí MQ2 (Khói/LPG)': d.mq2,
      'Khí MQ3 (Cồn)': d.mq3,
      'Khí MQ4 (Methane)': d.mq4,
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ESP32_Sensor_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-6 space-y-4">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
          <span>Bảng Nhật Ký Đọc Cảm Biến ({filteredData.length} bản ghi)</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm ngày, giờ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/80 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/50 w-44"
            />
          </div>

          {/* Status/Level Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">Tất cả Cấp độ</option>
              <option value="L0" className="bg-slate-900 text-emerald-400">Level L0 (Bình thường)</option>
              <option value="L1" className="bg-slate-900 text-amber-400">Level L1 (Chú ý)</option>
              <option value="L2" className="bg-slate-900 text-rose-400">Level L2 (Cảnh báo)</option>
              <option value="L3" className="bg-slate-900 text-rose-500 font-bold">Level L3 (Nguy hiểm)</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-3 py-3">STT</th>
              <th className="px-3 py-3">Ngày & Giờ</th>
              <th className="px-3 py-3">Nhiệt Độ (°C)</th>
              <th className="px-3 py-3">Độ Ẩm (%)</th>
              <th className="px-3 py-3">MQ2 (Khói)</th>
              <th className="px-3 py-3">MQ3 (Cồn)</th>
              <th className="px-3 py-3">MQ4 (Methane)</th>
              <th className="px-3 py-3">Gas Index</th>
              <th className="px-3 py-3">% Biến Thiên</th>
              <th className="px-3 py-3">Level Hiện Tại</th>
              <th className="px-3 py-3">Level Dự Báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  Không tìm thấy bản ghi nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-slate-500">#{item.id}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-200">{item.formattedDateTime}</td>
                  <td className="px-3 py-2.5 font-semibold text-amber-400">{item.temp}°C</td>
                  <td className="px-3 py-2.5 font-semibold text-cyan-400">{item.humidity}%</td>
                  <td className="px-3 py-2.5 font-mono text-rose-300">{item.mq2}</td>
                  <td className="px-3 py-2.5 font-mono text-purple-300">{item.mq3}</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-300">{item.mq4}</td>
                  <td className="px-3 py-2.5 font-bold text-indigo-400">{item.gas_index || 0}</td>
                  <td className="px-3 py-2.5 font-mono text-violet-300">{item.gas_index_pct || 0}%</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {item.current_level || 'L0'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {item.predicted_level || 'L0'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
        <div className="flex items-center space-x-2">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 text-slate-200 px-2 py-1 rounded-lg border border-slate-800 focus:outline-none"
          >
            <option value={10}>10 dòng</option>
            <option value={15}>15 dòng</option>
            <option value={25}>25 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg glass-card hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Trang <strong className="text-slate-200">{currentPage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg glass-card hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
