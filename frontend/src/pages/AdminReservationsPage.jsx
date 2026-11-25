import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { reservationService } from '../services/reservationService.js'

const displayTime = value => {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'pm' : 'am'}`
}
const displayDate = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
  timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
})

export default function AdminReservationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('Pending')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')

  const loadReservations = useCallback(async () => {
    setLoading(true)
    try { setReservations(await reservationService.manage(status)) }
    catch (error) { toast.error(error.response?.data?.message || 'Reservations could not be loaded.') }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') loadReservations()
  }, [authLoading, user, loadReservations])

  async function updateStatus(reservation, nextStatus) {
    setUpdatingId(reservation._id)
    try {
      const updated = await reservationService.updateStatus(reservation._id, nextStatus)
      setReservations(current => status === 'Pending' ? current.filter(item => item._id !== updated._id) : current.map(item => item._id === updated._id ? updated : item))
      toast.success(`Reservation ${updated.reservationNumber} ${nextStatus.toLowerCase()}.`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'The reservation could not be updated.')
      await loadReservations()
    } finally { setUpdatingId('') }
  }

  if (authLoading) return <main className="page-main admin-reservations-page"><p>Checking access…</p></main>
  if (user?.role !== 'admin') return <main className="page-main admin-reservations-page"><div className="admin-access-card"><div className="section-kicker">STAFF ACCESS</div><h1>This page is for<br/><em>the Qissa team.</em></h1><p>Sign in with an administrator account to manage reservation requests.</p><Link className="button button-dark" to="/account">Go to your account</Link></div></main>

  return <main className="page-main admin-reservations-page">
    <Link className="underlined-link" to="/account"><FiArrowLeft/> Back to your account</Link>
    <div className="admin-reservations-heading"><div><div className="section-kicker">THE QISSA TEAM</div><h1>Reservation <em>requests.</em></h1><p>Review availability, then confirm or decline pending requests.</p></div><select aria-label="Filter reservations" value={status} onChange={event => setStatus(event.target.value)}><option>Pending</option><option>Confirmed</option><option>Rejected</option><option>Cancelled</option></select></div>
    {loading ? <p className="form-note">Loading requests…</p> : reservations.length ? <div className="admin-reservation-list">{reservations.map(reservation => <article className="admin-reservation-card" key={reservation._id}>
      <div className="admin-reservation-main"><div><span className="section-kicker">{reservation.reservationNumber}</span><h2>{reservation.customerName}</h2><a href={`mailto:${reservation.customerEmail}`}>{reservation.customerEmail}</a><a href={`tel:${reservation.phone}`}>{reservation.phone}</a></div><div className="admin-reservation-time"><b>{displayDate(reservation.bookingDate)}</b><span>{displayTime(reservation.bookingTime)}</span><span>{reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}</span><span className={`reservation-status status-${reservation.status.toLowerCase()}`}>{reservation.status}</span></div></div>
      {reservation.specialRequests && <p className="admin-reservation-note">“{reservation.specialRequests}”</p>}
      {reservation.status === 'Pending' && <div className="admin-reservation-actions"><button className="button button-dark" disabled={updatingId === reservation._id} onClick={() => updateStatus(reservation, 'Confirmed')}><FiCheck/> Confirm request</button><button className="button button-outline" disabled={updatingId === reservation._id} onClick={() => updateStatus(reservation, 'Rejected')}><FiX/> Decline request</button></div>}
    </article>)}</div> : <div className="empty-state"><span>✳</span><h2>No {status.toLowerCase()} reservations.</h2><p>Requests in this group will appear here.</p></div>}
  </main>
}
