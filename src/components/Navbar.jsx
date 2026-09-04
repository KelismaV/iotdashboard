import { 
  Activity, 
  RefreshCw, 
  Settings, 
  Wifi, 
  WifiOff, 
  BarChart2, 
  ShieldAlert, 
  Table, 
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  isRefreshing,
  lastUpdatedStr,
  onManualRefresh,
  onOpenSettings,
  refreshInterval,
  setRefreshInterval,
  simulatorEnabled,
  onToggleSimulator
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard Tổng Quan', icon: BarChart2 },
    { id: 'analytics', label: 'Đánh Giá & Dự Đoán', icon: TrendingUp },
    { id: 'safety', label: 'Cảnh Báo An Toàn', icon: ShieldAlert },
    { id: 'table', label: 'Lịch Sử Dữ Liệu', icon: Table },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white animate-pulse-slow">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  ESP32 Real-Time IoT
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Giám sát Cảm biến & Dự đoán Xu hướng
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Real-time Status & Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Real-time Simulator Toggle Button */}
            <button
              onClick={onToggleSimulator}
              title={simulatorEnabled ? 'Tắt bộ sinh dữ liệu Real-time' : 'Bật bộ sinh dữ liệu Real-time (Đảm bảo số liệu luôn biến thiên)'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                simulatorEnabled
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${simulatorEnabled ? 'text-amber-400 fill-amber-400/30 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{simulatorEnabled ? 'Live Stream On' : 'Live Stream Off'}</span>
            </button>

            {/* Connection Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg glass-card text-xs">
              {isConnected ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Real-time</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Auto refresh interval dropdown */}
            <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-400 glass-card px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value={3000} className="bg-slate-900 text-slate-200">Tự động 3s</option>
                <option value={5000} className="bg-slate-900 text-slate-200">Tự động 5s</option>
                <option value={10000} className="bg-slate-900 text-slate-200">Tự động 10s</option>
                <option value={30000} className="bg-slate-900 text-slate-200">Tự động 30s</option>
                <option value={0} className="bg-slate-900 text-slate-200">Tắt tự động</option>
              </select>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              title="Cập nhật dữ liệu mới nhất"
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              title="Cài đặt kết nối & Ngưỡng"
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-lg ${
                  isActive ? 'text-cyan-400 font-medium' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
