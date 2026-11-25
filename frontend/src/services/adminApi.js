import axios from 'axios'

const adminApi = axios.create({
  // Base URL for admin APIs; defaults to local dev server when VITE_API_URL is not set.
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('qissa-admin-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If admin token is invalid/expired on an admin call
      if (localStorage.getItem('qissa-admin-token')) {
        localStorage.removeItem('qissa-admin-token')
        localStorage.removeItem('qissa-admin-user')
      }
    }
    return Promise.reject(error)
  }
)

export const adminAuthService = {
  async login(credentials) {
    const { data } = await adminApi.post('/admin/auth/login', credentials)
    return data
  },
  async me() {
    const { data } = await adminApi.get('/admin/auth/me')
    return data.user
  },
}

export const adminDashboardService = {
  async stats() {
    const { data } = await adminApi.get('/admin/dashboard/stats')
    return data.data
  },
}

export const adminOrderService = {
  async list(params = {}) {
    const { data } = await adminApi.get('/admin/orders', { params })
    return data.data
  },
  async get(id) {
    const { data } = await adminApi.get(`/admin/orders/${id}`)
    return data.data
  },
  async updateStatus(id, status, note = '') {
    const { data } = await adminApi.patch(`/admin/orders/${id}/status`, { status, note })
    return data.data
  },
  async updatePayment(id, paymentStatus, paymentMethod) {
    const { data } = await adminApi.patch(`/admin/orders/${id}/payment`, { paymentStatus, paymentMethod })
    return data.data
  },
}

export const adminReservationService = {
  async list(params = {}) {
    const { data } = await adminApi.get('/admin/reservations', { params })
    return data.data
  },
  async get(id) {
    const { data } = await adminApi.get(`/admin/reservations/${id}`)
    return data.data
  },
  async updateStatus(id, status) {
    const { data } = await adminApi.patch(`/admin/reservations/${id}/status`, { status })
    return data.data
  },
}

export const adminCustomerService = {
  async list(params = {}) {
    const { data } = await adminApi.get('/admin/customers', { params })
    return data.data
  },
  async get(id) {
    const { data } = await adminApi.get(`/admin/customers/${id}`)
    return data.data
  },
}

export const adminMenuService = {
  async list(params = {}) {
    const { data } = await adminApi.get('/admin/products', { params })
    return data.data
  },
  async create(product) {
    const { data } = await adminApi.post('/admin/products', product)
    return data.data
  },
  async update(id, product) {
    const { data } = await adminApi.put(`/admin/products/${id}`, product)
    return data.data
  },
  async delete(id) {
    const { data } = await adminApi.delete(`/admin/products/${id}`)
    return data
  },
  async categories() {
    const { data } = await adminApi.get('/admin/categories')
    return data.data
  },
  async createCategory(cat) {
    const { data } = await adminApi.post('/admin/categories', cat)
    return data.data
  },
}

export const adminNotificationService = {
  async list(params = {}) {
    const { data } = await adminApi.get('/admin/notifications', { params })
    return data.data
  },
  async markRead(id) {
    const { data } = await adminApi.patch(`/admin/notifications/${id}/read`)
    return data
  },
  async markAllRead() {
    const { data } = await adminApi.patch('/admin/notifications/read-all')
    return data
  },
}

export const adminSettingsService = {
  async get() {
    const { data } = await adminApi.get('/admin/settings')
    return data.data
  },
  async updateProfile(profileData) {
    const { data } = await adminApi.patch('/admin/settings/profile', profileData)
    return data
  },
}

export default adminApi
