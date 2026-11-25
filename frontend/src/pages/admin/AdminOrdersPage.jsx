import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiFilter,
  FiPhone,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminOrderService } from '../../services/adminApi.js'

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'Pending', label: 'New / Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Preparing', label: 'Preparing' },
  { value: 'Ready', label: 'Ready for Pickup' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState('')
  const [cancelDialogOrder, setCancelDialogOrder] = useState(null)

  const loadOrders = useCallback(async (pageOverride) => {
    setLoading(true)
    try {
      const currentPage = pageOverride ?? pagination.page
      const res = await adminOrderService.list({
        page: currentPage,
        limit: 12,
        search,
        status: statusFilter,
        paymentStatus: paymentFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      })
      setOrders(res.orders || [])
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, pages: 1 })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch customer orders.')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, search, statusFilter, paymentFilter, startDate, endDate, sortBy, sortOrder])

  useEffect(() => {
    loadOrders(1)
  }, [statusFilter, paymentFilter, startDate, endDate, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingId(orderId)
    try {
      const updated = await adminOrderService.updateStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated)
      }
      toast.success(`Order #${updated.orderNumber} updated to ${newStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.')
    } finally {
      setUpdatingId('')
      setCancelDialogOrder(null)
    }
  }

  async function handlePaymentToggle(orderId, currentStatus) {
    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    try {
      const updated = await adminOrderService.updatePayment(orderId, nextStatus)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated)
      }
      toast.success(`Payment status updated to ${nextStatus.toUpperCase()}`)
    } catch (err) {
      toast.error('Failed to update payment status.')
    }
  }

  function getStatusBadgeStyle(status) {
    switch (status) {
      case 'Completed':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }
      case 'Cancelled':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }
      case 'Ready':
        return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }
      case 'Preparing':
        return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }
      case 'Confirmed':
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }
      case 'Pending':
      default:
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ============================================================== */}
      {/* PAGE HEADER */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9d7857', fontWeight: 600 }}>
            Orders & Kitchen Queue
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Customer Orders ({pagination.total})
          </h2>
        </div>

        <button
          onClick={() => loadOrders()}
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
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* FILTER & SEARCH TOOLBAR */}
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
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#88766a' }} />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, phone, item…"
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

          {/* Status Filter Tabs / Dropdown */}
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
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
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
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>

          {/* Date Range Start */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
            }}
            title="Start Date"
          />

          {/* Date Range End */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
            }}
            title="End Date"
          />

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
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="total-desc">Highest Amount</option>
            <option value="total-asc">Lowest Amount</option>
          </select>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || paymentFilter !== 'all' || startDate || endDate || search) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPaymentFilter('all')
                setStartDate('')
                setEndDate('')
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
      {/* ORDERS DATA TABLE */}
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
            Loading customer orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <FiShoppingBag style={{ fontSize: '36px', color: '#a47e5d', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 6px', color: '#34231c' }}>
              No Orders Found
            </h3>
            <p style={{ fontSize: '11px', color: '#88766a', margin: 0 }}>
              Try adjusting your search criteria or status filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                  <th style={{ padding: '12px 16px' }}>Order ID</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Contact Phone</th>
                  <th style={{ padding: '12px 16px' }}>Ordered Items</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '12px 16px' }}>Total Amount</th>
                  <th style={{ padding: '12px 16px' }}>Payment</th>
                  <th style={{ padding: '12px 16px' }}>Order Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const totalItems = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0
                  const itemSummary = order.items
                    ?.map((it) => `${it.quantity}× ${it.name}`)
                    .slice(0, 2)
                    .join(', ') + (order.items?.length > 2 ? ` +${order.items.length - 2} more` : '')

                  return (
                    <tr
                      key={order._id}
                      style={{
                        borderBottom: '1px solid #f0e9df',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#faf8f4')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#34231c' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
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
                          {order.orderNumber}
                        </button>
                      </td>

                      {/* Customer Name */}
                      <td style={{ padding: '14px 16px', color: '#34231c', fontWeight: 500 }}>
                        {order.customerName}
                      </td>

                      {/* Customer Phone */}
                      <td style={{ padding: '14px 16px', color: '#68564b' }}>
                        <a href={`tel:${order.customerPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {order.customerPhone}
                        </a>
                      </td>

                      {/* Ordered Items summary */}
                      <td style={{ padding: '14px 16px', color: '#68564b', maxWidth: '200px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={itemSummary}>
                          {itemSummary}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#34231c' }}>
                        {totalItems}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#34231c' }}>
                        {formatPrice(order.total)}
                      </td>

                      {/* Payment Status & Method */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handlePaymentToggle(order._id, order.paymentStatus)}
                          style={{
                            border: 'none',
                            background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                            color: order.paymentStatus === 'paid' ? '#15803d' : '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                          }}
                          title="Click to toggle Paid/Unpaid"
                        >
                          {order.paymentStatus || 'unpaid'}
                        </button>
                        <small style={{ display: 'block', fontSize: '9px', color: '#88766a', marginTop: '2px' }}>
                          {order.paymentMethod === 'pay_at_cafe' ? 'Pay at café' : order.paymentMethod}
                        </small>
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '14px 16px', color: '#68564b' }}>
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <small style={{ color: '#9d887a', fontSize: '9px' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </td>

                      {/* Order Status Badge */}
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
                            ...getStatusBadgeStyle(order.status),
                          }}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: '#f8f5ef',
                              border: '1px solid #ded2c4',
                              color: '#49372c',
                              fontSize: '10px',
                              cursor: 'pointer',
                              borderRadius: '2px',
                            }}
                            title="View order details"
                          >
                            <FiEye /> View
                          </button>

                          {/* Quick Advance Status Dropdown */}
                          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              disabled={updatingId === order._id}
                              style={{
                                padding: '5px 8px',
                                border: '1px solid #ded2c4',
                                background: '#ffffff',
                                fontSize: '10px',
                                color: '#34231c',
                                borderRadius: '2px',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirm</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready">Ready</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancel</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGINATION BAR */}
        {/* ============================================================== */}
        {!loading && orders.length > 0 && (
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
              Showing page <b>{pagination.page}</b> of <b>{pagination.pages}</b> ({pagination.total} total orders)
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                  loadOrders(pagination.page - 1)
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
                  loadOrders(pagination.page + 1)
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
      {/* ORDER DETAILS MODAL / DRAWER */}
      {/* ============================================================== */}
      {selectedOrder && (
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
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9e0d5',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '680px',
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
                  Order Details
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '2px 0 0' }}>
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#4a342a',
                    border: 'none',
                    color: '#e9dfd3',
                    padding: '6px 12px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Print customer order ticket"
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fffaf4',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Customer Info Card */}
              <div
                style={{
                  background: '#f8f5ef',
                  border: '1px solid #e9e0d5',
                  padding: '16px',
                  borderRadius: '3px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#88766a' }}>
                    Customer
                  </span>
                  <div style={{ fontWeight: 600, color: '#34231c', fontSize: '13px', marginTop: '2px' }}>
                    {selectedOrder.customerName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#68564b' }}>{selectedOrder.customerEmail}</div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#88766a' }}>
                    Contact Phone
                  </span>
                  <div style={{ fontWeight: 600, color: '#34231c', fontSize: '13px', marginTop: '2px' }}>
                    <a href={`tel:${selectedOrder.customerPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {selectedOrder.customerPhone}
                    </a>
                  </div>
                  <div style={{ fontSize: '11px', color: '#68564b' }}>Pickup Order</div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#88766a' }}>
                    Placed On
                  </span>
                  <div style={{ fontWeight: 600, color: '#34231c', fontSize: '12px', marginTop: '2px' }}>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Special Note */}
              {selectedOrder.note && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px 14px', borderRadius: '3px' }}>
                  <b style={{ fontSize: '11px', color: '#b45309', display: 'block', marginBottom: '2px' }}>
                    Customer Pickup Note:
                  </b>
                  <p style={{ margin: 0, fontSize: '11px', color: '#78350f', fontStyle: 'italic' }}>
                    “{selectedOrder.note}”
                  </p>
                </div>
              )}

              {/* Ordered Items Table */}
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', margin: '0 0 10px', color: '#34231c' }}>
                  Items in this Order
                </h4>
                <div style={{ border: '1px solid #e9e0d5', borderRadius: '3px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                        <th style={{ padding: '10px 12px' }}>Item</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f0e9df' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '2px' }}
                              />
                              <div>
                                <b style={{ color: '#34231c' }}>{item.name}</b>
                                {item.isSample && (
                                  <small style={{ display: 'block', color: '#a47e5d', fontSize: '8px' }}>Preview Item</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#68564b' }}>
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#34231c' }}>
                            {formatPrice(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                    marginTop: '14px',
                    padding: '12px 14px',
                    background: '#f8f5ef',
                    borderRadius: '3px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '11px', color: '#68564b' }}>
                    <span>Subtotal:</span>
                    <b>{formatPrice(selectedOrder.subtotal)}</b>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '220px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#34231c',
                      borderTop: '1px solid #ded2c4',
                      paddingTop: '6px',
                    }}
                  >
                    <span>Total Pickup:</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status Progression Actions */}
              <div style={{ borderTop: '1px solid #e9e0d5', paddingTop: '16px' }}>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', margin: '0 0 10px', color: '#34231c' }}>
                  Update Kitchen & Fulfillment Status
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    disabled={updatingId === selectedOrder._id || selectedOrder.status === 'Confirmed'}
                    onClick={() => handleStatusChange(selectedOrder._id, 'Confirmed')}
                    style={actionBtnStyle('#0284c7')}
                  >
                    Confirm Order
                  </button>

                  <button
                    disabled={updatingId === selectedOrder._id || selectedOrder.status === 'Preparing'}
                    onClick={() => handleStatusChange(selectedOrder._id, 'Preparing')}
                    style={actionBtnStyle('#7c3aed')}
                  >
                    Start Preparing
                  </button>

                  <button
                    disabled={updatingId === selectedOrder._id || selectedOrder.status === 'Ready'}
                    onClick={() => handleStatusChange(selectedOrder._id, 'Ready')}
                    style={actionBtnStyle('#0d9488')}
                  >
                    Ready for Pickup
                  </button>

                  <button
                    disabled={updatingId === selectedOrder._id || selectedOrder.status === 'Completed'}
                    onClick={() => handleStatusChange(selectedOrder._id, 'Completed')}
                    style={actionBtnStyle('#059669')}
                  >
                    <FiCheck /> Mark Completed
                  </button>

                  <button
                    disabled={updatingId === selectedOrder._id || selectedOrder.status === 'Cancelled'}
                    onClick={() => setCancelDialogOrder(selectedOrder)}
                    style={{
                      ...actionBtnStyle('#dc2626'),
                      marginLeft: 'auto',
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>

              {/* Payment Toggle inside Modal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8f5ef',
                  borderRadius: '3px',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#88766a' }}>
                    Payment Verification
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c' }}>
                    Current status: {selectedOrder.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'} (Method: {selectedOrder.paymentMethod})
                  </div>
                </div>
                <button
                  onClick={() => handlePaymentToggle(selectedOrder._id, selectedOrder.paymentStatus)}
                  style={{
                    padding: '8px 14px',
                    background: selectedOrder.paymentStatus === 'paid' ? '#fee2e2' : '#dcfce7',
                    color: selectedOrder.paymentStatus === 'paid' ? '#b91c1c' : '#15803d',
                    border: '1px solid transparent',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {selectedOrder.paymentStatus === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION DIALOG: CANCEL ORDER */}
      {/* ============================================================== */}
      {cancelDialogOrder && (
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
          onClick={() => setCancelDialogOrder(null)}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '4px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #e9e0d5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <FiAlertCircle style={{ fontSize: '22px' }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: 0 }}>
                Cancel Customer Order?
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#68564b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to cancel order <b>#{cancelDialogOrder.orderNumber}</b> for {cancelDialogOrder.customerName}?
              This will update the order status to Cancelled.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCancelDialogOrder(null)}
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
                disabled={updatingId === cancelDialogOrder._id}
                onClick={() => handleStatusChange(cancelDialogOrder._id, 'Cancelled')}
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
                {updatingId === cancelDialogOrder._id ? 'Cancelling…' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function actionBtnStyle(color) {
  return {
    padding: '7px 12px',
    background: '#ffffff',
    border: `1px solid ${color}`,
    color: color,
    fontSize: '10px',
    fontWeight: 600,
    borderRadius: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }
}
