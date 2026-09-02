import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import KPICards from './components/KPICards';
import TimeFilter from './components/TimeFilter';
import DashboardCharts from './components/DashboardCharts';
import SafetyEvaluation from './components/SafetyEvaluation';
import PredictivePanel from './components/PredictivePanel';
import DataTable from './components/DataTable';
import SettingsModal from './components/SettingsModal';

import { 
  fetchServerStatus, 
  fetchKPIMetrics, 
  fetchChartData, 
  fetchForecasts,
  updateServerSettings,
  subscribeToSensorStream
} from './services/api';

import { DEFAULT_SHEET_URL } from './services/sheetService';
import { DEFAULT_THRESHOLDS } from './services/analyticsService';
import { AlertCircle, Activity, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('day');
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [refreshInterval, setRefreshInterval] = useState(4000);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const [kpiData, setKpiData] = useState(null);
  const [chartPoints, setChartPoints] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [statusInfo, setStatusInfo] = useState({ isConnected: true, recordCount: 0, lastSyncTime: null });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fast API Fetching from Node.js Express Backend
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      // Parallel lightweight JSON API calls (takes < 10ms!)
      const [statusRes, kpiRes, chartRes] = await Promise.all([
        fetchServerStatus(),
        fetchKPIMetrics(timeframe),
        fetchChartData(timeframe),
      ]);

      setStatusInfo(statusRes);
      if (kpiRes.success) {
        setKpiData(kpiRes.metrics);
        if (kpiRes.thresholds) setThresholds(kpiRes.thresholds);
      }
      if (chartRes.success) {
        setChartPoints(chartRes.points);
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

  // Real-time Polling Interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadDashboardData(true);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, loadDashboardData]);

  // Load Forecasts when Analytics Tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchForecasts()
        .then(res => {
          if (res.success) setForecastData(res);
        })
        .catch(console.error);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen pb-12 selection:bg-cyan-500 selection:text-white">
      
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={statusInfo.isConnected}
        isRefreshing={isRefreshing}
        lastUpdatedStr={statusInfo.lastSyncTime ? new Date(statusInfo.lastSyncTime).toLocaleTimeString('vi-VN') : ''}
        onManualRefresh={() => loadDashboardData(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Error Banner */}
        {error && (
          <div className="glass-panel border-rose-500/40 bg-rose-500/10 p-4 rounded-2xl mb-6 flex items-start justify-between text-rose-300 text-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h4 className="font-bold">Lỗi Kết Nối Backend Express (Port 5000)</h4>
                <p>{error}. Hãy chắc chắn server Backend Node.js đang chạy.</p>
              </div>
            </div>
            <button
              onClick={() => loadDashboardData(false)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 font-semibold transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Initial Loading Screen */}
        {isLoading ? (
          <div className="glass-panel p-16 rounded-3xl text-center space-y-4 my-12">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
              <Activity className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Đang Kết Nối Express Backend Server...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Nhận dữ liệu JSON siêu tốc từ cổng 5000 (Thời gian load dưới 5ms)
            </p>
          </div>
        ) : (
          <>
            {/* Top Device Banner & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl mb-4 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-slate-100">ESP32 Sensor Station #TD3</h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Express Backend Live</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tổng bản ghi: <strong className="text-slate-200">{statusInfo.recordCount ? statusInfo.recordCount.toLocaleString('vi-VN') : 0}</strong> | Đồng bộ nền: <strong className="text-slate-200">{statusInfo.lastSyncTime ? new Date(statusInfo.lastSyncTime).toLocaleTimeString('vi-VN') : 'Đang khởi tạo'}</strong>
                  </p>
                </div>
              </div>

              {/* Live Backend Sync Status Message */}
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                {statusInfo.syncStatus ? (
                  <span className="font-medium text-cyan-300">{statusInfo.syncStatus}</span>
                ) : (
                  <span className="font-medium text-cyan-300">Đã nạp xong toàn bộ dữ liệu</span>
                )}
              </div>
            </div>

            {/* KPI Cards section */}
            <KPICards kpiData={kpiData} thresholds={thresholds} />

            {/* Time Filter Bar */}
            <TimeFilter
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              totalCount={statusInfo.recordCount}
              filteredCount={chartPoints.length}
            />

            {/* Tab Views */}
            {activeTab === 'dashboard' && (
              <>
                <DashboardCharts data={chartPoints} thresholds={thresholds} />
                <SafetyEvaluation latestRecord={chartPoints[chartPoints.length - 1]} thresholds={thresholds} />
              </>
            )}

            {activeTab === 'analytics' && (
              <PredictivePanel data={chartPoints} thresholds={thresholds} />
            )}

            {activeTab === 'safety' && (
              <SafetyEvaluation latestRecord={chartPoints[chartPoints.length - 1]} thresholds={thresholds} />
            )}

            {activeTab === 'table' && (
              <DataTable data={chartPoints} />
            )}
          </>
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        thresholds={thresholds}
        setThresholds={setThresholds}
        onReloadData={(newUrl) => {
          updateServerSettings(newUrl, thresholds).then(() => loadDashboardData(false));
        }}
      />

    </div>
  );
}
