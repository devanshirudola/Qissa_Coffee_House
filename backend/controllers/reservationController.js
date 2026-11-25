import mongoose from 'mongoose'
import Reservation from '../models/Reservation.js'
import ReservationSlot from '../models/ReservationSlot.js'
import { notifyAdmin } from '../utils/notifyAdmin.js'

const configuredCapacity = () => Math.max(1, Math.min(30, Number.parseInt(process.env.RESERVATION_SLOT_CAPACITY, 10) || 12))
const configuredInterval = () => [15, 30, 60].includes(Number.parseInt(process.env.RESERVATION_SLOT_INTERVAL_MINUTES, 10))
  ? Number.parseInt(process.env.RESERVATION_SLOT_INTERVAL_MINUTES, 10)
  : 30
const validClockTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
const configuredOpenTime = () => validClockTime(process.env.RESERVATION_OPEN_TIME) ? process.env.RESERVATION_OPEN_TIME : '09:00'
const configuredCloseTime = () => validClockTime(process.env.RESERVATION_CLOSE_TIME) ? process.env.RESERVATION_CLOSE_TIME : '21:00'

function timeMinutes(value) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function localBusinessDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value >= localBusinessDate()
}

function validTime(value) {
  if (!validClockTime(value)) return false
  const minutes = timeMinutes(value)
  const opening = timeMinutes(configuredOpenTime())
  const closing = timeMinutes(configuredCloseTime())
  return closing > opening && minutes >= opening && minutes < closing && (minutes - opening) % configuredInterval() === 0
}

function isFutureBooking(bookingDate, bookingTime) {
  const zone = process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const today = `${values.year}-${values.month}-${values.day}`
  if (bookingDate !== today) return bookingDate > today
  return timeMinutes(bookingTime) > Number(values.hour) * 60 + Number(values.minute)
}

export function getReservationConfig(_req, res) {
  res.json({ success: true, data: {
    slotCapacity: configuredCapacity(),
    slotIntervalMinutes: configuredInterval(),
    openingTime: configuredOpenTime(),
    closingTime: configuredCloseTime(),
    timeZone: process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata',
  } })
}

export async function getReservationAvailability(req, res, next) {
  try {
    const { date } = req.query
    if (!validDate(date)) return res.status(400).json({ success: false, message: 'Choose a valid future date.' })
    const slots = await ReservationSlot.find({ bookingDate: date }).select('bookingTime reservedGuests').lean()
    const occupied = new Map(slots.map(slot => [slot.bookingTime, slot.reservedGuests]))
    const opening = timeMinutes(configuredOpenTime())
    const closing = timeMinutes(configuredCloseTime())
    const interval = configuredInterval()
    const data = []
    if (closing > opening) {
      for (let minutes = opening; minutes < closing; minutes += interval) {
        const bookingTime = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
        if (!isFutureBooking(date, bookingTime)) continue
        const remainingSeats = Math.max(0, configuredCapacity() - (occupied.get(bookingTime) || 0))
        data.push({ bookingTime, remainingSeats, available: remainingSeats > 0 })
      }
    }
    res.json({ success: true, data })
  } catch (error) { next(error) }
}

export async function createReservation(req, res, next) {
  try {
    const { phone, bookingDate, bookingTime, guests, specialRequests = '' } = req.body ?? {}
    const guestCount = Number(guests)
    if (!validDate(bookingDate) || !validClockTime(bookingTime) || !isFutureBooking(bookingDate, bookingTime)) {
      return res.status(400).json({ success: false, message: 'Choose a future date and time.' })
    }
    if (!validTime(bookingTime)) return res.status(400).json({ success: false, message: `Choose a time between ${configuredOpenTime()} and ${configuredCloseTime()} in ${configuredInterval()} minute increments.` })
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > configuredCapacity()) {
      return res.status(400).json({ success: false, message: `Guest count must be between 1 and ${configuredCapacity()}.` })
    }
    if (typeof phone !== 'string' || phone.trim().length < 5 || phone.trim().length > 30) {
      return res.status(400).json({ success: false, message: 'Enter a valid phone number.' })
    }
    if (typeof specialRequests !== 'string' || specialRequests.length > 500) {
      return res.status(400).json({ success: false, message: 'Special requests can be up to 500 characters.' })
    }

    let slot = await ReservationSlot.findOne({ bookingDate, bookingTime })
    if (!slot) {
      try {
        slot = await ReservationSlot.create({ bookingDate, bookingTime, capacity: configuredCapacity(), reservedGuests: 0 })
      } catch (error) {
        if (error.code !== 11000) throw error
        slot = await ReservationSlot.findOne({ bookingDate, bookingTime })
      }
    }
    const reservedSlot = await ReservationSlot.findOneAndUpdate(
      { _id: slot._id, reservedGuests: { $lte: configuredCapacity() - guestCount } },
      { $inc: { reservedGuests: guestCount }, $set: { capacity: configuredCapacity() } },
      { new: true },
    )
    if (!reservedSlot) return res.status(409).json({ success: false, message: 'That time is full. Please choose another slot.' })

    try {
      const reservation = await Reservation.create({
        user: req.user._id,
        slot: reservedSlot._id,
        customerName: req.user.name,
        customerEmail: req.user.email,
        phone: phone.trim(),
        bookingDate,
        bookingTime,
        guests: guestCount,
        specialRequests: specialRequests.trim(),
      })

      // Notify cafe administrators in real-time
      await notifyAdmin({
        type: 'new_reservation',
        title: 'New Table Reservation Request',
        message: `Booking #${reservation.reservationNumber} by ${reservation.customerName} for ${reservation.guests} guest${reservation.guests === 1 ? '' : 's'} on ${reservation.bookingDate} at ${reservation.bookingTime}`,
        referenceId: reservation._id,
        referenceModel: 'Reservation',
        data: {
          reservationNumber: reservation.reservationNumber,
          customerName: reservation.customerName,
          bookingDate: reservation.bookingDate,
          bookingTime: reservation.bookingTime,
          guests: reservation.guests,
        },
      })

      return res.status(201).json({ success: true, data: reservation })
    } catch (error) {
      await ReservationSlot.updateOne({ _id: reservedSlot._id }, { $inc: { reservedGuests: -guestCount } })
      throw error
    }
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Please check the reservation details and try again.' })
    next(error)
  }
}

export async function listMyReservations(req, res, next) {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).sort({ bookingDate: 1, bookingTime: 1, createdAt: -1 }).limit(100).lean()
    res.json({ success: true, data: reservations })
  } catch (error) { next(error) }
}

export async function listAllReservations(req, res, next) {
  try {
    const filter = ['Pending', 'Confirmed', 'Rejected', 'Cancelled'].includes(req.query.status)
      ? { status: req.query.status }
      : {}
    const reservations = await Reservation.find(filter).sort({ bookingDate: 1, bookingTime: 1, createdAt: 1 }).limit(500).lean()
    res.json({ success: true, data: reservations })
  } catch (error) { next(error) }
}

export async function updateReservationStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Reservation not found.' })
    const { status } = req.body ?? {}
    if (!['Confirmed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Choose Confirmed or Rejected.' })
    }
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, status: 'Pending' },
      { $set: { status } },
      { new: true },
    )
    if (!reservation) return res.status(409).json({ success: false, message: 'This reservation has already been updated.' })
    if (status === 'Rejected') {
      await ReservationSlot.updateOne({ _id: reservation.slot }, { $inc: { reservedGuests: -reservation.guests } })
    }
    res.json({ success: true, data: reservation })
  } catch (error) { next(error) }
}

export async function cancelReservation(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Reservation not found.' })
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'Pending' },
      { $set: { status: 'Cancelled' } },
      { new: true },
    )
    if (!reservation) return res.status(409).json({ success: false, message: 'This reservation can no longer be cancelled online.' })
    await ReservationSlot.updateOne({ _id: reservation.slot }, { $inc: { reservedGuests: -reservation.guests } })

    // Notify administrators
    await notifyAdmin({
      type: 'reservation_cancelled',
      title: `Reservation #${reservation.reservationNumber} Cancelled`,
      message: `Reservation #${reservation.reservationNumber} for ${reservation.customerName} was cancelled by the customer.`,
      referenceId: reservation._id,
      referenceModel: 'Reservation',
      data: { reservationNumber: reservation.reservationNumber },
    })

    res.json({ success: true, data: reservation })
  } catch (error) { next(error) }
}
