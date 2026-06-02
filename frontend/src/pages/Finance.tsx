import React, { useEffect, useState } from 'react';
import { expenseService, houseService, dashboardService } from '../services/api';
import type { Expense, House } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Edit2, Landmark, Coins, DollarSign, Wallet, AlertCircle, X, Building, Tag, ChevronDown } from 'lucide-react';

const Finance: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [statsData, setStatsData] = useState<{
    revenue_by_month: Array<{ month: string; label: string; revenue: number; expense: number; profit: number }>;
    stats: {
      current_month_revenue: number;
      current_month_expense: number;
      current_month_net: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [houseFilter, setHouseFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentExpense, setCurrentExpense] = useState<Expense>({
    house: 0,
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other'
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch houses (no pagination)
      const housesRes = await houseService.getAll(undefined, undefined, true);
      setHouses(housesRes.data);

      // 2. Fetch expenses (paginated)
      const expensesRes = await expenseService.getAll(
        houseFilter ? Number(houseFilter) : undefined,
        categoryFilter || undefined,
        currentPage
      );
      setExpenses(expensesRes.data.results);
      setTotalCount(expensesRes.data.count);
      setTotalPages(Math.ceil(expensesRes.data.count / 10));

      // 3. Fetch stats for charts and cards
      const statsRes = await dashboardService.getStats();
      setStatsData(statsRes.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Không thể đồng bộ dữ liệu tài chính. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [houseFilter, categoryFilter]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseFilter, categoryFilter, currentPage]);

  const handleOpenCreateModal = () => {
    setCurrentExpense({
      house: houses[0]?.id || 0,
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'other'
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setCurrentExpense({
      ...expense,
      amount: expense.amount.toString()
    });
    setFormError(null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense.house || !currentExpense.description || !currentExpense.amount || !currentExpense.date || !currentExpense.category) {
      setFormError('Vui lòng nhập đầy đủ tất cả các trường.');
      return;
    }

    try {
      const dataToSave = {
        ...currentExpense,
        house: Number(currentExpense.house),
        amount: Number(currentExpense.amount)
      };

      if (isEditMode && currentExpense.id) {
        await expenseService.update(currentExpense.id, dataToSave);
      } else {
        await expenseService.create(dataToSave);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save expense:', err);
      setFormError('Lỗi lưu chi phí. Vui lòng kiểm tra dữ liệu đầu vào.');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await expenseService.delete(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Không thể xóa chi phí này.');
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'repair': return 'Sửa chữa & Bảo trì';
      case 'utility': return 'Điện nước chung';
      case 'tax': return 'Thuế & Phí';
      default: return 'Khác';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'repair': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'utility': return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
      case 'tax': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default: return 'bg-slate-700/20 border-slate-700/40 text-slate-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Thu chi & Tài chính</h1>
          <p className="text-slate-400 mt-1">
            Xem báo cáo doanh thu, quản lý các khoản chi phí vận hành nhà trọ và theo dõi dòng tiền lợi nhuận.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Ghi nhận chi phí mới
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Thu (Tháng này)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {formatCurrency(statsData?.stats.current_month_revenue || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Chi (Tháng này)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {formatCurrency(statsData?.stats.current_month_expense || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition duration-300"></div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lợi Nhuận Ròng (Tháng này)</span>
              <span className="text-2xl font-black text-indigo-300 mt-1 block">
                {formatCurrency(statsData?.stats.current_month_net || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {statsData?.revenue_by_month && (
        <div className="glass-panel p-6 rounded-3xl border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6">Biểu đồ So sánh Thu - Chi hàng tháng</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statsData.revenue_by_month}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                  formatter={(value) => [formatCurrency(value as number), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar name="Tổng Thu" dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={35} />
                <Bar name="Tổng Chi" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters & Expenses List */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Sổ nhật ký chi phí vận hành</h3>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Filter by House */}
            <div className="relative w-full sm:w-56 group">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors pointer-events-none" />
              <select
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300 text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-[#0b0f19] text-slate-200">Tất cả nhà trọ</option>
                {houses.map(h => (
                  <option key={h.id} value={h.id} className="bg-[#0b0f19] text-slate-200">{h.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
            </div>

            {/* Filter by Category */}
            <div className="relative w-full sm:w-56 group">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300 text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-[#0b0f19] text-slate-200">Tất cả danh mục</option>
                <option value="repair" className="bg-[#0b0f19] text-slate-200">Sửa chữa & Bảo trì</option>
                <option value="utility" className="bg-[#0b0f19] text-slate-200">Điện nước chung</option>
                <option value="tax" className="bg-[#0b0f19] text-slate-200">Thuế & Phí</option>
                <option value="other" className="bg-[#0b0f19] text-slate-200">Chi phí khác</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        {loading && expenses.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
            <div className="h-8 w-full shimmer rounded"></div>
            <div className="h-12 w-full shimmer rounded"></div>
            <div className="h-12 w-full shimmer rounded"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Landmark className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Chưa ghi nhận chi phí nào</h4>
            <p className="text-xs text-slate-400">Không tìm thấy chi phí nào khớp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="glass-panel border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Mô tả khoản chi</th>
                    <th className="py-4 px-6">Tòa nhà</th>
                    <th className="py-4 px-6">Danh mục</th>
                    <th className="py-4 px-6">Ngày chi</th>
                    <th className="py-4 px-6 text-right">Số tiền</th>
                    <th className="py-4 px-6 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/15 transition">
                      <td className="py-4 px-6 font-medium text-white">{exp.description}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">{exp.house_name}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getCategoryColor(exp.category)}`}>
                          {getCategoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">{exp.date ? formatDate(exp.date) : ''}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-rose-400">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-400 border border-slate-700/50 rounded-lg transition cursor-pointer"
                            title="Sửa chi phí"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exp.id && setDeleteConfirmId(exp.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 border border-slate-700/50 rounded-lg transition cursor-pointer"
                            title="Xóa chi phí"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/85">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-white">{Math.min((currentPage - 1) * 10 + 1, totalCount)}</span> đến{' '}
                <span className="font-bold text-white">{Math.min(currentPage * 10, totalCount)}</span> trong tổng số{' '}
                <span className="font-bold text-white">{totalCount}</span> khoản chi
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Trang trước
                </button>
                
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      currentPage === p
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Expense Modal (Create/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-slate-700 relative z-10 animate-scale-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {isEditMode ? 'Cập nhật khoản chi phí' : 'Ghi nhận chi phí vận hành'}
            </h3>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn Nhà trọ chịu chi *</label>
                <select
                  name="house"
                  required
                  value={currentExpense.house}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                >
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>{house.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mô tả khoản chi *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Ví dụ: Thay bóng đèn hành lang"
                  value={currentExpense.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Số tiền (VND) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    placeholder="Nhập số tiền"
                    value={currentExpense.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ngày chi *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={currentExpense.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Phân loại chi phí *</label>
                <select
                  name="category"
                  required
                  value={currentExpense.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                >
                  <option value="repair">Sửa chữa & Bảo trì</option>
                  <option value="utility">Điện nước chung</option>
                  <option value="tax">Thuế & Phí</option>
                  <option value="other">Chi phí khác</option>
                </select>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition duration-150 text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl transition duration-150 text-sm cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Lưu chi phí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border-red-500/20 relative z-10 animate-scale-up text-center">
            <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa chi phí?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa bản ghi chi phí này? Thao tác này không thể hoàn tác và sẽ cập nhật lại tức thời biểu đồ doanh thu.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteExpense(deleteConfirmId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Xóa bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
