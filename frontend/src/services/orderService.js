import api from './api.js'

export const orderService = {
  async create(order) {
    const { data } = await api.post('/orders', order)
    return data.data
  },
  async mine() {
    const { data } = await api.get('/orders/mine')
    return data.data
  },
}
