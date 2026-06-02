import React, { useEffect, useState } from 'react';
import { tenantService } from '../services/api';
import type { Tenant } from '../services/api';
import { Search, Plus, Edit2, Trash2, Users, Phone, CreditCard, MapPin, X, AlertTriangle } from 'lucide-react';

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTenant, setCurrentTenant] = useState<Tenant>({
    full_name: '',
    phone: '',
    citizen_id: '',
    address: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantService.getAll(searchTerm, currentPage);
      setTenants(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 6));
      setError(null);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Không thể kết nối danh sách khách thuê. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, currentPage]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentTenant({
      full_name: '',
      phone: '',
      citizen_id: '',
      address: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setModalMode('edit');
    setCurrentTenant({ ...tenant });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTenant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant.full_name.trim() || !currentTenant.phone.trim() || !currentTenant.citizen_id.trim()) {
      setFormError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await tenantService.create(currentTenant);
      } else {
        if (currentTenant.id) {
          await tenantService.update(currentTenant.id, currentTenant);
        }
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (err: unknown) {
      console.error('Error saving tenant:', err);
      const axiosError = err as { response?: { data?: { citizen_id?: string[] } } };
      setFormError(axiosError.response?.data?.citizen_id ? 'Số CCCD này đã tồn tại trên hệ thống.' : 'Đã xảy ra lỗi khi lưu khách thuê.');
    }
  };

  const handleDeleteTenant = async (id: number) => {
    try {
      await tenantService.delete(id);
      setDeleteConfirmId(null);
      fetchTenants();
    } catch (err: unknown) {
      console.error('Error deleting tenant:', err);
      const axiosError = err as { response?: { data?: { detail?: string } } };
      alert(axiosError.response?.data?.detail || 'Không thể xóa khách thuê này (Có thể khách thuê đang có hợp đồng hoạt động).');
      setDeleteConfirmId(null);
    }
  };

  // Helper to generate dynamic avatar colors based on name initials
  const getAvatarStyle = (name: string) => {
    const char = name.trim().charAt(0).toUpperCase();
    const charCode = char.charCodeAt(0) || 0;
    const gradients = [
      'from-indigo-500 to-purple-500',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-fuchsia-500',
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-red-500'
    ];
    const gradient = gradients[charCode % gradients.length];
    return { char, gradient };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý Khách thuê</h1>
          <p className="text-slate-400 mt-1">Quản lý danh sách, số điện thoại, số CCCD và thông tin liên hệ của khách thuê.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Thêm khách thuê mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl">
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại, số CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm"
          />
        </div>
      </div>

      {/* Table Content */}
      {loading && tenants.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <div className="h-8 w-full shimmer rounded"></div>
          <div className="h-12 w-full shimmer rounded"></div>
          <div className="h-12 w-full shimmer rounded"></div>
        </div>
      ) : error && tenants.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto text-center border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-4">{error}</p>
          <button onClick={fetchTenants} className="px-5 py-2 bg-indigo-600 rounded-lg text-white text-sm">Tải lại</button>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Chưa có khách thuê nào</h3>
          <p className="text-sm text-slate-400">Hãy thêm mới thông tin khách thuê để liên kết vào hợp đồng.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Họ tên</th>
                    <th className="py-4 px-6">Số điện thoại</th>
                    <th className="py-4 px-6">Số CCCD</th>
                    <th className="py-4 px-6">Địa chỉ quê quán</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {tenants.map((tenant) => {
                    const avatar = getAvatarStyle(tenant.full_name);
                    return (
                      <tr key={tenant.id} className="hover:bg-slate-900/15 transition group">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>
                            {avatar.char}
                          </div>
                          <span className="font-bold text-white group-hover:text-indigo-300 transition duration-150">
                            {tenant.full_name}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-500" />
                            {tenant.phone}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5 font-mono">
                            <CreditCard className="w-4 h-4 text-slate-500" />
                            {tenant.citizen_id}
                          </span>
                        </td>
                        <td className="py-4 px-6 max-w-xs truncate">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            {tenant.address || <em className="text-slate-600">Chưa cập nhật</em>}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(tenant)}
                              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => tenant.id && setDeleteConfirmId(tenant.id)}
                              className="p-2 bg-red-950/20 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 rounded-lg transition cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/85">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-white">{Math.min((currentPage - 1) * 6 + 1, totalCount)}</span> đến{' '}
                <span className="font-bold text-white">{Math.min(currentPage * 6, totalCount)}</span> trong tổng số{' '}
                <span className="font-bold text-white">{totalCount}</span> khách thuê
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
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border-slate-700 relative z-10 animate-scale-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {modalMode === 'create' ? 'Thêm khách thuê mới' : 'Chỉnh sửa thông tin khách thuê'}
            </h3>
            
            <form onSubmit={handleSaveTenant} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={currentTenant.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="VD: 0912345678"
                    value={currentTenant.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Số CCCD *</label>
                  <input
                    type="text"
                    name="citizen_id"
                    required
                    placeholder="Nhập 12 số CCCD"
                    value={currentTenant.citizen_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Địa chỉ thường trú (Không bắt buộc)</label>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="VD: Xã A, Huyện B, Tỉnh C"
                  value={currentTenant.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm resize-none"
                ></textarea>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
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
                  Lưu lại
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
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border-red-500/20 relative z-10 animate-scale-up text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa khách thuê?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa khách thuê này? Việc xóa sẽ thất bại nếu khách hàng đang có hợp đồng hoặc hóa đơn liên quan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteTenant(deleteConfirmId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-red-600/25"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
