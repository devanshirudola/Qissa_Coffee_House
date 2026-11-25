import mongoose from 'mongoose'
import { randomBytes } from 'node:crypto'

const reservationSchema = new mongoose.Schema({
  reservationNumber: { type: String, required: true, unique: true, default: () => `QRS-${randomBytes(4).toString('hex').toUpperCase()}` },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'ReservationSlot', required: true },
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  customerEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  bookingTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
  guests: { type: Number, required: true, min: 1, max: 30 },
  specialRequests: { type: String, default: '', trim: true, maxlength: 500 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true })

reservationSchema.index({ user: 1, createdAt: -1 })
reservationSchema.index({ bookingDate: 1, bookingTime: 1, status: 1 })

export default mongoose.model('Reservation', reservationSchema)
