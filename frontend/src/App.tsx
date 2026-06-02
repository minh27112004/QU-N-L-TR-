import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Finance from './pages/Finance';
import Services from './pages/Services';
import { authService } from './services/api';
import { Home, BedDouble, Users, FileSignature, ReceiptText, Menu, X, Landmark, TrendingUp, Sliders, User, Lock, LogOut, AlertCircle } from 'lucide-react';

type TabType = 'dashboard' | 'rooms' | 'tenants' | 'contracts' | 'payments' | 'services' | 'finance';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    try {
      setLoginLoading(true);
      setLoginError(null);
      const response = await authService.login(username, password);
      const { token: userToken } = response.data;
      localStorage.setItem('auth_token', userToken);
      setToken(userToken);
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Sai tên đăng nhập hoặc mật khẩu.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
    }
  };

  // Navigation Links
  const navItems = [
    { id: 'dashboard', name: 'Tổng quan', icon: Home },
    { id: 'rooms', name: 'Phòng trọ', icon: BedDouble },
    { id: 'tenants', name: 'Khách thuê', icon: Users },
    { id: 'contracts', name: 'Hợp đồng', icon: FileSignature },
    { id: 'payments', name: 'Phiếu thu tiền', icon: ReceiptText },
    { id: 'services', name: 'Cấu hình & Dịch vụ', icon: Sliders },
    { id: 'finance', name: 'Thu chi / Tài chính', icon: TrendingUp },
  ];

  // Helper to get active tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tổng quan hệ thống';
      case 'rooms': return 'Quản lý phòng trọ';
      case 'tenants': return 'Quản lý khách thuê';
      case 'contracts': return 'Hợp đồng cho thuê';
      case 'payments': return 'Hóa đơn & Phiếu thu';
      case 'services': return 'Cấu hình đơn giá & dịch vụ';
      case 'finance': return 'Thống kê Thu - Chi & Tài chính';
      default: return 'Quản lý nhà trọ';
    }
  };

  // Render Page Component dynamically
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={(tab) => setActiveTab(tab as TabType)} />;
      case 'rooms':
        return <Rooms />;
      case 'tenants':
        return <Tenants />;
      case 'contracts':
        return <Contracts />;
      case 'payments':
        return <Payments />;
      case 'services':
        return <Services />;
      case 'finance':
        return <Finance />;
      default:
        return <Dashboard setActiveTab={(tab) => setActiveTab(tab as TabType)} />;
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow decorative effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="glass-panel w-full max-w-md rounded-3xl p-8 border-slate-800/80 bg-[#0a0f1d]/90 shadow-2xl relative z-10 animate-scale-up">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/5">
              <Landmark className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">Quản Lý Nhà Trọ</h2>
            <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Bản nội bộ bảo mật</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition duration-155 shadow-lg shadow-indigo-600/35 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex relative overflow-x-hidden">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 glass-panel border-r border-slate-800/80 bg-[#0a0f1d]/90 fixed inset-y-0 left-0 z-30">
        {/* Logo Section */}
        <div className="h-20 flex items-center gap-3 px-8 border-b border-slate-800/60">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-white leading-none">QUẢN LÝ NHÀ TRỌ</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Bản nội bộ</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border-l-4 border-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Profile Card Bottom */}
        <div className="p-6 border-t border-slate-800/60 bg-slate-900/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black shadow-md flex-shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white leading-tight truncate">Admin Minh</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">Quản trị viên</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition duration-150 cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR (Drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          
          {/* Drawer content */}
          <aside className="relative flex flex-col w-72 bg-[#090d18] border-r border-slate-800 h-full p-6 animate-slide-in-right">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2 mb-10 mt-2">
              <Landmark className="w-6 h-6 text-indigo-400" />
              <h2 className="text-base font-extrabold tracking-tight text-white uppercase">Quản Lý Nhà Trọ</h2>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
            
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                  AD
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Admin Minh</div>
                  <div className="text-[10px] text-slate-500">Quản trị viên</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        
        {/* TOP BAR / HEADER */}
        <header className="h-20 glass-panel border-b border-slate-800/80 bg-[#0a0f1d]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide hidden sm:block">
              {getTabTitle()}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Hệ thống nội bộ</span>
              <span className="text-[11px] text-slate-500">Phiên bản 1.0.0</span>
            </div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-6 md:p-8 bg-[#070a13]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
