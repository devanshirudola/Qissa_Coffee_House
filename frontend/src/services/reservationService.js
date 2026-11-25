import api from './api.js'

export const reservationService = {
  async config() {
    const { data } = await api.get('/reservations/config')
    return data.data
  },
  async availability(date) {
    const { data } = await api.get('/reservations/availability', { params: { date } })
    return data.data
  },
  async mine() {
    const { data } = await api.get('/reservations/mine')
    return data.data
  },
  async manage(status) {
    const { data } = await api.get('/reservations/manage', { params: status ? { status } : {} })
    return data.data
  },
  async create(reservation) {
    const { data } = await api.post('/reservations', reservation)
    return data.data
  },
  async cancel(id) {
    const { data } = await api.patch(`/reservations/${id}/cancel`)
    return data.data
  },
  async updateStatus(id, status) {
    const { data } = await api.patch(`/reservations/${id}/status`, { status })
    return data.data
  },
}
