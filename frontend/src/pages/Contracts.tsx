import React, { useEffect, useState } from 'react';
import { contractService, roomService, tenantService, houseService } from '../services/api';
import type { Contract, Room, Tenant, House } from '../services/api';
import { Plus, X, Calendar, FileText, BadgeAlert, AlertTriangle, Building } from 'lucide-react';

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('true'); // Default to active contracts
  const [houseFilter, setHouseFilter] = useState<string>(''); // Empty = all houses

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Dropdown list states for Modal
  const [vacantRooms, setVacantRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [modalSelectedHouseId, setModalSelectedHouseId] = useState<number | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [durationMonths, setDurationMonths] = useState<string>('12');
  const [currentContract, setCurrentContract] = useState<Contract>({
    tenant: 0,
    room: 0,
    start_date: '',
    end_date: '',
    deposit: '',
    rent_price: '',
    occupants_count: 1
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Terminate Action State
  const [terminateConfirmId, setTerminateConfirmId] = useState<number | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const isActiveParam = statusFilter === '' ? undefined : statusFilter === 'true';
      const houseIdParam = houseFilter ? Number(houseFilter) : undefined;
      const response = await contractService.getAll(isActiveParam, currentPage, undefined, houseIdParam);
      setContracts(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 10));
      setError(null);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Không thể kết nối danh sách hợp đồng. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
    }
  };

  const loadModalData = async () => {
    try {
      // 1. Fetch houses (no pagination)
      const housesRes = await houseService.getAll(undefined, undefined, true);
      setHouses(housesRes.data);

      // 2. Fetch only empty rooms for new contract (no pagination)
      const roomsResponse = await roomService.getAll(undefined, 'empty', undefined, undefined, true);
      setVacantRooms(roomsResponse.data);
      
      // 3. Fetch all tenants (no pagination)
      const tenantsResponse = await tenantService.getAll(undefined, undefined, true);
      setTenants(tenantsResponse.data);
    } catch (err) {
      console.error('Error loading vacant rooms, houses, or tenants:', err);
    }
  };

  const fetchHouses = async () => {
    try {
      const response = await houseService.getAll(undefined, undefined, true);
      setHouses(response.data);
    } catch (err) {
      console.error('Error fetching houses:', err);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, houseFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContracts();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, houseFilter, currentPage]);

  const calculateEndDate = (startDateStr: string, months: number): string => {
    if (!startDateStr || !months || months <= 0) return '';
    const date = new Date(startDateStr);
    if (isNaN(date.getTime())) return '';
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const isExpiringSoon = (endDateStr: string, isActive?: boolean): boolean => {
    if (!isActive) return false;
    const endDate = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30;
  };

  const getExpirationDays = (endDateStr: string): number => {
    const endDate = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleOpenCreateModal = async () => {
    await loadModalData();
    setModalSelectedHouseId(null);
    const today = new Date().toISOString().split('T')[0];
    setDurationMonths('12');
    setCurrentContract({
      tenant: 0,
      room: 0,
      start_date: today,
      end_date: calculateEndDate(today, 12),
      deposit: '',
      rent_price: '',
      occupants_count: 1
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const months = Number(durationMonths) || 0;
    const newEndDate = calculateEndDate(newStartDate, months);
    setCurrentContract(prev => ({
      ...prev,
      start_date: newStartDate,
      end_date: newEndDate
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDurationMonths(val);
    const months = Number(val) || 0;
    const newEndDate = calculateEndDate(currentContract.start_date, months);
    setCurrentContract(prev => ({
      ...prev,
      end_date: newEndDate
    }));
  };

  const handleHouseSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const houseId = Number(e.target.value) || null;
    setModalSelectedHouseId(houseId);
    setCurrentContract(prev => ({
      ...prev,
      room: 0,
      rent_price: '',
      deposit: ''
    }));
  };

  // Pre-fill values when a Room is selected
  const handleRoomSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = Number(e.target.value);
    const selectedRoom = vacantRooms.find(r => r.id === roomId);
    
    if (selectedRoom) {
      const price = Number(selectedRoom.price);
      setCurrentContract(prev => ({
        ...prev,
        room: roomId,
        rent_price: price,
        deposit: price // Default deposit is 1 month rent
      }));
    } else {
      setCurrentContract(prev => ({
        ...prev,
        room: 0,
        rent_price: '',
        deposit: ''
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentContract(prev => ({
      ...prev,
      [name]: name === 'occupants_count' ? Number(value) : value
    }));
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContract.tenant || !currentContract.room || !currentContract.start_date || !currentContract.end_date || !currentContract.deposit || !currentContract.rent_price) {
      setFormError('Vui lòng nhập đầy đủ các trường thông tin.');
      return;
    }

    try {
      await contractService.create(currentContract);
      setIsModalOpen(false);
      fetchContracts();
    } catch (err: unknown) {
      console.error('Error saving contract:', err);
      const axiosError = err as { response?: { data?: { non_field_errors?: string[]; detail?: string } } };
      const errMsg = axiosError.response?.data?.non_field_errors?.[0] || axiosError.response?.data?.detail || 'Không thể tạo hợp đồng. Vui lòng kiểm tra lại dữ liệu.';
      setFormError(errMsg);
    }
  };

  const handleTerminateContract = async (id: number) => {
    try {
      await contractService.terminate(id);
      setTerminateConfirmId(null);
      fetchContracts();
    } catch (err) {
      console.error('Error terminating contract:', err);
      alert('Không thể chấm dứt hợp đồng này.');
      setTerminateConfirmId(null);
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Hợp đồng thuê</h1>
          <p className="text-slate-400 mt-1">Lập hợp đồng mới, xem danh sách hợp đồng hoạt động và kết thúc hợp đồng thuê phòng.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Tạo hợp đồng mới
        </button>
      </div>

      {/* Filter Panel */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex gap-2 w-full sm:w-auto bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('true')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
              statusFilter === 'true'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => setStatusFilter('false')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
              statusFilter === 'false'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã kết thúc
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
              statusFilter === ''
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả hợp đồng
          </button>
        </div>

        {/* House filter dropdown */}
        <div className="relative w-full sm:w-64">
          <Building className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <select
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-200 text-xs cursor-pointer appearance-none"
          >
            <option value="">Tất cả nhà trọ</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && contracts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="glass-panel border-slate-800 rounded-2xl p-6 h-48 shimmer"></div>
          ))}
        </div>
      ) : error && contracts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto text-center border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-4">{error}</p>
          <button onClick={fetchContracts} className="px-5 py-2 bg-indigo-600 rounded-lg text-white text-sm">Tải lại</button>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Chưa có hợp đồng nào</h3>
          <p className="text-sm text-slate-400">Không tìm thấy hợp đồng phù hợp với tiêu chí lọc.</p>
        </div>
      ) : (
        /* Contracts List */
        <div className="space-y-6">
          {contracts.map((contract) => (
            <div key={contract.id} className={`glass-card rounded-2xl p-6 border flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-indigo-600/5 hover:border-slate-700 ${
              isExpiringSoon(contract.end_date, contract.is_active)
                ? 'border-amber-500/35 bg-amber-950/5 shadow-md shadow-amber-500/5'
                : 'border-slate-800'
            }`}>
              <div className="flex-1 space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-extrabold px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                    Nhà: {contract.house_name} - Phòng: {contract.room_code}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                    contract.is_active
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {contract.is_active ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </span>
                  {isExpiringSoon(contract.end_date, contract.is_active) && (
                    <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                      {getExpirationDays(contract.end_date) < 0 
                        ? 'Đã quá hạn' 
                        : `Sắp hết hạn (Còn ${getExpirationDays(contract.end_date)} ngày)`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Column 1: Tenant info */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Khách thuê</div>
                    <div className="font-bold text-white text-base">{contract.tenant_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{contract.tenant_phone}</div>
                  </div>

                  {/* Column 2: Date period */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Thời hạn thuê</div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-200">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
                    </div>
                  </div>

                  {/* Column 3: Rent and deposit */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Giá trị hợp đồng</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-xs text-slate-400">Giá:</span>{' '}
                        <span className="font-bold text-indigo-300">{formatCurrency(contract.rent_price)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Cọc:</span>{' '}
                        <span className="font-bold text-emerald-400">{formatCurrency(contract.deposit)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Số người ở:</span>{' '}
                        <span className="font-bold text-amber-400">{contract.occupants_count || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {contract.is_active && (
                <div className="flex items-center md:border-l md:border-slate-800 md:pl-6">
                  <button
                    onClick={() => contract.id && setTerminateConfirmId(contract.id)}
                    className="w-full md:w-auto px-4 py-2.5 bg-red-950/30 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/20 hover:border-red-500 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Chấm dứt hợp đồng
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/85">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-white">{Math.min((currentPage - 1) * 10 + 1, totalCount)}</span> đến{' '}
                <span className="font-bold text-white">{Math.min(currentPage * 10, totalCount)}</span> trong tổng số{' '}
                <span className="font-bold text-white">{totalCount}</span> hợp đồng
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

      {/* Create Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-slate-700 relative z-10 animate-scale-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Tạo hợp đồng thuê mới</h3>
            
            <form onSubmit={handleSaveContract} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn Nhà trọ *</label>
                  <select
                    value={modalSelectedHouseId || 0}
                    onChange={handleHouseSelectChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                  >
                    <option value="0">--- Chọn nhà ---</option>
                    {houses.map(house => (
                      <option key={house.id} value={house.id}>{house.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn phòng trống *</label>
                  <select
                    name="room"
                    required
                    disabled={!modalSelectedHouseId}
                    value={currentContract.room}
                    onChange={handleRoomSelectChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="0">--- Chọn phòng ---</option>
                    {vacantRooms
                      .filter(room => room.house === modalSelectedHouseId)
                      .map(room => (
                        <option key={room.id} value={room.id}>
                          {room.room_name} ({room.room_code}) - {formatCurrency(room.price)}
                        </option>
                      ))}
                  </select>
                  {modalSelectedHouseId && vacantRooms.filter(room => room.house === modalSelectedHouseId).length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">Nhà này không có phòng trống.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn người thuê *</label>
                  <select
                    name="tenant"
                    required
                    value={currentContract.tenant}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                  >
                    <option value="0">--- Chọn khách thuê ---</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    value={currentContract.start_date}
                    onChange={handleStartDateChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Thời hạn (Tháng) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMonths}
                    onChange={handleDurationChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                    placeholder="VD: 12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ngày kết thúc *</label>
                  <input
                    type="date"
                    name="end_date"
                    required
                    readOnly
                    value={currentContract.end_date}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed focus:outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Giá thuê phòng/tháng *</label>
                  <input
                    type="number"
                    name="rent_price"
                    required
                    placeholder="Tự động lấy theo giá phòng"
                    value={currentContract.rent_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tiền đặt cọc *</label>
                  <input
                    type="number"
                    name="deposit"
                    required
                    placeholder="Mặc định = 1 tháng tiền nhà"
                    value={currentContract.deposit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Số người ở *</label>
                  <input
                    type="number"
                    name="occupants_count"
                    required
                    min="1"
                    placeholder="VD: 1"
                    value={currentContract.occupants_count || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
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
                  Ký hợp đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminate Confirm Modal */}
      {terminateConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setTerminateConfirmId(null)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border-red-500/20 relative z-10 animate-scale-up text-center">
            <BadgeAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Chấm dứt hợp đồng này?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có đồng ý chấm dứt hợp đồng ngay hôm nay? Trạng thái của phòng trọ sẽ tự động được trả về **"Trống"** ngay lập tức.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTerminateConfirmId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleTerminateContract(terminateConfirmId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-red-600/25"
              >
                Chấm dứt hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
