import axios from 'axios'

const api = axios.create({
  // Base URL is taken from environment; fallback only for local development.
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qissa-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authService = {
  register: (details) => api.post('/auth/register', details).then(({ data }) => data),
  login: (credentials) => api.post('/auth/login', credentials).then(({ data }) => data),
  currentUser: () => api.get('/auth/me').then(({ data }) => data.user),
}

export default api