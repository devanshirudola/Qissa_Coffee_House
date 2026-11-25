import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAdminAuth } from '../../context/AdminAuthContext.jsx'

export default function AdminLoginPage() {
  const { admin, login } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // If already authenticated as admin, redirect to admin dashboard
  if (admin?.role === 'admin') {
    const destination = location.state?.from?.pathname || '/admin'
    navigate(destination, { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      toast.success('Welcome back, Administrator.')
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid administrator credentials. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2b1c16 0%, #1c120e 100%)',
      padding: '24px 16px',
      fontFamily: 'DM Sans, sans-serif',
      color: '#f7f3ed',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative ambient background accents */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(164,126,93,0.15) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(157,120,87,0.12) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#34231c',
        border: '1px solid #4a342a',
        borderRadius: '4px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1.5px solid #a47e5d',
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontSize: '28px',
            color: '#e9dfd3',
            marginBottom: '14px',
            background: 'rgba(164, 126, 93, 0.1)',
          }}>
            q.
          </div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: 500,
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
            color: '#fffaf4',
          }}>
            Qissa Admin Portal
          </h1>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#a47e5d',
            margin: 0,
            fontWeight: 600,
          }}>
            Café Management & Orders
          </p>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '12px 14px',
            fontSize: '12px',
            lineHeight: 1.5,
            borderRadius: '2px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <FiShield style={{ flexShrink: 0, fontSize: '15px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#d8cabe',
              marginBottom: '7px',
              fontWeight: 500,
            }}>
              Admin Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8b786b',
                fontSize: '15px',
              }} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@qissacoffee.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: '#241812',
                  border: '1px solid #4a342a',
                  color: '#fffaf4',
                  padding: '12px 14px 12px 40px',
                  fontSize: '13px',
                  borderRadius: '2px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#a47e5d'}
                onBlur={(e) => e.target.style.borderColor = '#4a342a'}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#d8cabe',
              marginBottom: '7px',
              fontWeight: 500,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8b786b',
                fontSize: '15px',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: '#241812',
                  border: '1px solid #4a342a',
                  color: '#fffaf4',
                  padding: '12px 42px 12px 40px',
                  fontSize: '13px',
                  borderRadius: '2px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#a47e5d'}
                onBlur={(e) => e.target.style.borderColor = '#4a342a'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#8b786b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#a49485',
            marginTop: '2px',
          }}>
            <FiCheckCircle style={{ color: '#a47e5d', fontSize: '13px' }} />
            <span>Authorized staff and manager access only</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              height: '46px',
              background: loading ? '#543b30' : '#a47e5d',
              color: '#fffaf4',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#8c6848')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#a47e5d')}
          >
            {loading ? 'Authenticating…' : (
              <>
                <span>Sign in to Dashboard</span>
                <FiArrowRight style={{ fontSize: '15px' }} />
              </>
            )}
          </button>
        </form>

        {/* Return to website */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #4a342a',
          textAlign: 'center',
        }}>
          <Link
            to="/"
            style={{
              fontSize: '11px',
              color: '#a49485',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.color = '#e9dfd3'}
            onMouseOut={(e) => e.target.style.color = '#a49485'}
          >
            ← Return to Qissa Coffee House
          </Link>
        </div>
      </div>
    </div>
  )
}
