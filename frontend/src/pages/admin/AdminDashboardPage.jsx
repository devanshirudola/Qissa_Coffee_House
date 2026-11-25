import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAlertCircle,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminDashboardService } from '../../services/adminApi.js'

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

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
  })
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const stats = await adminDashboardService.stats()
      setData(stats)
      if (isSilent) toast.success('Dashboard metrics updated.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load dashboard metrics.'
      setError(msg)
      if (isSilent) toast.error(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '40px', width: '240px', background: '#e9dfd3', borderRadius: '4px', opacity: 0.6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '110px', background: '#ffffff', border: '1px solid #e9e0d5', borderRadius: '4px', opacity: 0.7 }} />
          ))}
        </div>
        <div style={{ height: '300px', background: '#ffffff', border: '1px solid #e9e0d5', borderRadius: '4px' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '60px auto',
      }}>
        <FiAlertCircle style={{ fontSize: '36px', color: '#dc2626', marginBottom: '14px' }} />
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 8px' }}>
          Unable to Load Dashboard
        </h2>
        <p style={{ fontSize: '12px', color: '#74645a', margin: '0 0 20px' }}>{error}</p>
        <button
          onClick={() => loadStats()}
          style={{
            background: '#34231c',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            fontSize: '11px',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const {
    summary = {},
    dailySales = [],
    monthlyRevenue = [],
    ordersByStatus = [],
    reservationsByStatus = [],
    popularItems = [],
    recentOrders = [],
    upcomingReservations = [],
  } = data || {}

  // Max daily sales for scaling SVG chart bars
  const maxDailySales = Math.max(...dailySales.map((d) => d.sales), 1000)
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* ============================================================== */}
      {/* DASHBOARD HEADER */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9d7857', fontWeight: 600 }}>
            Live Performance Metrics
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Café Overview & Analytics
          </h2>
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
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
            cursor: refreshing ? 'wait' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#f5efe6')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <FiRefreshCw style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Updating…' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* STATS CARDS GRID */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: '16px',
      }}>
        {/* Total Revenue */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Total Revenue</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <FiDollarSign />
            </div>
          </div>
          <div style={statValueStyle}>{formatPrice(summary.totalRevenue)}</div>
          <div style={statSubStyle}>From {summary.totalOrders} total orders</div>
        </div>

        {/* Total Orders */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Total Orders</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(164, 126, 93, 0.15)', color: '#886445' }}>
              <FiShoppingBag />
            </div>
          </div>
          <div style={statValueStyle}>{summary.totalOrders}</div>
          <div style={statSubStyle}>{summary.newOrders} active today</div>
        </div>

        {/* Pending Orders */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Pending Orders</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>
              <FiClock />
            </div>
          </div>
          <div style={{ ...statValueStyle, color: summary.pendingOrders > 0 ? '#d97706' : '#34231c' }}>
            {summary.pendingOrders}
          </div>
          <div style={statSubStyle}>Awaiting kitchen prep</div>
        </div>

        {/* Completed Orders */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Completed Orders</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
              <FiCheckCircle />
            </div>
          </div>
          <div style={statValueStyle}>{summary.completedOrders}</div>
          <div style={statSubStyle}>Fulfilled pickup orders</div>
        </div>

        {/* Total Reservations */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Total Reservations</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
              <FiCalendar />
            </div>
          </div>
          <div style={statValueStyle}>{summary.totalReservations}</div>
          <div style={statSubStyle}>{summary.confirmedReservations} confirmed bookings</div>
        </div>

        {/* Pending Reservations */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Pending Bookings</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(245, 158, 11, 0.15)', color: '#b45309' }}>
              <FiAlertCircle />
            </div>
          </div>
          <div style={{ ...statValueStyle, color: summary.pendingReservations > 0 ? '#b45309' : '#34231c' }}>
            {summary.pendingReservations}
          </div>
          <div style={statSubStyle}>Require staff confirmation</div>
        </div>

        {/* Confirmed Reservations */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Confirmed Tables</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <FiUserCheck />
            </div>
          </div>
          <div style={statValueStyle}>{summary.confirmedReservations}</div>
          <div style={statSubStyle}>Seats locked in capacity</div>
        </div>

        {/* Total Customers */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={statLabelStyle}>Registered Customers</span>
            <div style={{ ...iconCircleStyle, background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
              <FiUsers />
            </div>
          </div>
          <div style={statValueStyle}>{summary.totalCustomers}</div>
          <div style={statSubStyle}>Profiles with verified email</div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CHARTS ROW (Daily Sales + Monthly Revenue) */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Daily Sales Chart */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: '0 0 4px', color: '#34231c' }}>
                Daily Sales (Last 7 Days)
              </h3>
              <span style={{ fontSize: '10px', color: '#88766a' }}>Revenue trend across the current week</span>
            </div>
            <FiTrendingUp style={{ color: '#a47e5d', fontSize: '18px' }} />
          </div>

          {/* SVG Bar Chart */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '20px' }}>
            {dailySales.map((day, idx) => {
              const heightPercent = Math.max(10, Math.round((day.sales / maxDailySales) * 100))
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#34231c' }}>
                    {day.sales > 0 ? `₹${day.sales}` : '0'}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      background: day.sales > 0 ? 'linear-gradient(180deg, #a47e5d 0%, #6a4c39 100%)' : '#e9dfd3',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${day.label}: ₹${day.sales} (${day.orders} orders)`}
                  />
                  <span style={{ fontSize: '8px', color: '#88766a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {day.label.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: '0 0 4px', color: '#34231c' }}>
                Monthly Revenue (Last 6 Months)
              </h3>
              <span style={{ fontSize: '10px', color: '#88766a' }}>Month-over-month café gross income</span>
            </div>
            <FiDollarSign style={{ color: '#059669', fontSize: '18px' }} />
          </div>

          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '20px' }}>
            {monthlyRevenue.map((m, idx) => {
              const heightPercent = Math.max(10, Math.round((m.revenue / maxMonthlyRevenue) * 100))
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#34231c' }}>
                    {m.revenue > 0 ? `₹${m.revenue}` : '0'}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '42px',
                      height: `${heightPercent}%`,
                      background: m.revenue > 0 ? 'linear-gradient(180deg, #38251e 0%, #1e130e 100%)' : '#e9dfd3',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${m.label}: ₹${m.revenue} (${m.orders} orders)`}
                  />
                  <span style={{ fontSize: '8px', color: '#88766a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.label.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STATUS BREAKDOWN & POPULAR ITEMS ROW */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Order Status Breakdown */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: '0 0 16px', color: '#34231c' }}>
            Orders by Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ordersByStatus.map((item) => (
              <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#49372c', fontWeight: 500 }}>{item.label}</span>
                  <b>{item.count}</b>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f0e9df', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${summary.totalOrders > 0 ? (item.count / summary.totalOrders) * 100 : 0}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '3px',
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Menu Items */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: 0, color: '#34231c' }}>
              Most Popular Menu Items
            </h3>
            <Link to="/admin/menu" style={{ fontSize: '11px', color: '#a47e5d', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Manage Menu <FiArrowUpRight />
            </Link>
          </div>

          {popularItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#88766a', fontSize: '11px' }}>
              No orders placed yet to rank items.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {popularItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#f8f5ef',
                    borderRadius: '3px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#a47e5d', width: '16px' }}>
                    0{idx + 1}
                  </span>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '36px', height: '36px', borderRadius: '3px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: '12px', color: '#34231c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </b>
                    <small style={{ fontSize: '10px', color: '#88766a' }}>
                      {item.quantity} sold · {formatPrice(item.revenue)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RECENT ORDERS & UPCOMING RESERVATIONS */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* Recent Orders Preview */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: '0 0 2px', color: '#34231c' }}>
                Recent Customer Orders
              </h3>
              <span style={{ fontSize: '10px', color: '#88766a' }}>Latest orders received</span>
            </div>
            <Link
              to="/admin/orders"
              style={{
                fontSize: '11px',
                color: '#a47e5d',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              All Orders <FiArrowRight />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#88766a', fontSize: '11px' }}>
              No customer orders received yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                    <th style={{ padding: '8px 6px' }}>Order ID</th>
                    <th style={{ padding: '8px 6px' }}>Customer</th>
                    <th style={{ padding: '8px 6px' }}>Amount</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o._id} style={{ borderBottom: '1px solid #f5efe6' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 600, color: '#34231c' }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ fontWeight: 500, color: '#49372c' }}>{o.customerName}</div>
                        <div style={{ fontSize: '9px', color: '#88766a' }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: '10px 6px', fontWeight: 600 }}>{formatPrice(o.total)}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '2px',
                            fontSize: '8px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background:
                              o.status === 'Completed'
                                ? '#dcfce7'
                                : o.status === 'Cancelled'
                                ? '#fee2e2'
                                : o.status === 'Ready'
                                ? '#dbeafe'
                                : '#fef3c7',
                            color:
                              o.status === 'Completed'
                                ? '#15803d'
                                : o.status === 'Cancelled'
                                ? '#b91c1c'
                                : o.status === 'Ready'
                                ? '#1d4ed8'
                                : '#b45309',
                          }}
                        >
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

        {/* Upcoming Reservations Preview */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: '0 0 2px', color: '#34231c' }}>
                Upcoming Reservations
              </h3>
              <span style={{ fontSize: '10px', color: '#88766a' }}>Bookings scheduled for today and ahead</span>
            </div>
            <Link
              to="/admin/reservations"
              style={{
                fontSize: '11px',
                color: '#a47e5d',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              All Reservations <FiArrowRight />
            </Link>
          </div>

          {upcomingReservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#88766a', fontSize: '11px' }}>
              No upcoming reservations found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                    <th style={{ padding: '8px 6px' }}>Date & Time</th>
                    <th style={{ padding: '8px 6px' }}>Customer</th>
                    <th style={{ padding: '8px 6px' }}>Party Size</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingReservations.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f5efe6' }}>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ fontWeight: 600, color: '#34231c' }}>{displayDate(r.bookingDate)}</div>
                        <div style={{ fontSize: '9px', color: '#88766a' }}>{displayTime(r.bookingTime)}</div>
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ fontWeight: 500, color: '#49372c' }}>{r.customerName}</div>
                        <div style={{ fontSize: '9px', color: '#88766a' }}>{r.phone}</div>
                      </td>
                      <td style={{ padding: '10px 6px', fontWeight: 600 }}>{r.guests} guests</td>
                      <td style={{ padding: '10px 6px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '2px',
                            fontSize: '8px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background: r.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                            color: r.status === 'Confirmed' ? '#15803d' : '#b45309',
                          }}
                        >
                          {r.status}
                        </span>
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
  )
}

// Styling Constants
const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e9e0d5',
  borderRadius: '4px',
  padding: '18px 20px',
  boxShadow: '0 2px 8px rgba(52,35,28,0.03)',
}

const statLabelStyle = {
  fontSize: '9px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8b786b',
  fontWeight: 600,
}

const statValueStyle = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '24px',
  fontWeight: 600,
  margin: '10px 0 4px',
  color: '#34231c',
}

const statSubStyle = {
  fontSize: '10px',
  color: '#88766a',
}

const iconCircleStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  fontSize: '15px',
}
