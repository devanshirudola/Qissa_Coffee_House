import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import reservationRoutes from './routes/reservationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { seedSampleMenu } from './services/seedSampleMenu.js'
import { initSocket } from './utils/socket.js'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'

// Verify JWT secret strength at startup
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  console.error('Fatal: JWT_SECRET must be at least 32 characters long for security.');
  process.exit(1);
}

const app = express()
const server = http.createServer(app)
initSocket(server)
const port = Number(process.env.PORT) || 5000

// Enhanced security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", process.env.CLIENT_URL].filter(Boolean),
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

const allowedOrigins = new Set([process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean))
// CORS configuration with stricter origin handling
app.use(cors({
  origin: (origin, callback) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (origin && allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    if (!origin && isDev) {
      // Allow requests without Origin header in development (e.g., curl, Postman)
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Qissa Coffee House API is running' })
})

// Centralized error handling (no stack traces in production)
app.use(errorHandler);

// Export Express app for testing purposes
export default app;

try {
  await connectDatabase()
  await seedSampleMenu()
  server.listen(port, () => console.info(`API listening on port ${port}`))
} catch (error) {
  console.error(`Unable to start API: ${error.message}`)
  process.exit(1)
}\n
