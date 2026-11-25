import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'

export async function listProducts(req, res, next) {
  try {
    const { category, q, featured } = req.query
    const filter = { isPublished: { $ne: false } }
    if (featured === 'true') filter.isFeatured = true
    if (category) {
      const match = await Category.findOne({ slug: String(category).toLowerCase(), isActive: true }).select('_id')
      if (!match) return res.json({ success: true, data: [] })
      filter.category = match._id
    }
    if (q) {
      const term = String(q).trim().slice(0, 80)
      if (term) filter.$or = [
        { name: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { description: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ]
    }
    const products = await Product.find(filter).populate('category', 'name slug').sort({ isAvailable: -1, isFeatured: -1, name: 1 }).limit(100).lean()
    res.json({ success: true, data: products })
  } catch (error) { next(error) }
}

export async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Menu item not found.' })
    const product = await Product.findOne({ _id: req.params.id, isPublished: { $ne: false } }).populate('category', 'name slug').lean()
    if (!product) return res.status(404).json({ success: false, message: 'Menu item not found.' })
    res.json({ success: true, data: product })
  } catch (error) { next(error) }
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()
    res.json({ success: true, data: categories })
  } catch (error) { next(error) }
}
