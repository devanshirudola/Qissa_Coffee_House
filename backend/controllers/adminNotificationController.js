import mongoose from 'mongoose'
import Notification from '../models/Notification.js'

export async function listNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20, type = 'all', unreadOnly = 'false' } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    const filter = {}
    if (type && type !== 'all') {
      filter.type = type
    }
    if (unreadOnly === 'true') {
      filter.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ isRead: false }),
    ])

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid notification ID.' })
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    ).lean()

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' })
    }

    const unreadCount = await Notification.countDocuments({ isRead: false })

    return res.json({ success: true, data: notification, unreadCount })
  } catch (error) {
    next(error)
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } })
    return res.json({ success: true, message: 'All notifications marked as read.', unreadCount: 0 })
  } catch (error) {
    next(error)
  }
}
