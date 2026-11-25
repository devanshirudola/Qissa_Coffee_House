import mongoose from 'mongoose'
import Order from '../models/Order.js'
import { notifyAdmin } from '../utils/notifyAdmin.js'
import { emitToAdmins } from '../utils/socket.js'

export async function listAdminOrders(req, res, next) {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      status = 'all',
      paymentStatus = 'all',
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12))
    const skip = (pageNum - 1) * limitNum

    const filter = {}

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Payment Status filter
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        filter.createdAt.$gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = end
      }
    }

    // Text search filter
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(term, 'i')
      filter.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex },
        { 'items.name': regex },
      ]
    }

    // Sorting
    const sortField = ['createdAt', 'total', 'orderNumber', 'status'].includes(sortBy) ? sortBy : 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sort = { [sortField]: sortDirection }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email phone createdAt')
        .lean(),
      Order.countDocuments(filter),
    ])

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getAdminOrder(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid order ID format.' })
    }

    const order = await Order.findById(id)
      .populate('user', 'name email phone createdAt')
      .lean()

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order could not be found.' })
    }

    return res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status, note } = req.body ?? {}

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid order ID.' })
    }

    const allowed = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      })
    }

    const updateFields = { status }
    if (typeof note === 'string' && note.trim()) {
      updateFields.note = note.trim()
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    )
      .populate('user', 'name email phone')
      .lean()

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    // Broadcast status change to real-time clients
    emitToAdmins('order_updated', order)

    // Notify if order was cancelled
    if (status === 'Cancelled') {
      await notifyAdmin({
        type: 'order_cancelled',
        title: `Order #${order.orderNumber} Cancelled`,
        message: `Order #${order.orderNumber} for ${order.customerName} has been marked as cancelled.`,
        referenceId: order._id,
        referenceModel: 'Order',
        data: { orderNumber: order.orderNumber, status: 'Cancelled' },
      })
    }

    return res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

export async function updateOrderPayment(req, res, next) {
  try {
    const { id } = req.params
    const { paymentStatus, paymentMethod } = req.body ?? {}

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid order ID.' })
    }

    const update = {}
    if (['unpaid', 'paid', 'refunded'].includes(paymentStatus)) {
      update.paymentStatus = paymentStatus
    }
    if (['pay_at_cafe', 'cash', 'upi', 'card'].includes(paymentMethod)) {
      update.paymentMethod = paymentMethod
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid payment fields provided.' })
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean()

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    emitToAdmins('order_updated', order)

    if (paymentStatus === 'paid') {
      await notifyAdmin({
        type: 'payment_completed',
        title: `Payment Received for Order #${order.orderNumber}`,
        message: `Payment of ₹${order.total} marked as received (${order.paymentMethod}).`,
        referenceId: order._id,
        referenceModel: 'Order',
        data: { orderNumber: order.orderNumber, total: order.total },
      })
    }

    return res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}
