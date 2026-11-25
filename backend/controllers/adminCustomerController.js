import mongoose from 'mongoose'
import User from '../models/User.js'
import Order from '../models/Order.js'
import Reservation from '../models/Reservation.js'

export async function listAdminCustomers(req, res, next) {
  try {
    const { page = 1, limit = 15, search = '' } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15))
    const skip = (pageNum - 1) * limitNum

    const matchUser = { role: 'customer' }
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(term, 'i')
      matchUser.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ]
    }

    const [customers, total] = await Promise.all([
      User.aggregate([
        { $match: matchUser },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders',
          },
        },
        {
          $lookup: {
            from: 'reservations',
            localField: '_id',
            foreignField: 'user',
            as: 'reservations',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            createdAt: 1,
            totalOrders: { $size: '$orders' },
            totalSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$orders',
                      as: 'order',
                      cond: { $ne: ['$$order.status', 'Cancelled'] },
                    },
                  },
                  as: 'validOrder',
                  in: '$$validOrder.total',
                },
              },
            },
            totalReservations: { $size: '$reservations' },
          },
        },
      ]),
      User.countDocuments(matchUser),
    ])

    return res.json({
      success: true,
      data: {
        customers,
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

export async function getAdminCustomer(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid customer ID.' })
    }

    const user = await User.findOne({ _id: id, role: 'customer' }).lean()
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found.' })
    }

    const [orders, reservations] = await Promise.all([
      Order.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
      Reservation.find({ user: user._id }).sort({ bookingDate: -1, bookingTime: -1 }).lean(),
    ])

    const totalSpent = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0)

    return res.json({
      success: true,
      data: {
        customer: {
          ...user,
          totalOrders: orders.length,
          totalSpent,
          totalReservations: reservations.length,
        },
        orders,
        reservations,
      },
    })
  } catch (error) {
    next(error)
  }
}
