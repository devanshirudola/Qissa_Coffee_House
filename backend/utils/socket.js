import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

let io = null

export function initSocket(httpServer) {
  // Trusted origins – same whitelist as HTTP CORS.
  const allowedOrigins = new Set([
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean))

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true)
        // Reject disallowed origins.
        return callback(new Error('Origin not allowed'), false)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
  })

  // Authenticate admin sockets.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
      if (token && process.env.JWT_SECRET) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET)
          const user = await User.findById(payload.sub).lean()
          if (user && user.role === 'admin') {
            socket.user = user
            socket.isAdmin = true
          }
        } catch {
          // Invalid or expired token – continue as guest.
        }
      }
      socket.isAdmin ? next() : next(new Error('Unauthorized'))
    } catch (err) {
      next(err)
    }
  })

  io.on('connection', (socket) => {
    if (socket.isAdmin) {
      socket.join('admins')
      console.info(`[Socket.IO] Admin connected: ${socket.user.email} (${socket.id})`)
    }

    socket.on('join_admin', async (data) => {
      const token = data?.token
      if (token && process.env.JWT_SECRET) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET)
          const user = await User.findById(payload.sub).lean()
          if (user && user.role === 'admin') {
            socket.user = user
            socket.isAdmin = true
            socket.join('admins')
            socket.emit('admin_joined', { success: true })
            console.info(`[Socket.IO] Socket promoted to admin: ${user.email} (${socket.id})`)
          }
        } catch {
          socket.emit('admin_joined', { success: false, message: 'Invalid token' })
        }
      }
    })

    socket.on('disconnect', () => {
      // client disconnected
    })
  })

  return io
}

export function getIO() {
  return io
}

export function emitToAdmins(event, payload) {
  if (io) {
    io.to('admins').emit(event, payload)
    // Also broadcast on root for real-time flexibility
    io.emit(`admin:${event}`, payload)
  }
}
