import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['new_order', 'new_reservation', 'order_cancelled', 'reservation_cancelled', 'payment_completed'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, index: true },
  referenceModel: { type: String, enum: ['Order', 'Reservation', 'User'], default: 'Order' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true })

notificationSchema.index({ isRead: 1, createdAt: -1 })
notificationSchema.index({ createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
