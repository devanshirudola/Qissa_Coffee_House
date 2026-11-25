import mongoose from 'mongoose'
import Reservation from '../models/Reservation.js'
import ReservationSlot from '../models/ReservationSlot.js'
import { notifyAdmin } from '../utils/notifyAdmin.js'
import { emitToAdmins } from '../utils/socket.js'

export async function listAdminReservations(req, res, next) {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      status = 'all',
      date,
      startDate,
      endDate,
      sortBy = 'bookingDate',
      sortOrder = 'asc',
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12))
    const skip = (pageNum - 1) * limitNum

    const filter = {}

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Exact date filter
    if (date && date.trim()) {
      filter.bookingDate = date.trim()
    } else if (startDate || endDate) {
      filter.bookingDate = {}
      if (startDate) filter.bookingDate.$gte = startDate
      if (endDate) filter.bookingDate.$lte = endDate
    }

    // Search term
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(term, 'i')
      filter.$or = [
        { reservationNumber: regex },
        { customerName: regex },
        { customerEmail: regex },
        { phone: regex },
        { specialRequests: regex },
      ]
    }

    // Sorting
    let sort = {}
    if (sortBy === 'bookingDate') {
      const dir = sortOrder === 'desc' ? -1 : 1
      sort = { bookingDate: dir, bookingTime: dir, createdAt: -1 }
    } else if (sortBy === 'createdAt') {
      sort = { createdAt: sortOrder === 'asc' ? 1 : -1 }
    } else if (sortBy === 'guests') {
      sort = { guests: sortOrder === 'desc' ? -1 : 1 }
    } else {
      sort = { bookingDate: 1, bookingTime: 1 }
    }

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email phone createdAt')
        .populate('slot', 'capacity reservedGuests')
        .lean(),
      Reservation.countDocuments(filter),
    ])

    return res.json({
      success: true,
      data: {
        reservations,
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

export async function getAdminReservation(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid reservation ID.' })
    }

    const reservation = await Reservation.findById(id)
      .populate('user', 'name email phone createdAt')
      .populate('slot', 'capacity reservedGuests')
      .lean()

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' })
    }

    return res.json({ success: true, data: reservation })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminReservationStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body ?? {}

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid reservation ID.' })
    }

    const allowed = ['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      })
    }

    const existing = await Reservation.findById(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' })
    }

    const oldStatus = existing.status
    if (oldStatus === status) {
      return res.json({ success: true, data: existing })
    }

    // Capacity management synchronization
    const wasOccupyingSeat = ['Pending', 'Confirmed'].includes(oldStatus)
    const willOccupySeat = ['Pending', 'Confirmed'].includes(status)

    if (wasOccupyingSeat && !willOccupySeat) {
      // Releasing seats back to table capacity
      if (existing.slot) {
        await ReservationSlot.updateOne(
          { _id: existing.slot },
          { $inc: { reservedGuests: -existing.guests } }
        )
      }
    } else if (!wasOccupyingSeat && willOccupySeat) {
      // Re-allocating seats if restoring from rejected/cancelled
      if (existing.slot) {
        await ReservationSlot.updateOne(
          { _id: existing.slot },
          { $inc: { reservedGuests: existing.guests } }
        )
      }
    }

    existing.status = status
    await existing.save()

    const populated = await Reservation.findById(existing._id)
      .populate('user', 'name email phone')
      .populate('slot', 'capacity reservedGuests')
      .lean()

    // Real-time broadcast
    emitToAdmins('reservation_updated', populated)

    if (status === 'Cancelled' || status === 'Rejected') {
      await notifyAdmin({
        type: 'reservation_cancelled',
        title: `Reservation #${existing.reservationNumber} ${status}`,
        message: `Reservation #${existing.reservationNumber} for ${existing.customerName} has been marked as ${status}.`,
        referenceId: existing._id,
        referenceModel: 'Reservation',
        data: { reservationNumber: existing.reservationNumber, status },
      })
    }

    return res.json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
}
