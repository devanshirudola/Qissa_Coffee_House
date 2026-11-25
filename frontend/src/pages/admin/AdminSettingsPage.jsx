import { useEffect, useState } from 'react'
import {
  FiCheck,
  FiClock,
  FiLock,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminSettingsService } from '../../services/adminApi.js'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await adminSettingsService.get()
        setSettings(res)
        setName(res.adminProfile?.name || '')
        setPhone(res.adminProfile?.phone || '')
      } catch {
        toast.error('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (newPassword && newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }

    setSavingProfile(true)
    try {
      const payload = { name, phone }
      if (newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }
      const res = await adminSettingsService.updateProfile(payload)
      toast.success(res.message || 'Profile settings updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#88766a', fontSize: '12px' }}>
        Loading settings…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '860px' }}>
      {/* ============================================================== */}
      {/* HEADER */}
      {/* ============================================================== */}
      <div>
        <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9d7857', fontWeight: 600 }}>
          Configuration & Credentials
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
          Café Settings & Security
        </h2>
      </div>

      {/* ============================================================== */}
      {/* CAFÉ OPERATING PARAMETERS */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(52,35,28,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <FiMapPin style={{ color: '#a47e5d', fontSize: '18px' }} />
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', margin: 0, color: '#34231c' }}>
            Café Operations & Capacity Configuration
          </h3>
        </div>

        <p style={{ fontSize: '11px', color: '#74645a', margin: '0 0 20px', lineHeight: 1.6 }}>
          These backend business rules govern reservation availability calculations, operating time bounds, and table capacity on the customer website.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: '#f8f5ef',
            padding: '20px',
            borderRadius: '3px',
          }}
        >
          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88766a', letterSpacing: '0.1em' }}>
              Café Address
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '3px', lineHeight: 1.5 }}>
              {settings.address}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88766a', letterSpacing: '0.1em' }}>
              Contact Phone
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '3px' }}>
              {settings.phone}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88766a', letterSpacing: '0.1em' }}>
              Operating Hours
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '3px' }}>
              {settings.openTime} – {settings.closeTime} daily
            </div>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88766a', letterSpacing: '0.1em' }}>
              Table Slot Capacity
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginTop: '3px' }}>
              {settings.slotCapacity} guests per {settings.slotIntervalMinutes}-min slot
            </div>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88766a', letterSpacing: '0.1em' }}>
              Business Time Zone
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#34231c', marginTop: '3px' }}>
              {settings.timeZone}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADMIN SECURITY & PROFILE */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(52,35,28,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <FiShield style={{ color: '#a47e5d', fontSize: '18px' }} />
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', margin: 0, color: '#34231c' }}>
            Administrator Profile & Password
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Admin Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Admin Email Address</label>
              <input
                type="email"
                disabled
                value={settings.adminProfile?.email || ''}
                style={{ ...inputStyle, background: '#f0ece5', color: '#88766a', cursor: 'not-allowed' }}
              />
              <small style={{ fontSize: '9px', color: '#88766a', marginTop: '3px', display: 'block' }}>
                Admin email is locked to system identity
              </small>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Contact Phone (Optional)</label>
            <input
              type="text"
              placeholder="+91 88942 95359"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Change Password Sub-section */}
          <div style={{ borderTop: '1px solid #e9e0d5', paddingTop: '16px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#34231c', display: 'block', marginBottom: '4px' }}>
              Update Administrator Password
            </span>
            <small style={{ fontSize: '10px', color: '#88766a', display: 'block', marginBottom: '14px' }}>
              Leave blank if you do not wish to change your password.
            </small>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={savingProfile}
              style={{
                padding: '10px 22px',
                background: '#34231c',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: savingProfile ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiCheck />
              <span>{savingProfile ? 'Saving…' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  textTransform: 'uppercase',
  color: '#88766a',
  letterSpacing: '0.08em',
  marginBottom: '5px',
  fontWeight: 500,
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ded2c4',
  background: '#faf8f3',
  fontSize: '12px',
  color: '#34231c',
  borderRadius: '2px',
  outline: 'none',
  boxSizing: 'border-box',
}
