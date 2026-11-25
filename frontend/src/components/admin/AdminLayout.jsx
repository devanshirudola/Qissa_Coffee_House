import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import {
  FiArrowUpRight,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCoffee,
  FiExternalLink,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiRadio,
  FiSettings,
  FiShoppingBag,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useAdminAuth } from '../../context/AdminAuthContext.jsx'
import adminApi from '../../services/adminApi.js'

export default function AdminLayout() {
  const { admin, token, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://127.0.0.1:5000'

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('join_admin', { token })
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev.slice(0, 19)])
      setUnreadCount((prev) => prev + 1)

      // Audio notification beep (synthesized via Web Audio API, graceful fallback)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1) // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.35)
      } catch {
        // audio muted or unsupported
      }

      toast.custom(
        (t) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#34231c',
              color: '#fffaf4',
              padding: '14px 18px',
              borderRadius: '3px',
              border: '1px solid #a47e5d',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              fontFamily: 'DM Sans, sans-serif',
              maxWidth: '380px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#a47e5d',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <FiBell style={{ color: '#fffaf4' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#f7f3ed' }}>
                {data.title || 'New Admin Alert'}
              </strong>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '11px',
                  color: '#d8cabe',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.message}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a49485',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <FiX />
            </button>
          </div>
        ),
        { duration: 6000 }
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  // Load notifications from API on mount
  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data } = await adminApi.get('/admin/notifications')
        if (data.success) {
          setNotifications(data.data.notifications || [])
          setUnreadCount(data.data.unreadCount || 0)
        }
      } catch {
        // fallback gracefully
      }
    }
    loadNotifications()
  }, [])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkAllAsRead() {
    try {
      await adminApi.patch('/admin/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  function handleLogout() {
    logout()
    toast.success('Signed out of admin portal.')
    navigate('/admin/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <FiGrid /> },
    { label: 'Orders', path: '/admin/orders', icon: <FiShoppingBag /> },
    { label: 'Reservations', path: '/admin/reservations', icon: <FiCalendar /> },
    { label: 'Customers', path: '/admin/customers', icon: <FiUsers /> },
    { label: 'Menu Management', path: '/admin/menu', icon: <FiCoffee /> },
    { label: 'Notifications', path: '/admin/notifications', icon: <FiBell />, badge: unreadCount },
    { label: 'Settings', path: '/admin/settings', icon: <FiSettings /> },
  ]

  // Page title generator based on current route
  const getPageTitle = () => {
    const p = location.pathname
    if (p === '/admin' || p === '/admin/') return 'Dashboard Overview'
    if (p.startsWith('/admin/orders')) return 'Orders Management'
    if (p.startsWith('/admin/reservations')) return 'Reservations Management'
    if (p.startsWith('/admin/customers')) return 'Customer Directory'
    if (p.startsWith('/admin/menu')) return 'Menu Catalog Management'
    if (p.startsWith('/admin/notifications')) return 'Notifications Center'
    if (p.startsWith('/admin/settings')) return 'Café Settings'
    return 'Admin Dashboard'
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f7f3ed',
        color: '#34231c',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(36, 24, 18, 0.65)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ============================================================== */}
      {/* ADMIN SIDEBAR */}
      {/* ============================================================== */}
      <aside
        style={{
          width: '260px',
          background: '#241812',
          color: '#f7f0e8',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: sidebarOpen ? 0 : '-260px',
          zIndex: 50,
          transition: 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
          overflowY: 'auto',
        }}
        className="admin-sidebar"
      >
        {/* Brand Area */}
        <div
          style={{
            padding: '28px 24px 22px',
            borderBottom: '1px solid #3b2b22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #a47e5d',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'Playfair Display, serif',
                fontStyle: 'italic',
                fontSize: '20px',
                color: '#e9dfd3',
                background: 'rgba(164, 126, 93, 0.15)',
              }}
            >
              q.
            </div>
            <div>
              <b
                style={{
                  display: 'block',
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  color: '#fffaf4',
                }}
              >
                QISSA
              </b>
              <small
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.18em',
                  color: '#a47e5d',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Staff Portal
              </small>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#d8cabe',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'none',
            }}
            className="mobile-close-btn"
          >
            <FiX />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav
          style={{
            padding: '24px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
          }}
        >
          <span
            style={{
              padding: '0 12px 8px',
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#8b786b',
              fontWeight: 600,
            }}
          >
            Navigation
          </span>

          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin' || location.pathname === '/admin/'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fffaf4' : '#cbb8a4',
                  background: isActive ? '#a47e5d' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    style={{
                      background: isActive ? '#241812' : '#dc2626',
                      color: '#fff',
                      fontSize: '9px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div
          style={{
            padding: '18px 14px',
            borderTop: '1px solid #3b2b22',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              borderRadius: '2px',
              color: '#b9a999',
              textDecoration: 'none',
              fontSize: '11px',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiExternalLink /> View Customer Site
            </span>
            <FiArrowUpRight style={{ fontSize: '13px' }} />
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              width: '100%',
              background: 'none',
              border: '1px solid #4a342a',
              borderRadius: '2px',
              color: '#e57373',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(229,115,115,0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
          >
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTAINER */}
      {/* ============================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '260px',
          minWidth: 0,
          transition: 'margin-left 0.28s ease',
        }}
        className="admin-main-wrap"
      >
        {/* ============================================================== */}
        {/* TOP NAVIGATION BAR */}
        {/* ============================================================== */}
        <header
          style={{
            height: '70px',
            background: '#ffffff',
            borderBottom: '1px solid #e9e0d5',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 2px 10px rgba(52,35,28,0.03)',
          }}
        >
          {/* Left: Mobile hamburger & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#34231c',
                cursor: 'pointer',
                padding: '6px',
              }}
              className="mobile-hamburger"
              aria-label="Toggle navigation menu"
            >
              <FiMenu />
            </button>
            <div>
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#92785f',
                  fontWeight: 600,
                }}
              >
                Qissa Administration
              </div>
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                  color: '#34231c',
                }}
              >
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right: Socket Status, Notification Bell, Admin Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Live Socket Sync Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: socketConnected ? '#edf7ed' : '#fff3e0',
                padding: '5px 11px',
                borderRadius: '16px',
                fontSize: '10px',
                fontWeight: 500,
                color: socketConnected ? '#2e7d32' : '#ed6c02',
              }}
              title={socketConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time events…'}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: socketConnected ? '#2e7d32' : '#ed6c02',
                  display: 'inline-block',
                  boxShadow: socketConnected ? '0 0 6px #2e7d32' : 'none',
                }}
              />
              <span>{socketConnected ? 'Live Sync' : 'Connecting…'}</span>
            </div>

            {/* Notification Bell & Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid #e9e0d5',
                  background: '#f8f5ef',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#554238',
                  transition: 'background 0.2s',
                }}
                aria-label="View notifications"
              >
                <FiBell style={{ fontSize: '16px' }} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      border: '2px solid #ffffff',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '360px',
                    maxWidth: '90vw',
                    background: '#ffffff',
                    border: '1px solid #e9e0d5',
                    borderRadius: '4px',
                    boxShadow: '0 15px 40px rgba(52,35,28,0.18)',
                    zIndex: 60,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 18px',
                      background: '#34231c',
                      color: '#fffaf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiBell />
                      <strong style={{ fontSize: '13px' }}>Notifications</strong>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: '#a47e5d',
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e9dfd3',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline',
                        }}
                      >
                        <FiCheck /> Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#88766a', fontSize: '12px' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n._id || n.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0e9df',
                            background: n.isRead ? '#ffffff' : '#fdf9f4',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setNotifDropdownOpen(false)
                            if (n.referenceModel === 'Order') navigate('/admin/orders')
                            else if (n.referenceModel === 'Reservation') navigate('/admin/reservations')
                            else navigate('/admin/notifications')
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: n.isRead ? '#d6c7b5' : '#a47e5d',
                              marginTop: '5px',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '8px',
                                marginBottom: '2px',
                              }}
                            >
                              <b style={{ fontSize: '12px', color: '#34231c' }}>{n.title}</b>
                              <small style={{ fontSize: '10px', color: '#9d887a' }}>
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', color: '#68564b', lineHeight: 1.4 }}>
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/admin/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: '11px',
                      textAlign: 'center',
                      background: '#f8f5ef',
                      color: '#6a4c39',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      borderTop: '1px solid #e9e0d5',
                    }}
                  >
                    View All Notifications →
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 12px 4px 6px',
                background: '#f8f5ef',
                border: '1px solid #e9e0d5',
                borderRadius: '24px',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#34231c',
                  color: '#fffaf4',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34231c' }}>
                  {admin?.name || 'Administrator'}
                </span>
                <span style={{ fontSize: '8px', letterSpacing: '0.08em', color: '#a47e5d', textTransform: 'uppercase' }}>
                  Café Manager
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* PAGE CONTENT */}
        {/* ============================================================== */}
        <main style={{ flex: 1, padding: '30px 32px 60px' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .admin-sidebar {
            left: ${sidebarOpen ? '0' : '-260px'} !important;
          }
          .admin-main-wrap {
            margin-left: 0 !important;
          }
          .mobile-hamburger {
            display: block !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
