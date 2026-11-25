import Order from '../models/Order.js'
import Reservation from '../models/Reservation.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

export async function getDashboardStats(_req, res, next) {
  try {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // 1. Core metric counts
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
      newOrdersToday,
      totalReservations,
      pendingReservations,
      confirmedReservations,
      completedReservations,
      cancelledReservations,
      totalCustomers,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Confirmed' }),
      Order.countDocuments({ status: 'Preparing' }),
      Order.countDocuments({ status: 'Ready' }),
      Order.countDocuments({ status: 'Completed' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'Pending' }),
      Reservation.countDocuments({ status: 'Confirmed' }),
      Reservation.countDocuments({ status: 'Completed' }),
      Reservation.countDocuments({ status: { $in: ['Rejected', 'Cancelled'] } }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ])

    const totalRevenue = revenueResult[0]?.total || 0

    // 2. Daily Sales (last 7 days)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const dailySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const salesByDayMap = new Map(dailySalesAgg.map((item) => [item._id, item]))
    const dailySales = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const found = salesByDayMap.get(dateStr)
      dailySales.push({
        date: dateStr,
        label,
        sales: found ? found.sales : 0,
        orders: found ? found.orders : 0,
      })
    }

    // 3. Monthly Revenue (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    const monthlyRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const monthlyMap = new Map(monthlyRevenueAgg.map((item) => [item._id, item]))
    const monthlyRevenue = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const found = monthlyMap.get(key)
      monthlyRevenue.push({
        month: key,
        label,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      })
    }

    // 4. Orders by Status
    const ordersByStatus = [
      { status: 'Pending', label: 'New / Pending', count: pendingOrders, color: '#d97706' },
      { status: 'Confirmed', label: 'Confirmed', count: confirmedOrders, color: '#3b82f6' },
      { status: 'Preparing', label: 'Preparing', count: preparingOrders, color: '#8b5cf6' },
      { status: 'Ready', label: 'Ready for Pickup', count: readyOrders, color: '#10b981' },
      { status: 'Completed', label: 'Completed', count: completedOrders, color: '#059669' },
      { status: 'Cancelled', label: 'Cancelled', count: cancelledOrders, color: '#ef4444' },
    ]

    // 5. Reservations by Status
    const reservationsByStatus = [
      { status: 'Pending', label: 'Pending', count: pendingReservations, color: '#d97706' },
      { status: 'Confirmed', label: 'Confirmed', count: confirmedReservations, color: '#059669' },
      { status: 'Completed', label: 'Completed', count: completedReservations, color: '#3b82f6' },
      { status: 'Cancelled', label: 'Declined / Cancelled', count: cancelledReservations, color: '#ef4444' },
    ]

    // 6. Popular Menu Items
    const popularItems = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          imageUrl: { $first: '$items.imageUrl' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          quantity: '$totalQuantity',
          revenue: '$totalRevenue',
          imageUrl: '$imageUrl',
        },
      },
    ])

    // 7. Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customerName customerPhone total status paymentStatus createdAt items')
      .lean()

    // 8. Upcoming Reservations
    const todayStr = today.toISOString().slice(0, 10)
    const upcomingReservations = await Reservation.find({
      status: { $in: ['Pending', 'Confirmed'] },
      bookingDate: { $gte: todayStr },
    })
      .sort({ bookingDate: 1, bookingTime: 1 })
      .limit(6)
      .select('reservationNumber customerName phone bookingDate bookingTime guests status specialRequests')
      .lean()

    // 9. Latest Notifications
    const latestNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()

    const unreadNotificationsCount = await Notification.countDocuments({ isRead: false })

    return res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          newOrders: newOrdersToday || pendingOrders,
          pendingOrders,
          confirmedOrders,
          completedOrders,
          totalReservations,
          pendingReservations,
          confirmedReservations,
          completedReservations,
          totalCustomers,
          totalRevenue,
        },
        dailySales,
        monthlyRevenue,
        ordersByStatus,
        reservationsByStatus,
        popularItems,
        recentOrders,
        upcomingReservations,
        latestNotifications,
        unreadNotificationsCount,
      },
    })
  } catch (error) {
    next(error)
  }
}
