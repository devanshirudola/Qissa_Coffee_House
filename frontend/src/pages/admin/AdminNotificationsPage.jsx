import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiEye,
  FiRefreshCw,
  FiShoppingBag,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminNotificationService } from '../../services/adminApi.js'

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const navigate = useNavigate()

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminNotificationService.list({
        type: typeFilter !== 'all' ? typeFilter : undefined,
      })
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch {
      toast.error('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleMarkRead(id) {
    try {
      const res = await adminNotificationService.markRead(id)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)))
      setUnreadCount(res.unreadCount || 0)
    } catch {
      toast.error('Failed to mark notification as read.')
    }
  }

  async function handleMarkAllRead() {
    try {
      await adminNotificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read.')
    } catch {
      toast.error('Failed to update notifications.')
    }
  }

  function handleNavigate(n) {
    if (!n.isRead) handleMarkRead(n._id)
    if (n.referenceModel === 'Order') {
      navigate('/admin/orders')
    } else if (n.referenceModel === 'Reservation') {
      navigate('/admin/reservations')
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'new_order':
      case 'order_cancelled':
        return <FiShoppingBag />
      case 'new_reservation':
      case 'reservation_cancelled':
        return <FiCalendar />
      case 'payment_completed':
        return <FiDollarSign />
      default:
        return <FiBell />
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
            Audit Log & Real-Time Alerts
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Notifications Center {unreadCount > 0 && `(${unreadCount} unread)`}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: '#f8f5ef',
                border: '1px solid #ded2c4',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#49372c',
                cursor: 'pointer',
              }}
            >
              <FiCheck />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            onClick={() => loadNotifications()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: '#ffffff',
              border: '1px solid #dcd2c4',
              borderRadius: '2px',
              fontSize: '11px',
              color: '#49372c',
              cursor: 'pointer',
            }}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABS FILTER */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e9e0d5', paddingBottom: '12px' }}>
        {[
          { label: 'All Alerts', value: 'all' },
          { label: 'Orders', value: 'new_order' },
          { label: 'Reservations', value: 'new_reservation' },
          { label: 'Cancellations', value: 'order_cancelled' },
          { label: 'Payments', value: 'payment_completed' },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            style={{
              padding: '8px 14px',
              background: typeFilter === t.value ? '#34231c' : '#ffffff',
              color: typeFilter === t.value ? '#fffaf4' : '#49372c',
              border: '1px solid',
              borderColor: typeFilter === t.value ? '#34231c' : '#ded2c4',
              borderRadius: '2px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* NOTIFICATIONS LIST */}
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
            Loading notification feed…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <FiBell style={{ fontSize: '36px', color: '#a47e5d', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 6px', color: '#34231c' }}>
              No Notifications
            </h3>
            <p style={{ fontSize: '11px', color: '#88766a', margin: 0 }}>
              New orders, table bookings, and customer alerts will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #f0e9df',
                  background: n.isRead ? '#ffffff' : '#fdfaf5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#faf6ef')}
                onMouseOut={(e) => (e.currentTarget.style.background = n.isRead ? '#ffffff' : '#fdfaf5')}
              >
                {/* Type Icon */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: n.isRead ? '#f5efe6' : '#a47e5d',
                    color: n.isRead ? '#68564b' : '#fffaf4',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleNavigate(n)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                    <b style={{ fontSize: '13px', color: '#34231c' }}>{n.title}</b>
                    {!n.isRead && (
                      <span
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          fontSize: '8px',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#68564b', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <small style={{ display: 'block', fontSize: '10px', color: '#9d887a', marginTop: '4px' }}>
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleNavigate(n)}
                    style={{
                      padding: '6px 12px',
                      background: '#f8f5ef',
                      border: '1px solid #ded2c4',
                      color: '#49372c',
                      fontSize: '10px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FiEye /> View
                  </button>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      style={{
                        padding: '6px 10px',
                        background: 'none',
                        border: '1px solid transparent',
                        color: '#a47e5d',
                        fontSize: '10px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      title="Mark as read"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
