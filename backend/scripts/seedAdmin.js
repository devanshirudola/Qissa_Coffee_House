import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'

function readAdminCredentials() {
  const name = process.env.ADMIN_NAME?.trim() || 'Qissa Administrator'
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Set a valid ADMIN_EMAIL in backend/.env.')
  }
  if (password && (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72)) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.')
  }
  if (!password) throw new Error('Set ADMIN_PASSWORD in backend/.env.')
  return { name, email, password }
}

async function seedAdmin() {
  const credentials = readAdminCredentials()
  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await User.findOne({ email: credentials.email }).select('+password')
  if (existing?.role === 'admin') {
    console.info('An administrator account already exists; no account was changed.')
    return
  }

  if (existing) {
    if (process.env.ADMIN_PROMOTE_EXISTING !== 'true') {
      throw new Error('That email belongs to a customer. Set ADMIN_PROMOTE_EXISTING=true to promote it deliberately.')
    }
    existing.name = process.env.ADMIN_NAME?.trim() || existing.name
    existing.password = credentials.password
    existing.role = 'admin'
    await existing.save()
  } else {
    await User.create({ ...credentials, role: 'admin' })
  }

  console.info('Admin account setup completed.')
}

try {
  await seedAdmin()
} catch {
  console.error('Admin setup failed. Check the required values in backend/.env and try again.')
  process.exitCode = 1
} finally {
  await mongoose.disconnect().catch(() => {})
}
