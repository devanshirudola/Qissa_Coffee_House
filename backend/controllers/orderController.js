import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { notifyAdmin } from '../utils/notifyAdmin.js'

export async function createOrder(req, res, next) {
  try {
    const { items, phone, note = '' } = req.body ?? {}
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return res.status(400).json({ success: false, message: 'Your bag must contain between 1 and 20 different items.' })
    }
    if (typeof phone !== 'string' || phone.trim().length < 5 || phone.trim().length > 30) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number for your pickup.' })
    }
    if (typeof note !== 'string' || note.length > 500) {
      return res.status(400).json({ success: false, message: 'The order note can be up to 500 characters.' })
    }

    const requested = new Map()
    for (const item of items) {
      const productId = item?.productId
      const quantity = Number(item?.quantity)
      const isId = mongoose.isValidObjectId(productId)
      const isSlug = typeof productId === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId)
      if ((!isId && !isSlug) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ success: false, message: 'One or more items in your bag are invalid.' })
      }
      if (requested.has(String(productId))) return res.status(400).json({ success: false, message: 'Remove duplicate items from your bag and try again.' })
      requested.set(String(productId), quantity)
    }

    const lookup = [...requested.keys()].map(value => mongoose.isValidObjectId(value) ? { _id: value } : { slug: value })
    const products = await Product.find({ $or: lookup, isAvailable: true, isPublished: { $ne: false } }).lean()
    if (products.length !== requested.size) {
      return res.status(409).json({ success: false, message: 'A menu item is no longer available. Please refresh your bag.' })
    }

    const orderItems = products.map(product => ({
      product: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: requested.get(String(product._id)) ?? requested.get(product.slug),
      isSample: product.isSample,
    }))
    const subtotal = Math.round(orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100
    const isSample = orderItems.some(item => item.isSample)
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: phone.trim(),
      orderType: 'pickup',
      note: note.trim(),
      subtotal,
      total: subtotal,
      paymentMethod: 'pay_at_cafe',
      paymentStatus: 'unpaid',
      isSample,
    })

    // Notify administrators in real-time
    await notifyAdmin({
      type: 'new_order',
      title: 'New Customer Order Placed',
      message: `Order #${order.orderNumber} placed by ${order.customerName} for ₹${order.total}`,
      referenceId: order._id,
      referenceModel: 'Order',
      data: { orderNumber: order.orderNumber, total: order.total, customerName: order.customerName },
    })

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Please check your order details and try again.' })
    next(error)
  }
}

export async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean()
    res.json({ success: true, data: orders })
  } catch (error) { next(error) }
}

export async function getMyOrder(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Order not found.' })
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean()
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })
    res.json({ success: true, data: order })
  } catch (error) { next(error) }
}
