import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCalendar, FiClock, FiUsers } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { reservationService } from '../services/reservationService.js'

const photo = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

function todayInZone(timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function displayDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function displayTime(value) {
  const [hour, minute] = value.split(':').map(Number)
  const suffix = hour >= 12 ? 'pm' : 'am'
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`
}

export default function ReservationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState('')
  const [reservations, setReservations] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [guests, setGuests] = useState('2')
  const [availability, setAvailability] = useState([])
  const [availabilityError, setAvailabilityError] = useState('')
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState('')

  useEffect(() => {
    let active = true
    reservationService.config()
      .then(value => { if (active) setConfig(value) })
      .catch(() => { if (active) setConfigError('We can’t load reservation times right now. Please try again shortly.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (authLoading || !user) {
      setReservations([])
      setHistoryLoading(false)
      return () => { active = false }
    }
    setHistoryLoading(true)
    reservationService.mine()
      .then(value => { if (active) setReservations(value) })
      .catch(() => { if (active) toast.error('Your reservations could not be loaded.') })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [authLoading, user])

  useEffect(() => {
    let active = true
    if (!bookingDate) {
      setAvailability([])
      setAvailabilityError('')
      setBookingTime('')
      return () => { active = false }
    }
    setAvailabilityLoading(true)
    setAvailabilityError('')
    setBookingTime('')
    reservationService.availability(bookingDate)
      .then(value => { if (active) setAvailability(value) })
      .catch(error => {
        if (!active) return
        const message = error.response?.data?.message || 'Times for this date could not be loaded.'
        setAvailabilityError(message)
        toast.error(message)
      })
      .finally(() => { if (active) setAvailabilityLoading(false) })
    return () => { active = false }
  }, [bookingDate])

  async function submitReservation(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSubmitting(true)
    try {
      const reservation = await reservationService.create({
        phone: String(form.get('phone') || ''),
        bookingDate,
        bookingTime,
        guests: Number(guests),
        specialRequests: String(form.get('specialRequests') || ''),
      })
      setReservations(current => [reservation, ...current])
      setBookingTime('')
      setGuests('2')
      formElement.reset()
      toast.success(`Request ${reservation.reservationNumber} sent. We’ll confirm it soon.`)
      try { setAvailability(await reservationService.availability(bookingDate)) } catch { /* The next date selection will refresh availability. */ }
    } catch (error) {
      toast.error(error.response?.data?.message || 'We couldn’t send your reservation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelReservation(reservation) {
    setCancellingId(reservation._id)
    try {
      const updated = await reservationService.cancel(reservation._id)
      setReservations(current => current.map(item => item._id === updated._id ? updated : item))
      toast.success('Your reservation request has been cancelled.')
      if (bookingDate === updated.bookingDate) {
        try { setAvailability(await reservationService.availability(bookingDate)) } catch { /* Availability will refresh when another date is selected. */ }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'We couldn’t cancel that reservation.')
    } finally {
      setCancellingId('')
    }
  }

  const maxGuests = config?.slotCapacity || 12

  return <main className="page-main reservation-page">
    <div className="reservation-photo"><img src={photo('photo-1554118811-1e0d58224f24', 1200)} alt="A table set in a cosy cafe"/><div className="reservation-image-caption">A TABLE, A CUP, A LITTLE TIME.</div></div>
    <div className="reservation-content">
      <div className="section-kicker">SAVE A SEAT FOR YOURSELF</div>
      <h1>Let’s make<br/>a <em>little room.</em></h1>
      <p>Planning a catch-up or a slow afternoon? Request a table and keep your visit close at hand.</p>
      {authLoading ? <div className="reservation-login"><p>Checking your account…</p></div> : !user ? <div className="reservation-login">
        <p>Sign in or create an account to request a table and manage your reservations.</p>
        <Link className="button button-dark" to="/account">Sign in or create an account <FiArrowRight/></Link>
      </div> : <>
        <div className="reservation-greeting">Booking as <b>{user.name}</b> · {user.email}</div>
        {configError ? <p className="reservation-error">{configError}</p> : <form className="reservation-form" onSubmit={submitReservation}>
          <label>Phone number<input required name="phone" type="tel" minLength="5" maxLength="30" autoComplete="tel" defaultValue={user.phone || ''} placeholder="A number the café can reach you on"/></label>
          <div className="form-row">
            <label><span><FiCalendar/> Date</span><input required name="bookingDate" type="date" min={todayInZone(config?.timeZone)} value={bookingDate} onChange={event => setBookingDate(event.target.value)}/></label>
            <label><span><FiClock/> Time</span><select required name="bookingTime" value={bookingTime} onChange={event => setBookingTime(event.target.value)} disabled={!bookingDate || availabilityLoading || !availability.length}>
              <option value="">{!bookingDate ? 'Choose a date first' : availabilityLoading ? 'Checking times…' : availabilityError ? 'Times unavailable' : availability.length ? 'Choose a time' : 'No times available'}</option>
              {availability.map(slot => <option key={slot.bookingTime} value={slot.bookingTime} disabled={slot.remainingSeats < Number(guests)}>{displayTime(slot.bookingTime)}{slot.remainingSeats < Number(guests) ? ' · full' : ` · ${slot.remainingSeats} seats left`}</option>)}
            </select></label>
          </div>
          <label><span><FiUsers/> Number of guests</span><select name="guests" value={guests} onChange={event => setGuests(event.target.value)}>{Array.from({ length: maxGuests }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'guest' : 'guests'}</option>)}</select></label>
          <label>Anything we should know? <span className="optional-label">OPTIONAL</span><textarea name="specialRequests" rows="3" maxLength="500" placeholder="A birthday, accessibility needs, a little extra time…"/></label>
          <button className="button button-dark" type="submit" disabled={submitting || !config || !bookingTime}>{submitting ? 'Sending request…' : 'Request a table'} <FiArrowRight/></button>
          <span className="form-note">Requests are saved as pending until the café confirms availability. Times are shown in {config?.timeZone || 'the café’s local time'}.</span>
        </form>}
        <section className="reservation-history" aria-labelledby="reservation-history-title">
          <div className="reservation-history-heading"><div><span className="section-kicker">YOUR VISITS</span><h2 id="reservation-history-title">Your reservations</h2></div><span>{reservations.length}</span></div>
          {historyLoading ? <p className="form-note">Loading your reservations…</p> : reservations.length ? <div className="reservation-list">{reservations.map(reservation => <article className="reservation-card" key={reservation._id}>
            <div className="reservation-card-top"><b>{displayDate(reservation.bookingDate)}</b><span className={`reservation-status status-${reservation.status.toLowerCase()}`}>{reservation.status}</span></div>
            <p>{displayTime(reservation.bookingTime)} <span>·</span> {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}</p>
            <span className="reservation-number">{reservation.reservationNumber}</span>
            {reservation.specialRequests && <small>{reservation.specialRequests}</small>}
            {reservation.status === 'Pending' && <button className="reservation-cancel" type="button" disabled={cancellingId === reservation._id} onClick={() => cancelReservation(reservation)}>{cancellingId === reservation._id ? 'Cancelling…' : 'Cancel request'}</button>}
          </article>)}</div> : <p className="reservation-empty">No reservations yet. Choose a date above to plan your first visit.</p>}
        </section>
      </>}
    </div>
  </main>
}
