import Notification from '../models/Notification.js'
import { emitToAdmins } from './socket.js'

export async function notifyAdmin({
  type,
  title,
  message,
  referenceId = null,
  referenceModel = 'Order',
  data = {},
}) {
  try {
    const notification = await Notification.create({
      type,
      title,
      message,
      referenceId,
      referenceModel,
      data,
      isRead: false,
    })

    const payload = {
      id: notification._id,
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      referenceId: notification.referenceId,
      referenceModel: notification.referenceModel,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }

    // Broadcast generic notification event and specific event
    emitToAdmins('new_notification', payload)
    emitToAdmins(type, payload)

    return notification
  } catch (error) {
    console.error('[notifyAdmin] Failed to record or broadcast notification:', error.message)
    return null
  }
}
