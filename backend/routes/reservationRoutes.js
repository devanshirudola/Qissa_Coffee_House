import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { cancelReservation, createReservation, getReservationAvailability, getReservationConfig, listAllReservations, listMyReservations, updateReservationStatus } from '../controllers/reservationController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false })

router.get('/config', getReservationConfig)
router.get('/availability', getReservationAvailability)
router.use(requireAuth)
router.get('/mine', listMyReservations)
router.get('/manage', requireAdmin, listAllReservations)
router.post('/', bookingLimiter, createReservation)
router.patch('/:id/cancel', cancelReservation)
router.patch('/:id/status', requireAdmin, updateReservationStatus)

export default router
