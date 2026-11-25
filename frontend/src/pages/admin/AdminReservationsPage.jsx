import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminReservationService } from '../../services/adminApi.js'

const displayTime = (value) => {
  if (!value) return ''
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'pm' : 'am'}`
}

const displayDate = (value) => {
  if (!value) return ''
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const statusFilters = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending Requests' },
  { value: 'Confirmed', label: 'Confirmed Tables' },
  { value: 'Completed', label: 'Completed Visits' },
  { value: 'Rejected', label: 'Declined' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('bookingDate')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedRes, setSelectedRes] = useState(null)
  const [updatingId, setUpdatingId] = useState('')
  const [actionConfirmDialog, setActionConfirmDialog] = useState(null) // { reservation, nextStatus }

  const loadReservations = useCallback(async (pageOverride) => {
    setLoading(true)
    try {
      const currentPage = pageOverride ?? pagination.page
      const res = await adminReservationService.list({
        page: currentPage,
        limit: 12,
        search,
        status: statusFilter,
        date: dateFilter || undefined,
        sortBy,
        sortOrder,
      })
      setReservations(res.reservations || [])
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, pages: 1 })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, search, statusFilter, dateFilter, sortBy, sortOrder])

  useEffect(() => {
    loadReservations(1)
  }, [statusFilter, dateFilter, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadReservations(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  async function handleStatusUpdate(reservationId, newStatus) {
    setUpdatingId(reservationId)
    try {
      const updated = await adminReservationService.updateStatus(reservationId, newStatus)
      setReservations((prev) => prev.map((r) => (r._id === reservationId ? updated : r)))
      if (selectedRes?._id === reservationId) {
        setSelectedRes(updated)
      }
      toast.success(`Reservation #${updated.reservationNumber} marked as ${newStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reservation status.')
    } finally {
      setUpdatingId('')
      setActionConfirmDialog(null)
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'Confirmed':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }
      case 'Completed':
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }
      case 'Rejected':
      case 'Cancelled':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }
      case 'Pending':
      default:
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }
    }
  }

  // Quick date presets
  const setDatePreset = (preset) => {
    const now = new Date()
    if (preset === 'today') {
      setDateFilter(now.toISOString().slice(0, 10))
    } else if (preset === 'tomorrow') {
      now.setDate(now.getDate() + 1)
      setDateFilter(now.toISOString().slice(0, 10))
    } else {
      setDateFilter('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ============================================================== */}
      {/* HEADER */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9d7857', fontWeight: 600 }}>
            Table Bookings & Seating
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Reservations Management ({pagination.total})
          </h2>
        </div>

        <button
          onClick={() => loadReservations()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: '#ffffff',
            border: '1px solid #dcd2c4',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#49372c',
            cursor: 'pointer',
          }}
        >
          <FiRefreshCw />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TOOLBAR: SEARCH & FILTERS */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#88766a' }} />
            <input
              type="text"
              placeholder="Search by ID, guest name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 34px 9px 34px',
                border: '1px solid #ded2c4',
                background: '#faf8f3',
                fontSize: '11px',
                color: '#34231c',
                borderRadius: '2px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#88766a',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {statusFilters.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date Picker Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
            }}
            title="Filter by Booking Date"
          />

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setDatePreset('today')}
              style={{
                padding: '8px 11px',
                background: dateFilter === new Date().toISOString().slice(0, 10) ? '#34231c' : '#f8f5ef',
                color: dateFilter === new Date().toISOString().slice(0, 10) ? '#fffaf4' : '#49372c',
                border: '1px solid #ded2c4',
                borderRadius: '2px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('tomorrow')}
              style={{
                padding: '8px 11px',
                background: '#f8f5ef',
                color: '#49372c',
                border: '1px solid #ded2c4',
                borderRadius: '2px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Tomorrow
            </button>
          </div>

          {/* Sort By */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-')
              setSortBy(sb)
              setSortOrder(so)
            }}
            style={{
              padding: '9px 14px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="bookingDate-asc">Date (Earliest First)</option>
            <option value="bookingDate-desc">Date (Latest First)</option>
            <option value="createdAt-desc">Submitted (Newest)</option>
            <option value="guests-desc">Party Size (Largest)</option>
          </select>

          {/* Reset Filters */}
          {(statusFilter !== 'all' || dateFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setDateFilter('')
                setSearch('')
              }}
              style={{
                background: 'none',
                border: '1px solid #dcd2c4',
                color: '#8b786b',
                padding: '8px 12px',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RESERVATIONS TABLE */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(52,35,28,0.03)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#88766a', fontSize: '12px' }}>
            Loading table reservations…
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <FiCalendar style={{ fontSize: '36px', color: '#a47e5d', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 6px', color: '#34231c' }}>
              No Reservations Found
            </h3>
            <p style={{ fontSize: '11px', color: '#88766a', margin: 0 }}>
              Try adjusting your date or status criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                  <th style={{ padding: '12px 16px' }}>Reservation ID</th>
                  <th style={{ padding: '12px 16px' }}>Customer Name</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px' }}>Phone Number</th>
                  <th style={{ padding: '12px 16px' }}>Booking Date</th>
                  <th style={{ padding: '12px 16px' }}>Time Slot</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Guests</th>
                  <th style={{ padding: '12px 16px' }}>Special Requests</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr
                    key={res._id}
                    style={{
                      borderBottom: '1px solid #f0e9df',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#faf8f4')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {/* Reservation ID */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#34231c' }}>
                      <button
                        onClick={() => setSelectedRes(res)}
                        style={{
                          background: 'none',
                          border: 'none',
                          font: 'inherit',
                          fontWeight: 600,
                          color: '#34231c',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        {res.reservationNumber}
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: '#34231c' }}>
                      {res.customerName}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '14px 16px', color: '#68564b' }}>
                      <a href={`mailto:${res.customerEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {res.customerEmail}
                      </a>
                    </td>

                    {/* Phone Number */}
                    <td style={{ padding: '14px 16px', color: '#68564b' }}>
                      <a href={`tel:${res.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {res.phone}
                      </a>
                    </td>

                    {/* Booking Date */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#34231c' }}>
                      {displayDate(res.bookingDate)}
                    </td>

                    {/* Booking Time */}
                    <td style={{ padding: '14px 16px', color: '#886445', fontWeight: 600 }}>
                      {displayTime(res.bookingTime)}
                    </td>

                    {/* Number of Guests */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#34231c' }}>
                      {res.guests} {res.guests === 1 ? 'guest' : 'guests'}
                    </td>

                    {/* Special Requests */}
                    <td style={{ padding: '14px 16px', color: '#68564b', maxWidth: '180px' }}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontStyle: res.specialRequests ? 'italic' : 'normal',
                          color: res.specialRequests ? '#49372c' : '#a49485',
                        }}
                        title={res.specialRequests || 'None'}
                      >
                        {res.specialRequests || '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '2px',
                          fontSize: '9px',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          ...getStatusStyle(res.status),
                        }}
                      >
                        {res.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedRes(res)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 9px',
                            background: '#f8f5ef',
                            border: '1px solid #ded2c4',
                            color: '#49372c',
                            fontSize: '10px',
                            cursor: 'pointer',
                            borderRadius: '2px',
                          }}
                          title="View reservation details"
                        >
                          <FiEye /> View
                        </button>

                        {/* Quick Confirm / Reject for Pending */}
                        {res.status === 'Pending' && (
                          <>
                            <button
                              disabled={updatingId === res._id}
                              onClick={() => handleStatusUpdate(res._id, 'Confirmed')}
                              style={{
                                padding: '6px 9px',
                                background: '#15803d',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '2px',
                              }}
                              title="Confirm booking"
                            >
                              <FiCheck />
                            </button>
                            <button
                              disabled={updatingId === res._id}
                              onClick={() => setActionConfirmDialog({ reservation: res, nextStatus: 'Rejected' })}
                              style={{
                                padding: '6px 9px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                fontSize: '10px',
                                cursor: 'pointer',
                                borderRadius: '2px',
                              }}
                              title="Decline booking"
                            >
                              <FiX />
                            </button>
                          </>
                        )}

                        {/* Mark Completed for Confirmed */}
                        {res.status === 'Confirmed' && (
                          <button
                            disabled={updatingId === res._id}
                            onClick={() => handleStatusUpdate(res._id, 'Completed')}
                            style={{
                              padding: '6px 9px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              fontSize: '10px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              borderRadius: '2px',
                            }}
                            title="Mark customer visit completed"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGINATION */}
        {/* ============================================================== */}
        {!loading && reservations.length > 0 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #e9e0d5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8f5ef',
              fontSize: '11px',
              color: '#68564b',
            }}
          >
            <div>
              Showing page <b>{pagination.page}</b> of <b>{pagination.pages}</b> ({pagination.total} total bookings)
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                  loadReservations(pagination.page - 1)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #ded2c4',
                  borderRadius: '2px',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page <= 1 ? 0.5 : 1,
                  fontSize: '10px',
                }}
              >
                <FiChevronLeft /> Previous
              </button>

              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => {
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                  loadReservations(pagination.page + 1)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #ded2c4',
                  borderRadius: '2px',
                  cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page >= pagination.pages ? 0.5 : 1,
                  fontSize: '10px',
                }}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* RESERVATION DETAILS MODAL */}
      {/* ============================================================== */}
      {selectedRes && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(36,24,18,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 70,
            padding: '20px',
          }}
          onClick={() => setSelectedRes(null)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9e0d5',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: '#34231c',
                color: '#fffaf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a47e5d', fontWeight: 600 }}>
                  Reservation Request
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '2px 0 0' }}>
                  {selectedRes.reservationNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fffaf4',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Timing Card */}
              <div
                style={{
                  background: '#f8f5ef',
                  border: '1px solid #e9e0d5',
                  padding: '16px',
                  borderRadius: '3px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Booking Date
                  </span>
                  <div style={{ fontWeight: 600, color: '#34231c', fontSize: '13px', marginTop: '2px' }}>
                    {displayDate(selectedRes.bookingDate)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Time Slot
                  </span>
                  <div style={{ fontWeight: 600, color: '#886445', fontSize: '13px', marginTop: '2px' }}>
                    {displayTime(selectedRes.bookingTime)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Guest Count
                  </span>
                  <div style={{ fontWeight: 700, color: '#34231c', fontSize: '13px', marginTop: '2px' }}>
                    {selectedRes.guests} {selectedRes.guests === 1 ? 'Guest' : 'Guests'}
                  </div>
                </div>
              </div>

              {/* Guest Profile */}
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', margin: '0 0 10px', color: '#34231c' }}>
                  Customer Details
                </h4>
                <div style={{ border: '1px solid #e9e0d5', borderRadius: '3px', padding: '14px 16px', background: '#faf8f4' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#34231c', marginBottom: '4px' }}>
                    {selectedRes.customerName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#68564b' }}>
                    <div>
                      <FiMail style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      <a href={`mailto:${selectedRes.customerEmail}`} style={{ color: 'inherit' }}>
                        {selectedRes.customerEmail}
                      </a>
                    </div>
                    <div>
                      <FiPhone style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      <a href={`tel:${selectedRes.phone}`} style={{ color: 'inherit' }}>
                        {selectedRes.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', margin: '0 0 8px', color: '#34231c' }}>
                  Special Requests / Table Notes
                </h4>
                <div
                  style={{
                    border: '1px solid #e9e0d5',
                    borderRadius: '3px',
                    padding: '12px 14px',
                    background: selectedRes.specialRequests ? '#fffbeb' : '#faf8f4',
                    fontSize: '11px',
                    color: selectedRes.specialRequests ? '#78350f' : '#88766a',
                    fontStyle: selectedRes.specialRequests ? 'italic' : 'normal',
                  }}
                >
                  {selectedRes.specialRequests ? `“${selectedRes.specialRequests}”` : 'No special requests provided.'}
                </div>
              </div>

              {/* Status Actions */}
              <div style={{ borderTop: '1px solid #e9e0d5', paddingTop: '16px' }}>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', margin: '0 0 12px', color: '#34231c' }}>
                  Manage Reservation Status
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    disabled={updatingId === selectedRes._id || selectedRes.status === 'Confirmed'}
                    onClick={() => handleStatusUpdate(selectedRes._id, 'Confirmed')}
                    style={{
                      padding: '8px 14px',
                      background: selectedRes.status === 'Confirmed' ? '#e5e7eb' : '#15803d',
                      color: selectedRes.status === 'Confirmed' ? '#9ca3af' : '#ffffff',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: selectedRes.status === 'Confirmed' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <FiCheck style={{ marginRight: '4px' }} /> Confirm Table
                  </button>

                  <button
                    disabled={updatingId === selectedRes._id || selectedRes.status === 'Completed'}
                    onClick={() => handleStatusUpdate(selectedRes._id, 'Completed')}
                    style={{
                      padding: '8px 14px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: selectedRes.status === 'Completed' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Mark as Completed
                  </button>

                  <button
                    disabled={updatingId === selectedRes._id || selectedRes.status === 'Rejected'}
                    onClick={() => setActionConfirmDialog({ reservation: selectedRes, nextStatus: 'Rejected' })}
                    style={{
                      padding: '8px 14px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: selectedRes.status === 'Rejected' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Decline Request
                  </button>

                  <button
                    disabled={updatingId === selectedRes._id || selectedRes.status === 'Cancelled'}
                    onClick={() => setActionConfirmDialog({ reservation: selectedRes, nextStatus: 'Cancelled' })}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: '2px',
                      fontSize: '11px',
                      cursor: selectedRes.status === 'Cancelled' ? 'not-allowed' : 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION DIALOG FOR REJECT / CANCEL */}
      {/* ============================================================== */}
      {actionConfirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(36,24,18,0.7)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 80,
            padding: '20px',
          }}
          onClick={() => setActionConfirmDialog(null)}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '4px',
              maxWidth: '420px',
              width: '100%',
              border: '1px solid #e9e0d5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <FiAlertCircle style={{ fontSize: '22px' }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: 0 }}>
                {actionConfirmDialog.nextStatus === 'Rejected' ? 'Decline Reservation?' : 'Cancel Reservation?'}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#68564b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to mark reservation <b>#{actionConfirmDialog.reservation.reservationNumber}</b> for {actionConfirmDialog.reservation.customerName} as {actionConfirmDialog.nextStatus}?
              This will automatically release held seats back to the café’s table capacity.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActionConfirmDialog(null)}
                style={{
                  background: '#f8f5ef',
                  border: '1px solid #ded2c4',
                  padding: '8px 14px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#49372c',
                }}
              >
                Go Back
              </button>
              <button
                disabled={updatingId === actionConfirmDialog.reservation._id}
                onClick={() => handleStatusUpdate(actionConfirmDialog.reservation._id, actionConfirmDialog.nextStatus)}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {updatingId === actionConfirmDialog.reservation._id ? 'Updating…' : `Yes, ${actionConfirmDialog.nextStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
