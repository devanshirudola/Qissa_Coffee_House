import mongoose from 'mongoose'

const reservationSlotSchema = new mongoose.Schema({
  bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  bookingTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
  capacity: { type: Number, required: true, min: 1, max: 100 },
  reservedGuests: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true })

reservationSlotSchema.index({ bookingDate: 1, bookingTime: 1 }, { unique: true })

export default mongoose.model('ReservationSlot', reservationSlotSchema)
