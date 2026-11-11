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
        (item.formattedDateTime && item.formattedDateTime.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      'Khí MQ2': d.mq2,
      'Khí MQ3': d.mq3,
      'Khí MQ4': d.mq4,
      'Gas Index': d.gas_index,
      '% Biến Thiên': d.gas_index_pct,
      'Level Hiện Tại': d.current_level,
      'Level Dự Báo': d.predicted_level,
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ESP32_Sensor_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeForLevel = (lvl) => {
    if (lvl === 'L3' || lvl === 'L2') return 'badge-critical';
    if (lvl === 'L1') return 'badge-warning';
    return 'badge-normal';
  };

  return (
    <div className="card p-6 mb-6 space-y-4">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#202B36]">
            Bảng nhật ký đọc cảm biến
          </h3>
          <p className="text-xs text-[#64748B]">Tổng cộng {filteredData.length} bản ghi phù hợp bộ lọc</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm ngày, giờ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white text-xs text-[#202B36] placeholder-[#94A3B8] pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] w-40 sm:w-48"
            />
          </div>

          {/* Status/Level Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]">
            <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-[#202B36] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Cấp độ</option>
              <option value="L0">Mức L0 - An toàn</option>
              <option value="L1">Mức L1 - Trung bình</option>
              <option value="L2">Mức L2 - Cảnh báo</option>
              <option value="L3">Mức L3 - Nguy hiểm</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
        <table className="w-full text-left text-xs text-[#202B36]">
          <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[10px] tracking-wider border-b border-[#E2E8F0]">
            <tr>
              <th className="px-3 py-3">STT</th>
              <th className="px-3 py-3">Ngày & Giờ</th>
              <th className="px-3 py-3">Nhiệt Độ (°C)</th>
              <th className="px-3 py-3">Độ Ẩm (%)</th>
              <th className="px-3 py-3">MQ2</th>
              <th className="px-3 py-3">MQ3</th>
              <th className="px-3 py-3">MQ4</th>
              <th className="px-3 py-3">Gas Index</th>
              <th className="px-3 py-3">% Biến Thiên</th>
              <th className="px-3 py-3">Level Hiện Tại</th>
              <th className="px-3 py-3">Level Dự Báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-[#64748B]">
                  Không tìm thấy bản ghi nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-3 py-2.5 font-mono text-[#64748B]">#{item.id}</td>
                  <td className="px-3 py-2.5 font-medium text-[#202B36]">{item.formattedDateTime}</td>
                  <td className="px-3 py-2.5 font-semibold text-[#D99018]">{item.temp}°C</td>
                  <td className="px-3 py-2.5 font-semibold text-[#2563EB]">{item.humidity}%</td>
                  <td className="px-3 py-2.5 font-mono text-[#DC4545]">{item.mq2}</td>
                  <td className="px-3 py-2.5 font-mono text-[#8B5CF6]">{item.mq3}</td>
                  <td className="px-3 py-2.5 font-mono text-[#16A36A]">{item.mq4}</td>
                  <td className="px-3 py-2.5 font-bold text-[#2563EB]">{item.gas_index || 0}</td>
                  <td className="px-3 py-2.5 font-mono text-[#64748B]">{item.gas_index_pct || 0}%</td>
                  <td className="px-3 py-2.5">
                    <span className={getBadgeForLevel(item.current_level || 'L0')}>
                      {item.current_level || 'L0'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={getBadgeForLevel(item.predicted_level || 'L0')}>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] pt-2">
        <div className="flex items-center space-x-2">
          <span>Hiển thị mỗi trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white text-[#202B36] px-2.5 py-1 rounded-md border border-[#E2E8F0] focus:outline-none"
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
            className="p-1.5 rounded-md bg-white border border-[#E2E8F0] hover:text-[#2563EB] hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Trang <strong className="text-[#202B36]">{currentPage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md bg-white border border-[#E2E8F0] hover:text-[#2563EB] hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
