import React, { useEffect, useState } from 'react';
import { roomService, houseService } from '../services/api';
import type { Room, House } from '../services/api';
import { Search, Filter, Plus, Edit2, Trash2, Home, Maximize2, Tag, X, AlertTriangle, Building, MapPin } from 'lucide-react';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null); // null means all

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Rooms Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'edit'>('create');
  const [currentRoom, setCurrentRoom] = useState<Room>({
    house: 0,
    room_code: '',
    room_name: '',
    price: '',
    area: '',
    status: 'empty'
  });
  const [roomFormError, setRoomFormError] = useState<string | null>(null);

  // House Management Modal State
  const [isHouseModalOpen, setIsHouseModalOpen] = useState<boolean>(false);
  const [houseFormMode, setHouseFormMode] = useState<'create' | 'edit'>('create');
  const [currentHouse, setCurrentHouse] = useState<House>({ name: '', address: '', bank_name: '', bank_account: '', bank_owner: '', bank_transfer_prefix: '' });
  const [houseFormError, setHouseFormError] = useState<string | null>(null);

  // Delete Confirm States
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [deleteHouseId, setDeleteHouseId] = useState<number | null>(null);

  const fetchHouses = async () => {
    try {
      const response = await houseService.getAll(undefined, undefined, true);
      setHouses(response.data);
    } catch (err) {
      console.error('Error fetching houses:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAll(
        searchTerm, 
        statusFilter, 
        selectedHouseId || undefined,
        currentPage
      );
      setRooms(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 6));
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Không thể kết nối danh sách phòng trọ. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
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
  }, [searchTerm, statusFilter, selectedHouseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, selectedHouseId, currentPage]);

  // --- ROOM CRUD ACTIONS ---
  const handleOpenCreateRoomModal = () => {
    setRoomModalMode('create');
    setCurrentRoom({
      house: houses[0]?.id || 0, // Default to first house
      room_code: '',
      room_name: '',
      price: '',
      area: '',
      status: 'empty'
    });
    setRoomFormError(null);
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoomModal = (room: Room) => {
    setRoomModalMode('edit');
    setCurrentRoom({ ...room });
    setRoomFormError(null);
    setIsRoomModalOpen(true);
  };

  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentRoom(prev => ({
      ...prev,
      [name]: name === 'house' ? Number(value) : value
    }));
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom.house || !currentRoom.room_code.trim() || !currentRoom.room_name.trim() || !currentRoom.price || !currentRoom.area) {
      setRoomFormError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      if (roomModalMode === 'create') {
        await roomService.create(currentRoom);
      } else {
        if (currentRoom.id) {
          await roomService.update(currentRoom.id, currentRoom);
        }
      }
      setIsRoomModalOpen(false);
      fetchRooms();
    } catch (err: unknown) {
      console.error('Error saving room:', err);
      const axiosError = err as { response?: { data?: { room_code?: string[] } } };
      setRoomFormError(axiosError.response?.data?.room_code ? 'Mã phòng này đã tồn tại.' : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      await roomService.delete(id);
      setDeleteRoomId(null);
      fetchRooms();
    } catch (err: unknown) {
      console.error('Error deleting room:', err);
      const axiosError = err as { response?: { data?: { detail?: string } } };
      alert(axiosError.response?.data?.detail || 'Không thể xóa phòng này (Có thể do phòng đang có hợp đồng hoặc hóa đơn hoạt động).');
      setDeleteRoomId(null);
    }
  };

  // --- HOUSE CRUD ACTIONS ---
  const handleOpenHouseModal = () => {
    setHouseFormMode('create');
    setCurrentHouse({ name: '', address: '', bank_name: '', bank_account: '', bank_owner: '', bank_transfer_prefix: '' });
    setHouseFormError(null);
    setIsHouseModalOpen(true);
  };

  const handleHouseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentHouse(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHouse.name.trim() || !currentHouse.address.trim()) {
      setHouseFormError('Vui lòng điền đủ tên và địa chỉ nhà trọ.');
      return;
    }

    try {
      if (houseFormMode === 'create') {
        await houseService.create(currentHouse);
      } else {
        if (currentHouse.id) {
          await houseService.update(currentHouse.id, currentHouse);
        }
      }
      setHouseFormMode('create');
      setCurrentHouse({ name: '', address: '', bank_name: '', bank_account: '', bank_owner: '', bank_transfer_prefix: '' });
      setHouseFormError(null);
      fetchHouses();
      fetchRooms(); // refresh in case names updated
    } catch (err) {
      console.error('Error saving house:', err);
      setHouseFormError('Không thể lưu thông tin nhà trọ.');
    }
  };

  const handleEditHouseClick = (house: House) => {
    setHouseFormMode('edit');
    setCurrentHouse({
      id: house.id,
      name: house.name || '',
      address: house.address || '',
      bank_name: house.bank_name || '',
      bank_account: house.bank_account || '',
      bank_owner: house.bank_owner || '',
      bank_transfer_prefix: house.bank_transfer_prefix || '',
    });
    setHouseFormError(null);
  };

  const handleDeleteHouse = async (id: number) => {
    try {
      await houseService.delete(id);
      setDeleteHouseId(null);
      fetchHouses();
      fetchRooms();
      if (selectedHouseId === id) setSelectedHouseId(null);
    } catch (err) {
      console.error('Error deleting house:', err);
      alert('Không thể xóa nhà trọ này. Vui lòng kiểm tra xem có phòng nào thuộc nhà này đang có hoạt động không.');
      setDeleteHouseId(null);
    }
  };



  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý Phòng</h1>
          <p className="text-slate-400 mt-1">Xem, tìm kiếm, thêm mới phòng và quản lý danh sách các khu nhà trọ.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenHouseModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-800 transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Building className="w-4 h-4 text-indigo-400" />
            Quản lý nhà trọ
          </button>
          <button
            onClick={handleOpenCreateRoomModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="w-5 h-5" />
            Thêm phòng mới
          </button>
        </div>
      </div>

      {/* House Tabs Selectors */}
      {houses.length > 0 && (
        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setSelectedHouseId(null)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer ${
              selectedHouseId === null
                ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-500/5'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả nhà ({totalCount})
          </button>
          {houses.map(house => (
            <button
              key={house.id}
              onClick={() => house.id && setSelectedHouseId(house.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer ${
                selectedHouseId === house.id
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {house.name}
            </button>
          ))}
        </div>
      )}

      {/* Filters & Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã phòng, tên phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm"
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm cursor-pointer appearance-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="empty">Trống</option>
            <option value="rented">Đang thuê</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel border-slate-800 rounded-2xl p-6 h-60 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-6 w-32 shimmer rounded"></div>
                <div className="h-4 w-48 shimmer rounded"></div>
              </div>
              <div className="h-10 w-full shimmer rounded"></div>
            </div>
          ))}
        </div>
      ) : error && rooms.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto text-center border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-4">{error}</p>
          <button onClick={fetchRooms} className="px-5 py-2 bg-indigo-600 rounded-lg text-white text-sm">Tải lại</button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          <Home className="w-16 h-16 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Không tìm thấy phòng nào</h3>
          <p className="text-sm text-slate-400">Hãy thêm mới phòng hoặc thay đổi bộ lọc nhà trọ.</p>
        </div>
      ) : (
        /* Rooms Grid and Pagination */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between h-60 border border-slate-800 relative">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs uppercase font-extrabold px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
                      {room.room_code}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                      room.status === 'empty'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5'
                        : 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-violet-500/5'
                    }`}>
                      {room.status === 'empty' ? 'Trống' : 'Đang thuê'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white line-clamp-1">{room.room_name}</h3>
                  
                  {/* House label */}
                  <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                    <Building className="w-3.5 h-3.5" />
                    <span>{room.house_name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Maximize2 className="w-4 h-4 text-slate-500" />
                      <span>{room.area} m²</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-indigo-300">{formatCurrency(room.price)}/tháng</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-slate-800/80 pt-4 mt-4">
                  <button
                    onClick={() => handleOpenEditRoomModal(room)}
                    className="flex-1 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => room.id && setDeleteRoomId(room.id)}
                    className="py-2 px-3 bg-red-950/20 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/85">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-white">{Math.min((currentPage - 1) * 6 + 1, totalCount)}</span> đến{' '}
                <span className="font-bold text-white">{Math.min(currentPage * 6, totalCount)}</span> trong tổng số{' '}
                <span className="font-bold text-white">{totalCount}</span> phòng trọ
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

      {/* Create/Edit Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsRoomModalOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border-slate-700 relative z-10 animate-scale-up">
            <button 
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {roomModalMode === 'create' ? 'Thêm phòng mới' : 'Chỉnh sửa phòng'}
            </h3>
            
            <form onSubmit={handleSaveRoom} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chọn Nhà trọ *</label>
                  <select
                    name="house"
                    value={currentRoom.house}
                    onChange={handleRoomInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                  >
                    {houses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Trạng thái</label>
                  <select
                    name="status"
                    value={currentRoom.status}
                    onChange={handleRoomInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                  >
                    <option value="empty">Trống</option>
                    <option value="rented">Đang thuê</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mã phòng *</label>
                  <input
                    type="text"
                    name="room_code"
                    required
                    disabled={roomModalMode === 'edit'}
                    placeholder="VD: P101"
                    value={currentRoom.room_code}
                    onChange={handleRoomInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tên phòng *</label>
                  <input
                    type="text"
                    name="room_name"
                    required
                    placeholder="VD: Phòng 101"
                    value={currentRoom.room_name}
                    onChange={handleRoomInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Giá thuê (VND/tháng) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    placeholder="VD: 2500000"
                    value={currentRoom.price}
                    onChange={handleRoomInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Diện tích (m²) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="area"
                    required
                    min="0"
                    placeholder="VD: 15.5"
                    value={currentRoom.area}
                    onChange={handleRoomInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>

              {roomFormError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{roomFormError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
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

      {/* House Management CRUD Modal */}
      {isHouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsHouseModalOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border-slate-700 relative z-10 animate-scale-up flex flex-col md:flex-row gap-6 max-h-[85vh]">
            <button 
              onClick={() => setIsHouseModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: House List */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Danh sách Nhà trọ ({houses.length})
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[45vh] md:max-h-[60vh] scrollbar-thin">
                {houses.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                    <p className="text-sm">Chưa có nhà trọ nào được tạo.</p>
                  </div>
                ) : (
                  houses.map(h => (
                    <div key={h.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{h.name}</div>
                        <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {h.address}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleEditHouseClick(h)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => h.id && setDeleteHouseId(h.id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side: Form (Add/Edit) */}
            <div className="w-full md:w-72 flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
              <h3 className="text-base font-bold text-white mb-4">
                {houseFormMode === 'create' ? 'Thêm nhà trọ mới' : 'Chỉnh sửa nhà trọ'}
              </h3>
              
              <form onSubmit={handleSaveHouse} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên tòa nhà *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="VD: Tòa nhà A (Cầu Giấy)"
                    value={currentHouse.name}
                    onChange={handleHouseInputChange}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Địa chỉ *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Số 12 Cầu Giấy, Hà Nội"
                    value={currentHouse.address}
                    onChange={handleHouseInputChange}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>

                {houseFormError && (
                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-2.5">
                    {houseFormError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {houseFormMode === 'edit' && (
                    <button
                      type="button"
                      onClick={() => {
                        setHouseFormMode('create');
                        setCurrentHouse({ name: '', address: '', bank_name: '', bank_account: '', bank_owner: '', bank_transfer_prefix: '' });
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                  >
                    {houseFormMode === 'create' ? 'Tạo mới' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* Delete Room Confirm Modal */}
      {deleteRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteRoomId(null)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border-red-500/20 relative z-10 animate-scale-up text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa phòng?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa phòng trọ này khỏi hệ thống?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteRoomId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteRoom(deleteRoomId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-red-600/25"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete House Confirm Modal */}
      {deleteHouseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteHouseId(null)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border-red-500/20 relative z-10 animate-scale-up text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa Nhà trọ?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa Nhà trọ này? Tất cả các phòng trọ trực thuộc nhà trọ này sẽ bị xóa khỏi hệ thống!
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteHouseId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteHouse(deleteHouseId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-lg shadow-red-600/25"
              >
                Xóa bỏ nhà
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
