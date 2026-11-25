import api from './api.js'

export const menuService = {
  async products(params = {}) {
    const { data } = await api.get('/products', { params })
    return data.data.map(product => ({
      ...product,
      id: product._id,
      categoryName: product.category?.name || 'Menu',
      categorySlug: product.category?.slug || '',
      imageUrl: product.imageUrl,
      tag: product.badge || 'MADE WITH CARE',
      veg: product.isVegetarian,
    }))
  },
  async categories() {
    const { data } = await api.get('/categories')
    return data.data
  },
}
