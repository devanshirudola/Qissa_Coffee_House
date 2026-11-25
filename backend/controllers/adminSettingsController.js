import bcrypt from 'bcryptjs'
import User from '../models/User.js'

export async function getCafeSettings(req, res, next) {
  try {
    return res.json({
      success: true,
      data: {
        cafeName: 'Qissa Coffee House',
        address: 'Shastri Nagar, Holta, near Kapila Nursing Home, Palampur, Himachal Pradesh 176061, India',
        phone: '+91 88942 95359',
        instagram: '@qissacoffeehouse',
        timeZone: process.env.BUSINESS_TIME_ZONE || 'Asia/Kolkata',
        openTime: process.env.RESERVATION_OPEN_TIME || '09:00',
        closeTime: process.env.RESERVATION_CLOSE_TIME || '21:00',
        slotIntervalMinutes: Number(process.env.RESERVATION_SLOT_INTERVAL_MINUTES) || 30,
        slotCapacity: Number(process.env.RESERVATION_SLOT_CAPACITY) || 12,
        adminProfile: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminProfile(req, res, next) {
  try {
    const { name, phone, currentPassword, newPassword } = req.body ?? {}
    const adminUser = await User.findById(req.user._id).select('+password')
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' })
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      adminUser.name = name.trim()
    }
    if (phone !== undefined && typeof phone === 'string') {
      adminUser.phone = phone.trim()
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please enter your current password.' })
      }
      const match = await adminUser.comparePassword(currentPassword)
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password does not match.' })
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' })
      }
      adminUser.password = newPassword
    }

    await adminUser.save()

    return res.json({
      success: true,
      message: 'Admin profile updated successfully.',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
      },
    })
  } catch (error) {
    next(error)
  }
}
