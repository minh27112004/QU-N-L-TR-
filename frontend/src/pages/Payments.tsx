import React, { useEffect, useState } from 'react';
import { paymentService, roomService, houseService } from '../services/api';
import type { Payment, Room, House } from '../services/api';
import { Plus, Filter, Check, Calendar, DollarSign, Lightbulb, Droplet, X, AlertCircle, FileSpreadsheet, Building, Pencil, Download, Trash2 } from 'lucide-react';

const getCurrentMonth = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth()); // Default to current month
  const [statusFilter, setStatusFilter] = useState<string>(''); // empty means all
  const [houseFilter, setHouseFilter] = useState<string>(''); // empty means all

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Available rooms & houses for billing dropdown
  const [rooms, setRooms] = useState<Room[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [modalSelectedHouseId, setModalSelectedHouseId] = useState<number | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentPayment, setCurrentPayment] = useState<Payment>({
    room: 0,
    month: getCurrentMonth(),
    room_fee: '',
    electricity_fee: '0',
    water_fee: '0',
    payment_status: 'unpaid',
    elec_old: '0',
    elec_new: '0',
    elec_price: '3800',
    water_old: '0',
    water_new: '0',
    water_price: '35000',
    service_people: '1',
    service_price: '100000',
    internet_price: '100000',
    surcharge: '0',
    surcharge_desc: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Dynamic calculations inside modal
  const [selectedRoomPrice, setSelectedRoomPrice] = useState<number>(0);
  const [computedTotal, setComputedTotal] = useState<number>(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAll(
        selectedMonth || undefined, 
        statusFilter || undefined, 
        undefined, 
        houseFilter ? Number(houseFilter) : undefined,
        currentPage
      );
      setPayments(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 6));
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Không thể kết nối lịch sử phiếu thu. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
    }
  };

  const loadModalData = async () => {
    try {
      const housesRes = await houseService.getAll(undefined, undefined, true);
      setHouses(housesRes.data);
      const roomsRes = await roomService.getAll(undefined, undefined, undefined, undefined, true);
      setRooms(roomsRes.data);
      return { houses: housesRes.data, rooms: roomsRes.data };
    } catch (err) {
      console.error('Error loading modal data:', err);
      return { houses: [], rooms: [] };
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
    const timer = setTimeout(() => {
      fetchHouses();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, statusFilter, houseFilter]);

  useEffect(() => {
    // Avoid calling setState synchronously in effect body
    const timer = setTimeout(() => {
      fetchPayments();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, statusFilter, houseFilter, currentPage]);

  const recalculateFees = (payment: Payment, roomPrice: number) => {
    const rFee = Number(payment.room_fee) || roomPrice;
    
    const eOld = Number(payment.elec_old) || 0;
    const eNew = Number(payment.elec_new) || 0;
    const ePrice = Number(payment.elec_price) || 0;
    const eFee = Math.max(0, eNew - eOld) * ePrice;
    
    const wOld = Number(payment.water_old) || 0;
    const wNew = Number(payment.water_new) || 0;
    const wPrice = Number(payment.water_price) || 0;
    const wFee = Math.max(0, wNew - wOld) * wPrice;
    
    const sPeople = Number(payment.service_people) || 0;
    const sPrice = Number(payment.service_price) || 0;
    const sFee = sPeople * sPrice;
    
    const iPrice = Number(payment.internet_price) || 0;
    const sur = Number(payment.surcharge) || 0;
    
    const total = rFee + eFee + wFee + sFee + iPrice + sur;
    
    return {
      electricity_fee: eFee,
      water_fee: wFee,
      total_amount: total
    };
  };

  const handleOpenCreateModal = async () => {
    await loadModalData();
    setModalSelectedHouseId(null);
    
    setCurrentPayment({
      room: 0,
      month: selectedMonth || new Date().toISOString().slice(0, 7),
      room_fee: '',
      electricity_fee: '0',
      water_fee: '0',
      payment_status: 'unpaid',
      elec_old: '0',
      elec_new: '0',
      elec_price: '3800',
      water_old: '0',
      water_new: '0',
      water_price: '35000',
      service_people: '1',
      service_price: '100000',
      internet_price: '100000',
      surcharge: '0',
      surcharge_desc: '',
    });
    setSelectedRoomPrice(0);
    setComputedTotal(0);
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (payment: Payment) => {
    const { rooms: loadedRooms } = await loadModalData();
    
    const roomObj = loadedRooms.find((r: Room) => r.id === payment.room);
    if (roomObj) {
      setModalSelectedHouseId(roomObj.house);
      setSelectedRoomPrice(Number(roomObj.price));
    }

    setCurrentPayment({
      ...payment,
      room_fee: payment.room_fee ? payment.room_fee.toString() : '',
      elec_old: payment.elec_old !== undefined ? payment.elec_old.toString() : '0',
      elec_new: payment.elec_new !== undefined ? payment.elec_new.toString() : '0',
      elec_price: payment.elec_price !== undefined ? payment.elec_price.toString() : '3800',
      water_old: payment.water_old !== undefined ? payment.water_old.toString() : '0',
      water_new: payment.water_new !== undefined ? payment.water_new.toString() : '0',
      water_price: payment.water_price !== undefined ? payment.water_price.toString() : '35000',
      service_people: payment.service_people !== undefined ? payment.service_people.toString() : '1',
      service_price: payment.service_price !== undefined ? payment.service_price.toString() : '100000',
      internet_price: payment.internet_price !== undefined ? payment.internet_price.toString() : '100000',
      surcharge: payment.surcharge !== undefined ? payment.surcharge.toString() : '0',
      surcharge_desc: payment.surcharge_desc || '',
    });
    
    setComputedTotal(Number(payment.total_amount) || 0);
    setFormError(null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleHouseSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const houseId = Number(e.target.value) || null;
    setModalSelectedHouseId(houseId);
    
    setSelectedRoomPrice(0);
    
    const updated = {
      ...currentPayment,
      room: 0,
      room_fee: '',
      electricity_fee: '0',
      water_fee: '0',
      elec_old: '0',
      elec_new: '0',
      water_old: '0',
      water_new: '0'
    };
    const calcs = recalculateFees(updated, 0);
    setComputedTotal(calcs.total_amount);
    setCurrentPayment({
      ...updated,
      electricity_fee: calcs.electricity_fee,
      water_fee: calcs.water_fee
    });
  };

  // Pre-fill room fee when room is selected
  const handleRoomSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = Number(e.target.value);
    const selectedRoom = rooms.find(r => r.id === roomId);

    if (selectedRoom) {
      const price = Number(selectedRoom.price);
      setSelectedRoomPrice(price);
      
      let elecOld = 0;
      let waterOld = 0;
      let occupantsCount = 1;
      let elecPrice = '3800';
      let waterPrice = '35000';
      let servicePrice = '100000';
      let internetPrice = '100000';

      try {
        const utilityRes = await roomService.getLatestUtility(roomId);
        elecOld = utilityRes.data.elec_old;
        waterOld = utilityRes.data.water_old;
        occupantsCount = utilityRes.data.occupants_count || 1;
        if (utilityRes.data.elec_price !== undefined) elecPrice = utilityRes.data.elec_price.toString();
        if (utilityRes.data.water_price !== undefined) waterPrice = utilityRes.data.water_price.toString();
        if (utilityRes.data.service_price !== undefined) servicePrice = utilityRes.data.service_price.toString();
        if (utilityRes.data.internet_price !== undefined) internetPrice = utilityRes.data.internet_price.toString();
      } catch (err) {
        console.error('Error fetching latest utilities for room:', err);
      }

      const updated = {
        ...currentPayment,
        room: roomId,
        room_fee: price,
        elec_old: elecOld.toString(),
        elec_new: elecOld.toString(),
        elec_price: elecPrice,
        water_old: waterOld.toString(),
        water_new: waterOld.toString(),
        water_price: waterPrice,
        service_people: occupantsCount.toString(),
        service_price: servicePrice,
        internet_price: internetPrice
      };
      const calcs = recalculateFees(updated, price);
      setComputedTotal(calcs.total_amount);
      setCurrentPayment({
        ...updated,
        electricity_fee: calcs.electricity_fee,
        water_fee: calcs.water_fee
      });
    } else {
      setSelectedRoomPrice(0);
      setComputedTotal(0);
      setCurrentPayment({
        ...currentPayment,
        room: 0,
        room_fee: '',
        electricity_fee: '0',
        water_fee: '0',
        elec_old: '0',
        elec_new: '0',
        water_old: '0',
        water_new: '0'
      });
    }
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const updated = {
      ...currentPayment,
      [name]: value
    };
    
    const calcs = recalculateFees(updated, selectedRoomPrice);
    setComputedTotal(calcs.total_amount);
    setCurrentPayment({
      ...updated,
      electricity_fee: calcs.electricity_fee,
      water_fee: calcs.water_fee
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPayment.room || !currentPayment.month || currentPayment.room_fee === '') {
      setFormError('Vui lòng chọn phòng và tháng thu tiền.');
      return;
    }

    try {
      if (isEditMode && currentPayment.id) {
        await paymentService.update(currentPayment.id, currentPayment);
      } else {
        await paymentService.create(currentPayment);
      }
      setIsModalOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      console.error('Error saving payment invoice:', err);
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      
      let errMsg = 'Không thể lưu hóa đơn. Vui lòng kiểm tra lại dữ liệu.';
      if (axiosError.response?.data) {
        const errors = axiosError.response.data;
        if (errors.non_field_errors) {
          errMsg = errors.non_field_errors[0];
          if (errMsg.includes('unique set')) {
            errMsg = 'Phòng này đã được tạo hóa đơn trong tháng này.';
          }
        } else {
          const fieldErrors = Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join(' | ');
          if (fieldErrors) {
            errMsg = fieldErrors;
          }
        }
      }
      setFormError(errMsg);
    }
  };

  const handleConfirmPayment = async (id: number) => {
    try {
      await paymentService.confirm(id);
      fetchPayments();
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      alert('Không thể xác nhận thanh toán.');
    }
  };

  const handleDeletePayment = async (id: number) => {
    try {
      await paymentService.delete(id);
      setDeleteConfirmId(null);
      fetchPayments();
    } catch (err) {
      console.error('Failed to delete payment:', err);
      alert('Không thể xóa phiếu thu này.');
      setDeleteConfirmId(null);
    }
  };

  const handleExportExcel = async (paymentId: number, roomCode: string, month: string) => {
    try {
      const response = await paymentService.exportExcel(paymentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Phieu_thu_phong_${roomCode}_thang_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Không thể tải file Excel. Vui lòng thử lại.');
    }
  };

  const [exportingByHouse, setExportingByHouse] = useState<boolean>(false);

  const handleExportExcelByHouse = async () => {
    if (!houseFilter) return;
    try {
      setExportingByHouse(true);
      const response = await paymentService.exportExcelByHouse(
        Number(houseFilter),
        selectedMonth || undefined
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const houseName = houses.find(h => h.id === Number(houseFilter))?.name || 'toa_nha';
      const monthSuffix = selectedMonth ? `_${selectedMonth}` : '';
      link.setAttribute('download', `Phieu_thu_${houseName.replace(/\s+/g, '_')}${monthSuffix}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to export Excel by house:', err);
      alert('Không thể tải file Excel. Vui lòng kiểm tra có phiếu thu cho tòa nhà này không.');
    } finally {
      setExportingByHouse(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  // Generate month list for selection filter (last 6 months and next 2 months)
  const getFilterMonthsList = () => {
    const months = [];
    const date = new Date();
    date.setMonth(date.getMonth() + 2); // Start from 2 months ahead
    
    for (let i = 0; i < 10; i++) {
      const mStr = date.toISOString().slice(0, 7);
      months.push(mStr);
      date.setMonth(date.getMonth() - 1);
    }
    return months;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý Phiếu thu</h1>
          <p className="text-slate-400 mt-1">Lập hóa đơn tiền phòng hàng tháng, tính tiền điện nước và xác nhận thu tiền khách thuê.</p>
        </div>
        <div className="flex items-center gap-3">
          {houseFilter && (
            <button
              onClick={handleExportExcelByHouse}
              disabled={exportingByHouse}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-emerald-600/35 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Download className="w-5 h-5" />
              {exportingByHouse ? 'Đang xuất...' : 'Xuất Excel theo tòa nhà'}
            </button>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" />
            Lập phiếu thu mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        {/* House filter */}
        <div className="relative w-full md:w-64">
          <Building className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm cursor-pointer appearance-none animate-fade-in"
          >
            <option value="">Tất cả nhà trọ</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* Month filter */}
        <div className="relative w-full md:flex-1">
          <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm cursor-pointer appearance-none"
          >
            <option value="">Tất cả các tháng</option>
            {getFilterMonthsList().map(m => (
              <option key={m} value={m}>Tháng {m.split('-')[1]}/{m.split('-')[0]}</option>
            ))}
          </select>
        </div>
        
        {/* Status filter */}
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm cursor-pointer appearance-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && payments.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <div className="h-8 w-full shimmer rounded"></div>
          <div className="h-12 w-full shimmer rounded"></div>
          <div className="h-12 w-full shimmer rounded"></div>
        </div>
      ) : error && payments.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto text-center border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-4">{error}</p>
          <button onClick={fetchPayments} className="px-5 py-2 bg-indigo-600 rounded-lg text-white text-sm">Tải lại</button>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          <DollarSign className="w-16 h-16 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Chưa có phiếu thu nào</h3>
          <p className="text-sm text-slate-400">Không tìm thấy phiếu thu nào cho tháng và điều kiện lọc đã chọn.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Phòng</th>
                    <th className="py-4 px-6">Tòa nhà</th>
                    <th className="py-4 px-6">Tháng</th>
                    <th className="py-4 px-6 text-right">Tổng tiền</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-900/15 transition">
                      <td className="py-4 px-6 font-bold text-white">
                        <div>
                          {payment.room_name} <span className="text-xs text-slate-500 font-normal">({payment.room_code})</span>
                        </div>
                        {payment.surcharge && Number(payment.surcharge) > 0 && (
                          <div className="text-[10px] text-rose-400 font-medium mt-0.5" title={payment.surcharge_desc}>
                            + {formatCurrency(payment.surcharge)} ({payment.surcharge_desc || 'Phụ phí'})
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">{payment.house_name}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">{payment.month}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-indigo-300">
                        {formatCurrency(payment.total_amount || 0)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border text-center block w-28 mx-auto ${
                          payment.payment_status === 'paid'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {payment.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {payment.payment_status === 'unpaid' ? (
                            <>
                              <button
                                onClick={() => payment.id && handleConfirmPayment(payment.id)}
                                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 active:bg-emerald-700 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(payment)}
                                className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 active:bg-amber-700 text-amber-400 hover:text-white border border-amber-500/30 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1"
                                title="Chỉnh sửa chỉ số dịch vụ"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => payment.id && setDeleteConfirmId(payment.id)}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 active:bg-rose-700 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1"
                                title="Xóa phiếu thu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                              <Check className="w-4 h-4 text-emerald-500" />
                              Đã thu
                            </span>
                          )}
                          <button
                            onClick={() => payment.id && handleExportExcel(payment.id, payment.room_code || '', payment.month)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 active:bg-indigo-700 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5"
                            title="Xuất hóa đơn Excel"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Xuất Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/85">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-white">{Math.min((currentPage - 1) * 6 + 1, totalCount)}</span> đến{' '}
                <span className="font-bold text-white">{Math.min(currentPage * 6, totalCount)}</span> trong tổng số{' '}
                <span className="font-bold text-white">{totalCount}</span> hóa đơn
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

      {/* Create Payment Receipt Modal */}
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
            <h3 className="text-xl font-bold text-white mb-6">{isEditMode ? 'Chỉnh sửa phiếu thu' : 'Lập phiếu thu tiền hàng tháng'}</h3>
            
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn Nhà trọ *</label>
                  <select
                    disabled={isEditMode}
                    value={modalSelectedHouseId || 0}
                    onChange={handleHouseSelectChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="0">--- Chọn nhà ---</option>
                    {houses.map(house => (
                      <option key={house.id} value={house.id}>{house.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn phòng *</label>
                  <select
                    name="room"
                    required
                    disabled={isEditMode || !modalSelectedHouseId}
                    value={currentPayment.room}
                    onChange={handleRoomSelectChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="0">--- Chọn phòng ---</option>
                    {rooms
                      .filter(room => room.house === modalSelectedHouseId)
                      .map(room => (
                        <option key={room.id} value={room.id}>
                          {room.room_name} ({room.room_code})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tháng thu tiền *</label>
                  <input
                    type="month"
                    name="month"
                    required
                    disabled={isEditMode}
                    value={currentPayment.month}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tiền phòng (VND) *</label>
                <input
                  type="number"
                  name="room_fee"
                  required
                  placeholder="Tự động điền theo phòng"
                  value={currentPayment.room_fee}
                  onChange={handleNumericInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>

              {/* Electricity parameters */}
              <div className="border border-slate-800/80 rounded-2xl p-4 space-y-3 bg-slate-950/20">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  Tiền Điện (Số)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Chỉ số cũ</label>
                    <input
                      type="number"
                      name="elec_old"
                      value={currentPayment.elec_old}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Chỉ số mới</label>
                    <input
                      type="number"
                      name="elec_new"
                      value={currentPayment.elec_new}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Đơn giá</label>
                    <input
                      type="number"
                      name="elec_price"
                      value={currentPayment.elec_price}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  Đã dùng: <span className="text-amber-400 font-bold">{Math.max(0, Number(currentPayment.elec_new || 0) - Number(currentPayment.elec_old || 0))}</span> số - Thành tiền: <span className="text-white font-bold">{formatCurrency(currentPayment.electricity_fee || 0)}</span>
                </div>
              </div>

              {/* Water parameters */}
              <div className="border border-slate-800/80 rounded-2xl p-4 space-y-3 bg-slate-950/20">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-4 h-4" />
                  Tiền Nước (Khối)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Chỉ số cũ</label>
                    <input
                      type="number"
                      name="water_old"
                      value={currentPayment.water_old}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Chỉ số mới</label>
                    <input
                      type="number"
                      name="water_new"
                      value={currentPayment.water_new}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Đơn giá</label>
                    <input
                      type="number"
                      name="water_price"
                      value={currentPayment.water_price}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  Đã dùng: <span className="text-sky-400 font-bold">{Math.max(0, Number(currentPayment.water_new || 0) - Number(currentPayment.water_old || 0))}</span> khối - Thành tiền: <span className="text-white font-bold">{formatCurrency(currentPayment.water_fee || 0)}</span>
                </div>
              </div>

              {/* Service & Internet parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-800/80 rounded-2xl p-4 space-y-2 bg-slate-950/20">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Phí Dịch Vụ</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Số người</label>
                      <input
                        type="number"
                        name="service_people"
                        value={currentPayment.service_people}
                        onChange={handleNumericInputChange}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Đơn giá</label>
                      <input
                        type="number"
                        name="service_price"
                        value={currentPayment.service_price}
                        onChange={handleNumericInputChange}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-1">
                    Thành tiền: <span className="text-white font-bold">{formatCurrency((Number(currentPayment.service_people) || 0) * (Number(currentPayment.service_price) || 0))}</span>
                  </div>
                </div>

                <div className="border border-slate-800/80 rounded-2xl p-4 space-y-2 bg-slate-950/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Internet</div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Tiền mạng/tháng</label>
                      <input
                        type="number"
                        name="internet_price"
                        value={currentPayment.internet_price}
                        onChange={handleNumericInputChange}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-1">
                    Thành tiền: <span className="text-white font-bold">{formatCurrency(currentPayment.internet_price || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Surcharge parameters */}
              <div className="border border-slate-800/80 rounded-2xl p-4 space-y-3 bg-slate-950/20">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  Phụ phí & Phí phát sinh
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Số tiền phụ phí (VND)</label>
                    <input
                      type="number"
                      name="surcharge"
                      value={currentPayment.surcharge}
                      onChange={handleNumericInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="VD: 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5">Lý do phụ phí</label>
                    <input
                      type="text"
                      name="surcharge_desc"
                      value={currentPayment.surcharge_desc}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="VD: Hỏng khóa, đền bù..."
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  Cộng thêm: <span className="text-rose-400 font-bold">{formatCurrency(currentPayment.surcharge || 0)}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex justify-between items-center mt-6">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tổng số tiền thanh toán</span>
                  <p className="text-2xl font-extrabold text-indigo-300 mt-0.5">{formatCurrency(computedTotal)}</p>
                </div>
                <div className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg font-bold">
                  Bao gồm dịch vụ & mạng
                </div>
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
                  Lưu phiếu thu
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
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-600/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Xóa phiếu thu này?</h3>
              <p className="text-xs text-slate-400 mt-2">Bạn có chắc chắn muốn xóa phiếu thu này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition duration-150 text-sm cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeletePayment(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl transition duration-150 text-sm cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Xóa phiếu thu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
