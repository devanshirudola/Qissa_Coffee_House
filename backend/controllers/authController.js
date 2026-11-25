import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function issueToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error('Authentication is not configured with a secure signing key.')
    error.status = 503
    throw error
  }
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function userResponse(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, phone = '' } = req.body ?? {}
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' })
    }
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ success: false, message: 'Please enter a name between 2 and 80 characters.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Your password must be between 8 and 72 characters.' })
    }
    if (typeof phone !== 'string' || phone.length > 30) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' })
    }
    const existing = await User.exists({ email: cleanEmail })
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists.' })

    const user = await User.create({ name: cleanName, email: cleanEmail, phone: phone.trim(), password })
    return res.status(201).json({ success: true, token: issueToken(user), user: userResponse(user) })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Please check the information and try again.' })
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Enter your email and password.' })
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' })
    }
    return res.json({ success: true, token: issueToken(user), user: userResponse(user) })
  } catch (error) {
    next(error)
  }
}

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Enter your admin email and password.' })
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || user.role !== 'admin' || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' })
    }
    return res.json({ success: true, token: issueToken(user), user: userResponse(user) })
  } catch (error) {
    next(error)
  }
}

export function currentUser(req, res) {
  return res.json({ success: true, user: userResponse(req.user) })
}
