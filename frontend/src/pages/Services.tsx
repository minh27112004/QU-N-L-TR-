import React, { useEffect, useState } from 'react';
import { houseService } from '../services/api';
import type { House } from '../services/api';
import { Building, MapPin, CreditCard, Zap, AlertTriangle, CheckCircle, Sliders, Landmark, Save } from 'lucide-react';

const Services: React.FC = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state for houses
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected house for editing
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'bank'>('rates');

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const response = await houseService.getAll(searchTerm || undefined, undefined, true);
      setHouses(response.data);
      
      // Auto-select first house if none is selected, or update the currently selected house reference
      if (response.data.length > 0) {
        setSelectedHouse(prev => {
          if (!prev) return response.data[0];
          const updated = response.data.find((h: House) => h.id === prev.id);
          return updated || response.data[0];
        });
      } else {
        setSelectedHouse(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching houses for configuration:', err);
      setError('Không thể kết nối danh sách nhà trọ. Vui lòng kiểm tra API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (selectedHouse) {
      setSelectedHouse(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse || !selectedHouse.id) {
      setFormError('Vui lòng chọn tòa nhà để thiết lập cấu hình.');
      return;
    }

    // Validation
    if (activeSubTab === 'rates') {
      const { elec_price, water_price, service_price, internet_price } = selectedHouse;
      if (elec_price === undefined || elec_price === '' || 
          water_price === undefined || water_price === '' || 
          service_price === undefined || service_price === '' || 
          internet_price === undefined || internet_price === '') {
        setFormError('Vui lòng điền đầy đủ tất cả đơn giá dịch vụ.');
        return;
      }
    } else {
      const { bank_name, bank_account, bank_owner, bank_transfer_prefix } = selectedHouse;
      if (!bank_name?.trim() || !bank_account?.trim() || !bank_owner?.trim() || !bank_transfer_prefix?.trim()) {
        setFormError('Vui lòng điền đầy đủ tất cả thông tin chuyển khoản.');
        return;
      }
    }

    try {
      setFormError(null);
      setFormSuccess(null);
      
      await houseService.update(selectedHouse.id, selectedHouse);
      
      setFormSuccess('Cập nhật cấu hình thành công!');
      // Refresh the house list to update display values
      const response = await houseService.getAll(searchTerm || undefined, undefined, true);
      setHouses(response.data);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setFormSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving house configuration:', err);
      setFormError('Không thể lưu cấu hình. Vui lòng thử lại.');
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Cấu hình & Dịch vụ</h1>
        <p className="text-slate-400 mt-1">
          Quản lý đơn giá dịch vụ (điện, nước, mạng, dịch vụ chung) và tài khoản ngân hàng nhận thanh toán theo từng khu nhà trọ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: House Selector (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-4 rounded-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              Chọn nhà trọ cần cấu hình
            </h2>
            <input
              type="text"
              placeholder="Tìm kiếm tòa nhà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-sm"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
            {loading && houses.length === 0 ? (
              [1, 2, 3].map(n => (
                <div key={n} className="glass-panel border-slate-800 rounded-2xl p-4 h-24 shimmer"></div>
              ))
            ) : error ? (
              <div className="glass-panel rounded-2xl p-6 text-center border-red-500/30">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-slate-300 text-xs">{error}</p>
              </div>
            ) : houses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <Building className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm">Chưa có tòa nhà nào.</p>
              </div>
            ) : (
              houses.map(h => {
                const isSelected = selectedHouse?.id === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHouse({ ...h });
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`glass-card p-5 rounded-2xl border cursor-pointer transition duration-200 relative group overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/10 shadow-lg shadow-indigo-500/5'
                        : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    )}
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">
                          {h.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          {h.address}
                        </p>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-slate-900/80 border-slate-800 text-slate-500'
                      }`}>
                        {isSelected ? 'Đang chọn' : 'Xem'}
                      </span>
                    </div>

                    <div className="border-t border-slate-800/60 mt-3 pt-3 grid grid-cols-2 gap-2 text-[10.5px] text-slate-400">
                      <div>
                        <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Điện / Nước</div>
                        <div className="font-medium mt-0.5 text-slate-300">
                          {formatCurrency(h.elec_price || 3800)} - {formatCurrency(h.water_price || 35000)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Tài khoản</div>
                        <div className="font-medium mt-0.5 text-slate-300 truncate">
                          {h.bank_account ? `${h.bank_name} - ${h.bank_account}` : 'Chưa thiết lập'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Configuration Area (lg:col-span-7) */}
        <div className="lg:col-span-7">
          {selectedHouse ? (
            <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-6">
              {/* Target Building Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Tòa nhà đang chọn</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedHouse.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {selectedHouse.address}
                  </p>
                </div>
              </div>

              {/* Sub-tab selection */}
              <div className="flex border-b border-slate-800/60 p-1 bg-slate-950/40 rounded-xl max-w-md">
                <button
                  onClick={() => {
                    setActiveSubTab('rates');
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activeSubTab === 'rates'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Đơn giá dịch vụ
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab('bank');
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activeSubTab === 'bank'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Thông tin chuyển khoản
                </button>
              </div>

              {/* Success/Error Alerts */}
              {formSuccess && (
                <div className="flex items-center gap-2.5 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3.5 animate-scale-up">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2.5 text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl p-3.5 animate-scale-up">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSaveConfig} className="space-y-5">
                {activeSubTab === 'rates' ? (
                  /* TAB 1: SERVICE RATES CONFIG */
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Đơn giá chi tiết
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Đơn giá điện (VND / số) *
                          </label>
                          <input
                            type="number"
                            name="elec_price"
                            required
                            min="0"
                            placeholder="VD: 3800"
                            value={selectedHouse.elec_price !== undefined ? selectedHouse.elec_price : '3800'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Đơn giá nước (VND / khối) *
                          </label>
                          <input
                            type="number"
                            name="water_price"
                            required
                            min="0"
                            placeholder="VD: 35000"
                            value={selectedHouse.water_price !== undefined ? selectedHouse.water_price : '35000'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Phí dịch vụ chung (VND / người) *
                          </label>
                          <input
                            type="number"
                            name="service_price"
                            required
                            min="0"
                            placeholder="VD: 100000"
                            value={selectedHouse.service_price !== undefined ? selectedHouse.service_price : '100000'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Tiền Internet cố định (VND / phòng) *
                          </label>
                          <input
                            type="number"
                            name="internet_price"
                            required
                            min="0"
                            placeholder="VD: 100000"
                            value={selectedHouse.internet_price !== undefined ? selectedHouse.internet_price : '100000'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: BANK DETAILS CONFIG */
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                        Tài khoản ngân hàng liên kết
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Tên ngân hàng *
                          </label>
                          <input
                            type="text"
                            name="bank_name"
                            required
                            placeholder="VD: VIETCOMBANK (VCB)"
                            value={selectedHouse.bank_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Số tài khoản *
                          </label>
                          <input
                            type="text"
                            name="bank_account"
                            required
                            placeholder="VD: 7373700107"
                            value={selectedHouse.bank_account || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Chủ tài khoản (Viết hoa không dấu) *
                          </label>
                          <input
                            type="text"
                            name="bank_owner"
                            required
                            placeholder="VD: PHAM VAN QUANG"
                            value={selectedHouse.bank_owner || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                            Cú pháp / Mã viết tắt chuyển khoản *
                          </label>
                          <input
                            type="text"
                            name="bank_transfer_prefix"
                            required
                            placeholder="VD: TS"
                            value={selectedHouse.bank_transfer_prefix || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition text-sm"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Sử dụng để tạo nội dung chuyển khoản tự động (VD: [Mã viết tắt] + [Mã phòng]).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-2 border-t border-slate-800/80">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl transition duration-150 shadow-lg shadow-indigo-600/35 flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Save className="w-4.5 h-4.5" />
                    Lưu cấu hình {activeSubTab === 'rates' ? 'đơn giá' : 'tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-panel text-center py-32 rounded-3xl border-slate-800">
              <Sliders className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Chưa có tòa nhà nào được chọn</h3>
              <p className="text-sm text-slate-400">Vui lòng chọn một tòa nhà bên trái để thiết lập các thông số dịch vụ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
