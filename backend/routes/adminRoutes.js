import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { adminLogin } from '../controllers/authController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { getDashboardStats } from '../controllers/adminDashboardController.js'
import {
  getAdminOrder,
  listAdminOrders,
  updateOrderPayment,
  updateOrderStatus,
} from '../controllers/adminOrderController.js'
import {
  getAdminReservation,
  listAdminReservations,
  updateAdminReservationStatus,
} from '../controllers/adminReservationController.js'
import {
  getAdminCustomer,
  listAdminCustomers,
} from '../controllers/adminCustomerController.js'
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
} from '../controllers/adminProductController.js'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/adminNotificationController.js'
import {
  getCafeSettings,
  updateAdminProfile,
} from '../controllers/adminSettingsController.js'
// Validation utilities
import { body, query, param } from 'express-validator'
import { validateRequest } from '../middleware/validation.js'

const router = Router()
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin sign-in attempts. Please try again shortly.' },
})

router.post('/auth/login', adminLoginLimiter, adminLogin)
router.get('/auth/me', requireAuth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
  })
})

// Dashboard Analytics & Stats
router.get('/dashboard/stats', requireAuth, requireAdmin, getDashboardStats)

// Orders Management
router.get(
  '/orders',
  requireAuth,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('paymentStatus').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['createdAt', 'total', 'orderNumber', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  listAdminOrders,
)
router.get('/orders/:id', requireAuth, requireAdmin, getAdminOrder)
router.patch(
  '/orders/:id/status',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('status').isIn(['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled']),
    body('note').optional().isString().trim(),
    validateRequest,
  ],
  updateOrderStatus,
)
router.patch(
  '/orders/:id/payment',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded']),
    body('paymentMethod').optional().isIn(['pay_at_cafe', 'cash', 'upi', 'card']),
    validateRequest,
  ],
  updateOrderPayment,
)

// Reservations Management
router.get(
  '/reservations',
  requireAuth,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('date').optional().isISO8601(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['bookingDate', 'createdAt', 'guests']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  listAdminReservations,
)
router.get('/reservations/:id', requireAuth, requireAdmin, getAdminReservation)
router.patch(
  '/reservations/:id/status',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('status').isIn(['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled']),
    validateRequest,
  ],
  updateAdminReservationStatus,
)

// Customer Management
router.get('/customers', requireAuth, requireAdmin, listAdminCustomers)
router.get('/customers/:id', requireAuth, requireAdmin, getAdminCustomer)

// Menu Catalog Management
router.get('/products', requireAuth, requireAdmin, listAdminProducts)
router.post(
  '/products',
  requireAuth,
  requireAdmin,
  [
    body('name').exists().isString().trim(),
    body('price').exists().isFloat({ min: 0 }),
    body('description').exists().isString().trim(),
    body('category').exists().isString().trim(),
    body('imageUrl').exists().isString().trim(),
    body('badge').optional().isString().trim(),
    body('isVegetarian').optional().isBoolean(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('ingredients').optional().isArray(),
    validateRequest,
  ],
  createAdminProduct,
)
router.put(
  '/products/:id',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional().isString().trim(),
    body('category').optional().isString().trim(),
    body('imageUrl').optional().isString().trim(),
    body('badge').optional().isString().trim(),
    body('isVegetarian').optional().isBoolean(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('ingredients').optional().isArray(),
    validateRequest,
  ],
  updateAdminProduct,
)
router.delete('/products/:id', requireAuth, requireAdmin, deleteAdminProduct)
router.get('/categories', requireAuth, requireAdmin, listAdminCategories)
router.post('/categories', requireAuth, requireAdmin, createAdminCategory)

// Notification Management
router.get(
  '/notifications',
  requireAuth,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isString(),
    query('unreadOnly').optional().isIn(['true', 'false']),
    validateRequest,
  ],
  listNotifications,
)
router.patch('/notifications/read-all', requireAuth, requireAdmin, markAllNotificationsRead)
router.patch(
  '/notifications/:id/read',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    validateRequest,
  ],
  markNotificationRead,
)

// Settings Management
router.get('/settings', requireAuth, requireAdmin, getCafeSettings)
router.patch('/settings/profile', requireAuth, requireAdmin, updateAdminProfile)

export default router
