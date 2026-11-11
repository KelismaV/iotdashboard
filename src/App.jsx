import React, { useState, useEffect, useCallback } from 'react';
import KPICards from './components/KPICards';
import TimeFilter from './components/TimeFilter';
import DashboardCharts from './components/DashboardCharts';
import SafetyAlert from './components/SafetyAlert';
import PredictivePanel from './components/PredictivePanel';
import DataTable from './components/DataTable';
import SettingsModal from './components/SettingsModal';

import { 
  fetchServerStatus, 
  fetchKPIMetrics, 
  fetchChartData, 
  updateServerSettings,
  subscribeToSensorStream,
  clearDatabase,
  fetchStreamMode,
  toggleStreamMode
} from './services/api';

import { DEFAULT_SHEET_URL } from './services/sheetService';
import { DEFAULT_THRESHOLDS } from './services/analyticsService';
import { 
  BarChart2, 
  Activity, 
  TrendingUp, 
  BrainCircuit, 
  Bell, 
  Table, 
  Settings, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  Zap, 
  Menu, 
  X, 
  AlertCircle, 
  Cpu, 
  Radio
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('day');
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [refreshInterval, setRefreshInterval] = useState(4000);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const [kpiData, setKpiData] = useState(null);
  const [chartPoints, setChartPoints] = useState([]);
  const [statusInfo, setStatusInfo] = useState({ isConnected: true, recordCount: 0, lastSyncTime: null });
  const [filteredCount, setFilteredCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveRealtime, setLiveRealtime] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync initial stream mode from backend
  useEffect(() => {
    fetchStreamMode()
      .then((res) => {
        if (res && res.success && typeof res.liveRealtime === 'boolean') {
          setLiveRealtime(res.liveRealtime);
        }
      })
      .catch((e) => console.error('Fetch stream mode error:', e));
  }, []);

  const handleToggleLiveStream = async () => {
    const nextMode = !liveRealtime;
    setLiveRealtime(nextMode);
    try {
      const res = await toggleStreamMode(nextMode);
      if (res && res.success && typeof res.liveRealtime === 'boolean') {
        setLiveRealtime(res.liveRealtime);
      }
    } catch (err) {
      console.error('Error toggling stream mode:', err);
    }
  };

  // Fast API Fetching from Node.js Express Backend
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const [statusRes, kpiRes, chartRes] = await Promise.all([
        fetchServerStatus(),
        fetchKPIMetrics(timeframe),
        fetchChartData(timeframe),
      ]);

      setStatusInfo(statusRes);
      if (kpiRes.success) {
        setKpiData(kpiRes.metrics);
        if (kpiRes.filteredCount !== undefined) {
          setFilteredCount(kpiRes.filteredCount);
        }
        if (kpiRes.thresholds) setThresholds(kpiRes.thresholds);
      }
      if (chartRes.success && chartRes.points) {
        if (!isSilent) {
          setChartPoints(chartRes.points);
        } else {
          setChartPoints((prev) => {
            if (!prev || prev.length === 0) return chartRes.points;
            const lastPrevTs = prev[prev.length - 1]?.timestamp || 0;
            const newPoints = chartRes.points.filter((p) => p.timestamp > lastPrevTs);
            if (newPoints.length === 0) return prev;
            const merged = [...prev, ...newPoints];
            return merged.length > 120 ? merged.slice(merged.length - 120) : merged;
          });
        }
      }
    } catch (err) {
      console.error('Backend API error:', err);
      setError(err.message || 'Không thể kết nối đến Node.js Express Backend (Port 5000)');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  // Initial Load
  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  // Real-Time SSE Stream Listener
  useEffect(() => {
    const unsubscribe = subscribeToSensorStream((eventData) => {
      if (eventData.type === 'NEW_READING' && eventData.record) {
        const newRec = eventData.record;

        setChartPoints((prev) => {
          if (!prev || prev.length === 0) return [newRec];
          if (prev[prev.length - 1]?.timestamp === newRec.timestamp) return prev;
          const updated = [...prev, newRec];
          return updated.length > 120 ? updated.slice(updated.length - 120) : updated;
        });

        setFilteredCount((prev) => (prev > 0 ? prev + 1 : prev));

        setStatusInfo((prev) => ({
          ...prev,
          recordCount: (prev.recordCount || 0) + 1,
          lastSyncTime: newRec.timestamp,
          syncStatus: `SSE Live (${newRec.temp}°C | MQ4: ${newRec.mq4} PPM)`,
        }));

        setKpiData((prevKpi) => {
          if (!prevKpi) return null;
          return {
            ...prevKpi,
            temp: { ...prevKpi.temp, current: newRec.temp },
            humidity: { ...prevKpi.humidity, current: newRec.humidity },
            mq2: { ...prevKpi.mq2, current: newRec.mq2 },
            mq3: { ...prevKpi.mq3, current: newRec.mq3 },
            mq4: { ...prevKpi.mq4, current: newRec.mq4 },
          };
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Polling Interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadDashboardData(true);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, loadDashboardData]);

  // Load Forecasts when Analytics Tab is active — PredictivePanel uses chartPoints directly

  // Handle Clear Database
  const handleClearDatabase = async () => {
    try {
      await clearDatabase();
      setChartPoints([]);
      setKpiData(null);
      await loadDashboardData(false);
    } catch (err) {
      console.error('Lỗi xóa database:', err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: BarChart2 },
    { id: 'analytics', label: 'Dự đoán xu hướng (ML)', icon: BrainCircuit },
    { id: 'safety', label: 'Cảnh báo an toàn', icon: Bell },
    { id: 'table', label: 'Lịch sử dữ liệu', icon: Table },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tổng quan trạm giám sát';
      case 'analytics':
        return 'Dự đoán xu hướng (Machine Learning)';
      case 'safety':
        return 'Hệ thống giám sát & Cảnh báo an toàn';
      case 'table':
        return 'Nhật ký dữ liệu cảm biến';
      default:
        return 'IoT Monitoring Dashboard';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F5F7] text-[#202B36]">
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar: Dark Navy (#17212B), w-60 fixed on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#17212B] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm font-bold">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                  IoT Monitoring
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  ESP32 Station #TD3
                </p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Điều hướng
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Device Status Panel */}
        <div className="p-4 border-t border-slate-800 bg-[#131B24]">
          <div className="rounded-lg bg-[#1A2530] p-3 text-xs space-y-2 border border-slate-700/50 mb-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>ESP32 Station</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Online</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Tổng bản ghi:</span>
                <span className="text-slate-200 font-medium">{statusInfo.recordCount ? statusInfo.recordCount.toLocaleString('vi-VN') : 0}</span>
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt hệ thống</span>
          </button>
        </div>
      </aside>

      {/* Main Area: margin left on desktop to accommodate w-60 sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-60">
        
        {/* Top Header Bar: Pure White (#FFFFFF), h-14, border-b #E2E8F0 */}
        <header className="h-14 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#202B36] hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#202B36] leading-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Live Stream Mode Button */}
            <button
              onClick={handleToggleLiveStream}
              title={
                liveRealtime
                  ? 'Live Stream ON: Đang nhận dữ liệu thực tế từ Google Sheet'
                  : 'Live Stream OFF: Đang chạy dữ liệu mô phỏng'
              }
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition ${
                liveRealtime
                  ? 'bg-emerald-50 text-[#16A36A] border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-[#D99018] border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${liveRealtime ? 'fill-[#16A36A]' : ''}`} />
              <span className="hidden sm:inline">
                {liveRealtime ? 'Live: ON (Thực tế)' : 'Live: OFF (Mô phỏng)'}
              </span>
              <span className="sm:hidden">
                {liveRealtime ? 'LIVE' : 'SIM'}
              </span>
            </button>

            {/* Auto refresh interval dropdown */}
            <div className="hidden sm:flex items-center space-x-1 text-xs text-[#64748B] bg-slate-50 border border-[#E2E8F0] px-2.5 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-[#202B36] font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value={3000}>Tự động 3s</option>
                <option value={5000}>Tự động 5s</option>
                <option value={10000}>Tự động 10s</option>
                <option value={30000}>Tự động 30s</option>
                <option value={0}>Tắt tự động</option>
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              title="Cập nhật dữ liệu ngay"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#202B36] hover:bg-slate-50 transition disabled:opacity-50 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
              <span className="hidden lg:inline text-xs font-medium">Làm mới</span>
            </button>

            {/* Connection Indicator */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50 text-xs">
              {statusInfo.isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
                  <span className="text-[#16A36A] font-semibold">Kết nối tốt</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#DC4545]"></span>
                  <span className="text-[#DC4545] font-semibold">Mất kết nối</span>
                </>
              )}
            </div>

            {/* Settings button on header */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Cài đặt hệ thống"
              className="p-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#202B36] hover:bg-slate-50 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F5F7]">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-[#DC4545] p-4 rounded-lg mb-6 flex items-start justify-between text-xs">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-[#DC4545] shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800">Lỗi Kết Nối Backend Express (Port 5000)</h4>
                  <p className="text-red-700">{error}. Hãy chắc chắn server Backend Node.js đang chạy.</p>
                </div>
              </div>
              <button
                onClick={() => loadDashboardData(false)}
                className="px-3 py-1.5 rounded-md bg-white border border-red-300 font-semibold hover:bg-red-100 transition"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Initial Loading Screen */}
          {isLoading ? (
            <div className="card p-12 text-center space-y-4 my-8">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-[#2563EB] animate-spin"></div>
                <Activity className="w-6 h-6 text-[#2563EB] absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-[#202B36]">Đang nạp dữ liệu trạm ESP32...</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Nhận dữ liệu từ cổng 5000 và luồng thời gian thực SSE.
              </p>
            </div>
          ) : (
            <>
              {/* Quick Status Bar */}
              <div className="card p-3.5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#202B36]">ESP32 Station #TD3</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        liveRealtime
                          ? 'bg-emerald-50 text-[#16A36A] border-emerald-200'
                          : 'bg-amber-50 text-[#D99018] border-amber-200'
                      }`}>
                        {liveRealtime ? 'Dữ liệu Thực tế (Google Sheet)' : 'Dữ liệu Mô phỏng'}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-[11px] mt-0.5">
                      Tổng bản ghi: <strong className="text-[#202B36]">{statusInfo.recordCount ? statusInfo.recordCount.toLocaleString('vi-VN') : 0}</strong>
                      {statusInfo.lastSyncTime && (
                        <span> | Cập nhật gần nhất: <strong className="text-[#202B36]">{new Date(statusInfo.lastSyncTime).toLocaleTimeString('vi-VN')}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start md:self-auto bg-slate-50 px-3 py-1.5 rounded-md border border-[#E2E8F0]">
                  <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse"></span>
                  <span className="font-medium text-[#202B36]">
                    {statusInfo.syncStatus || 'Hệ thống đang hoạt động ổn định'}
                  </span>
                </div>
              </div>

              {/* KPI Cards section (Shared or Dashboard tab) */}
              <KPICards kpiData={kpiData} thresholds={thresholds} />

              {/* Time Filter Bar */}
              <TimeFilter
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                totalCount={statusInfo.recordCount}
                filteredCount={filteredCount || chartPoints.length}
              />

              {/* Tab Views */}
              {activeTab === 'dashboard' && (
                <DashboardCharts data={chartPoints} thresholds={thresholds} />
              )}

              {activeTab === 'analytics' && (
                <PredictivePanel data={chartPoints} thresholds={thresholds} />
              )}

              {activeTab === 'safety' && (
                <SafetyAlert data={chartPoints} />
              )}

              {activeTab === 'table' && (
                <DataTable data={chartPoints} />
              )}
            </>
          )}

        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        onReloadData={(newUrl) => {
          updateServerSettings(newUrl, thresholds).then(() => loadDashboardData(false));
        }}
        onClearDatabase={handleClearDatabase}
      />

    </div>
  );
}
