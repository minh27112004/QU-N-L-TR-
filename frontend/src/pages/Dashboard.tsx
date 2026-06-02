import React, { useEffect, useState } from 'react';
import { dashboardService, paymentService } from '../services/api';
import type { DashboardStats } from '../services/api';
import { Home, Users, DollarSign, AlertCircle, CheckCircle2, TrendingUp, Inbox } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmPayment = async (id: number) => {
    try {
      await paymentService.confirm(id);
      fetchStats(); // reload stats
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      alert('Không thể xác nhận thanh toán.');
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto mt-12 border-red-500/30 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button 
          onClick={fetchStats}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-250 shadow-lg shadow-indigo-600/30"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const stats = data?.stats;
  const kpis = [
    {
      title: 'Tổng số phòng',
      value: stats?.total_rooms || 0,
      icon: Home,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      action: () => setActiveTab('rooms'),
      actionText: 'Xem chi tiết phòng'
    },
    {
      title: 'Phòng trống',
      value: stats?.empty_rooms || 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      action: () => setActiveTab('rooms'),
      actionText: 'Xem phòng trống'
    },
    {
      title: 'Phòng đang thuê',
      value: stats?.rented_rooms || 0,
      icon: AlertCircle,
      color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
      action: () => setActiveTab('contracts'),
      actionText: 'Xem hợp đồng'
    },
    {
      title: 'Tổng người thuê',
      value: stats?.total_tenants || 0,
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      action: () => setActiveTab('tenants'),
      actionText: 'Xem khách thuê'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tổng quan</h1>
          <p className="text-slate-400 mt-1">
            Chào mừng trở lại! Dưới đây là thống kê tình hình nhà trọ tháng {stats?.current_month ? stats.current_month.split('-')[1] + '/' + stats.current_month.split('-')[0] : ''}.
          </p>
        </div>
        <div className="glass-panel px-5 py-3 rounded-2xl border-slate-700/50 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Doanh thu tháng này</div>
            <div className="text-lg font-bold text-white">{formatCurrency(stats?.current_month_revenue || 0)}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`glass-card bg-gradient-to-br ${kpi.color.split(' ')[0]} ${kpi.color.split(' ')[1]} border ${kpi.color.split(' ')[2]} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-40`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{kpi.value}</h3>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-xl">
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <button 
              onClick={kpi.action} 
              className="text-xs font-semibold hover:underline mt-4 text-left cursor-pointer inline-flex items-center gap-1 opacity-80 hover:opacity-100"
            >
              {kpi.actionText} &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-panel border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Doanh thu 6 tháng qua</h3>
              <p className="text-xs text-slate-400">Chỉ tính hóa đơn đã thanh toán</p>
            </div>
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="h-72 w-full">
            {data && data.revenue_by_month && data.revenue_by_month.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_by_month} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(v) => v >= 1000000 ? `${v / 1000000}M` : v} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8' }}
                    formatter={(v) => [formatCurrency(v as number), 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">Chưa có dữ liệu biểu đồ</div>
            )}
          </div>
        </div>

        {/* Payment Pie Chart */}
        <div className="glass-panel border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Thanh toán tháng này</h3>
              <p className="text-xs text-slate-400">Tỷ lệ hóa đơn Đã / Chưa trả</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="h-64 flex justify-center items-center relative">
            {data && data.payment_status_distribution && data.payment_status_distribution.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.payment_status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {data.payment_status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-sm">Chưa lập hóa đơn cho tháng này</div>
            )}
            {/* Center label */}
            {data && data.payment_status_distribution && data.payment_status_distribution.some(item => item.value > 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-white">
                  {data.payment_status_distribution.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
                <span className="text-xs text-slate-400">Hóa đơn</span>
              </div>
            )}
          </div>
          <div className="flex justify-around gap-2 text-xs border-t border-slate-800 pt-4 mt-2">
            {data?.payment_status_distribution.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-slate-300 font-medium">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Unpaid Invoices */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Hóa đơn chưa thanh toán gần đây</h3>
            <p className="text-xs text-slate-400">Danh sách cần thu tiền phòng</p>
          </div>
          <button 
            onClick={() => setActiveTab('payments')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Quản lý hóa đơn &rarr;
          </button>
        </div>

        {data && data.recent_unpaid && data.recent_unpaid.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-4">Phòng</th>
                  <th className="py-4 px-4">Tháng</th>
                  <th className="py-4 px-4">Tiền phòng</th>
                  <th className="py-4 px-4 text-right">Tổng cộng</th>
                  <th className="py-4 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {data.recent_unpaid.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-900/20 transition">
                    <td className="py-4 px-4 font-bold text-white">{invoice.room_name} ({invoice.room_code})</td>
                    <td className="py-4 px-4">{invoice.month}</td>
                    <td className="py-4 px-4">{formatCurrency(invoice.room_fee || 0)}</td>
                    <td className="py-4 px-4 text-right font-extrabold text-indigo-300">{formatCurrency(invoice.total_amount || 0)}</td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => invoice.id && handleConfirmPayment(invoice.id)}
                        className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 active:bg-emerald-700 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-bold transition duration-200 cursor-pointer"
                      >
                        Thu tiền
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <Inbox className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm">Tuyệt vời! Không có hóa đơn chưa thanh toán nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
