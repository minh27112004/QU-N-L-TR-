import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token to headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: redirect to login on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// TypeScript Interfaces
export interface House {
  id?: number;
  name: string;
  address: string;
  bank_name?: string;
  bank_account?: string;
  bank_owner?: string;
  bank_transfer_prefix?: string;
  elec_price?: number | string;
  water_price?: number | string;
  service_price?: number | string;
  internet_price?: number | string;
}

export interface Room {
  id?: number;
  house: number;
  room_code: string;
  room_name: string;
  price: number | string;
  area: number | string;
  status: 'empty' | 'rented';
  house_name?: string;
}

export interface Tenant {
  id?: number;
  full_name: string;
  phone: string;
  citizen_id: string;
  address?: string;
}

export interface Contract {
  id?: number;
  tenant: number;
  room: number;
  start_date: string;
  end_date: string;
  deposit: number | string;
  rent_price: number | string;
  is_active?: boolean;
  occupants_count?: number;
  // representation fields from backend
  room_code?: string;
  room_name?: string;
  house_name?: string;
  tenant_name?: string;
  tenant_phone?: string;
}

export interface Payment {
  id?: number;
  room: number;
  month: string; // YYYY-MM
  room_fee?: number | string;
  electricity_fee: number | string;
  water_fee: number | string;
  total_amount?: number | string;
  payment_status: 'paid' | 'unpaid';
  created_at?: string;
  surcharge?: number | string;
  surcharge_desc?: string;
  
  // Detailed indices
  elec_old?: number | string;
  elec_new?: number | string;
  elec_price?: number | string;
  water_old?: number | string;
  water_new?: number | string;
  water_price?: number | string;
  service_people?: number | string;
  service_price?: number | string;
  internet_price?: number | string;

  // representation fields from backend
  room_code?: string;
  room_name?: string;
  house_name?: string;
}

export interface DashboardStats {
  stats: {
    total_houses: number;
    total_rooms: number;
    rented_rooms: number;
    empty_rooms: number;
    total_tenants: number;
    current_month_revenue: number;
    current_month_expense: number;
    current_month_net: number;
    current_month: string;
  };
  revenue_by_month: Array<{
    month: string;
    label: string;
    revenue: number;
    expense: number;
    profit: number;
  }>;
  payment_status_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recent_unpaid: Payment[];
}

export interface Expense {
  id?: number;
  house: number;
  description: string;
  amount: number | string;
  date: string;
  category: 'repair' | 'utility' | 'tax' | 'other';
  house_name?: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Services
export const houseService = {
  getAll: (search?: string, page?: number, noPagination?: boolean) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    return apiClient.get<any>('/houses/', { params });
  },
  getById: (id: number) => apiClient.get<House>(`/houses/${id}/`),
  create: (data: House) => apiClient.post<House>('/houses/', data),
  update: (id: number, data: House) => apiClient.put<House>(`/houses/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/houses/${id}/`),
};

export const roomService = {
  getAll: (search?: string, status?: string, houseId?: number, page?: number, noPagination?: boolean) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (houseId) params.house_id = houseId.toString();
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    return apiClient.get<any>('/rooms/', { params });
  },
  getById: (id: number) => apiClient.get<Room>(`/rooms/${id}/`),
  getLatestUtility: (id: number) => apiClient.get<{
    elec_old: number;
    water_old: number;
    occupants_count?: number;
    elec_price?: number | string;
    water_price?: number | string;
    service_price?: number | string;
    internet_price?: number | string;
  }>(`/rooms/${id}/latest-utility/`),
  create: (data: Room) => apiClient.post<Room>('/rooms/', data),
  update: (id: number, data: Room) => apiClient.put<Room>(`/rooms/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/rooms/${id}/`),
};

export const tenantService = {
  getAll: (search?: string, page?: number, noPagination?: boolean) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    return apiClient.get<any>('/tenants/', { params });
  },
  getById: (id: number) => apiClient.get<Tenant>(`/tenants/${id}/`),
  create: (data: Tenant) => apiClient.post<Tenant>('/tenants/', data),
  update: (id: number, data: Tenant) => apiClient.put<Tenant>(`/tenants/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/tenants/${id}/`),
};

export const contractService = {
  getAll: (isActive?: boolean, page?: number, noPagination?: boolean, houseId?: number) => {
    const params: Record<string, string> = {};
    if (isActive !== undefined) params.is_active = isActive.toString();
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    if (houseId !== undefined) params.house_id = houseId.toString();
    return apiClient.get<any>('/contracts/', { params });
  },
  getById: (id: number) => apiClient.get<Contract>(`/contracts/${id}/`),
  create: (data: Contract) => apiClient.post<Contract>('/contracts/', data),
  update: (id: number, data: Contract) => apiClient.put<Contract>(`/contracts/${id}/`, data),
  terminate: (id: number) => apiClient.post<{ status: string; is_active: boolean; end_date: string }>(`/contracts/${id}/terminate/`),
};

export const paymentService = {
  getAll: (month?: string, status?: string, roomId?: number, houseId?: number, page?: number, noPagination?: boolean) => {
    const params: Record<string, string> = {};
    if (month) params.month = month;
    if (status) params.status = status;
    if (roomId) params.room_id = roomId.toString();
    if (houseId) params.house_id = houseId.toString();
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    return apiClient.get<any>('/payments/', { params });
  },
  getById: (id: number) => apiClient.get<Payment>(`/payments/${id}/`),
  create: (data: Payment) => apiClient.post<Payment>('/payments/', data),
  update: (id: number, data: Payment) => apiClient.put<Payment>(`/payments/${id}/`, data),
  confirm: (id: number) => apiClient.post<{ status: string; payment_status: string }>(`/payments/${id}/confirm/`),
  exportExcel: (id: number) => apiClient.get(`/payments/${id}/export-excel/`, { responseType: 'blob' }),
  exportExcelByHouse: (houseId: number, month?: string) => {
    const params: Record<string, string> = { house_id: houseId.toString() };
    if (month) params.month = month;
    return apiClient.get('/payments/export-excel-by-house/', { params, responseType: 'blob' });
  },
  delete: (id: number) => apiClient.delete(`/payments/${id}/`),
};

export const expenseService = {
  getAll: (houseId?: number, category?: string, page?: number, noPagination?: boolean) => {
    const params: Record<string, string> = {};
    if (houseId) params.house_id = houseId.toString();
    if (category) params.category = category;
    if (page) params.page = page.toString();
    if (noPagination) params.no_pagination = 'true';
    return apiClient.get<any>('/expenses/', { params });
  },
  getById: (id: number) => apiClient.get<Expense>(`/expenses/${id}/`),
  create: (data: Expense) => apiClient.post<Expense>('/expenses/', data),
  update: (id: number, data: Expense) => apiClient.put<Expense>(`/expenses/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/expenses/${id}/`),
};

export const dashboardService = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats/'),
};

export const authService = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string }>('/login/', { username, password }),
  logout: () =>
    apiClient.post('/logout/'),
};

export default apiClient;
