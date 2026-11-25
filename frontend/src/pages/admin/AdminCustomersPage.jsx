import { useCallback, useEffect, useState } from 'react'
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiEye,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminCustomerService } from '../../services/adminApi.js'

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomerData, setSelectedCustomerData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const loadCustomers = useCallback(async (pageOverride) => {
    setLoading(true)
    try {
      const page = pageOverride ?? pagination.page
      const res = await adminCustomerService.list({ page, limit: 12, search })
      setCustomers(res.customers || [])
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, pages: 1 })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customer list.')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function openCustomerProfile(customerId) {
    setLoadingProfile(true)
    try {
      const res = await adminCustomerService.get(customerId)
      setSelectedCustomerData(res)
    } catch {
      toast.error('Unable to load customer profile details.')
    } finally {
      setLoadingProfile(false)
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
            Registered Patrons & Accounts
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Customer Directory ({pagination.total})
          </h2>
        </div>

        <button
          onClick={() => loadCustomers()}
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
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SEARCH BAR */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          padding: '14px 18px',
          position: 'relative',
        }}
      >
        <FiSearch style={{ position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)', color: '#88766a' }} />
        <input
          type="text"
          placeholder="Search customers by full name, email address, or phone number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 36px 10px 36px',
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
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#88766a',
              cursor: 'pointer',
            }}
          >
            <FiX />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* CUSTOMERS TABLE */}
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
            Loading customer accounts…
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <FiUser style={{ fontSize: '36px', color: '#a47e5d', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 6px', color: '#34231c' }}>
              No Customers Found
            </h3>
            <p style={{ fontSize: '11px', color: '#88766a', margin: 0 }}>
              Try searching with a different name or email.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                  <th style={{ padding: '12px 18px' }}>Customer Name</th>
                  <th style={{ padding: '12px 18px' }}>Email Address</th>
                  <th style={{ padding: '12px 18px' }}>Phone</th>
                  <th style={{ padding: '12px 18px' }}>Registered Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Total Orders</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Bookings</th>
                  <th style={{ padding: '12px 18px' }}>Total Spend</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    style={{
                      borderBottom: '1px solid #f0e9df',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#faf8f4')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#34231c' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#34231c',
                            color: '#fffaf4',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {c.name?.charAt(0) || 'C'}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#68564b' }}>
                      <a href={`mailto:${c.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {c.email}
                      </a>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#68564b' }}>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {c.phone}
                        </a>
                      ) : (
                        <span style={{ color: '#a49485' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#88766a' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: '#34231c' }}>
                      {c.totalOrders}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: '#34231c' }}>
                      {c.totalReservations}
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#059669' }}>
                      {formatPrice(c.totalSpent)}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => openCustomerProfile(c._id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#f8f5ef',
                          border: '1px solid #ded2c4',
                          color: '#49372c',
                          fontSize: '10px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}
                      >
                        <FiEye /> View Profile
                      </button>
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
        {!loading && customers.length > 0 && (
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
              Showing page <b>{pagination.page}</b> of <b>{pagination.pages}</b> ({pagination.total} registered patrons)
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                  loadCustomers(pagination.page - 1)
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
                  loadCustomers(pagination.page + 1)
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
      {/* CUSTOMER PROFILE MODAL */}
      {/* ============================================================== */}
      {selectedCustomerData && (
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
          onClick={() => setSelectedCustomerData(null)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9e0d5',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '720px',
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
                  Customer Profile
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '2px 0 0' }}>
                  {selectedCustomerData.customer.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerData(null)}
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

            {/* Profile Overview */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div
                style={{
                  background: '#f8f5ef',
                  border: '1px solid #e9e0d5',
                  padding: '16px 20px',
                  borderRadius: '3px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '14px',
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase' }}>Email</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '2px' }}>
                    {selectedCustomerData.customer.email}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '2px' }}>
                    {selectedCustomerData.customer.phone || 'Not recorded'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase' }}>Lifetime Spend</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                    {formatPrice(selectedCustomerData.customer.totalSpent)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', color: '#88766a', textTransform: 'uppercase' }}>Member Since</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '2px' }}>
                    {new Date(selectedCustomerData.customer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', margin: '0 0 10px', color: '#34231c' }}>
                  Order History ({selectedCustomerData.orders.length})
                </h4>
                {selectedCustomerData.orders.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#88766a', fontStyle: 'italic', margin: 0 }}>
                    No orders placed by this customer yet.
                  </p>
                ) : (
                  <div style={{ border: '1px solid #e9e0d5', borderRadius: '3px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                          <th style={{ padding: '8px 12px' }}>Order ID</th>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Items</th>
                          <th style={{ padding: '8px 12px' }}>Amount</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomerData.orders.map((o) => (
                          <tr key={o._id} style={{ borderBottom: '1px solid #f0e9df' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 600, color: '#34231c' }}>{o.orderNumber}</td>
                            <td style={{ padding: '9px 12px', color: '#68564b' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '9px 12px', color: '#68564b' }}>
                              {o.items?.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                            </td>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: '#34231c' }}>{formatPrice(o.total)}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reservation History */}
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', margin: '0 0 10px', color: '#34231c' }}>
                  Reservation History ({selectedCustomerData.reservations.length})
                </h4>
                {selectedCustomerData.reservations.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#88766a', fontStyle: 'italic', margin: 0 }}>
                    No table reservations booked yet.
                  </p>
                ) : (
                  <div style={{ border: '1px solid #e9e0d5', borderRadius: '3px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                          <th style={{ padding: '8px 12px' }}>Booking ID</th>
                          <th style={{ padding: '8px 12px' }}>Date & Time</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Party Size</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomerData.reservations.map((r) => (
                          <tr key={r._id} style={{ borderBottom: '1px solid #f0e9df' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 600, color: '#34231c' }}>{r.reservationNumber}</td>
                            <td style={{ padding: '9px 12px', color: '#68564b' }}>
                              {r.bookingDate} at {r.bookingTime}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 600 }}>{r.guests} guests</td>
                            <td style={{ padding: '9px 12px', fontWeight: 600, textTransform: 'uppercase', fontSize: '9px' }}>
                              {r.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
