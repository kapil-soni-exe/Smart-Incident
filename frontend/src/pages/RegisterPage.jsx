import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'

function getPasswordStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  return score // 0–3
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Strong']
const STRENGTH_CLASS = ['', 'weak', 'medium', 'strong']

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to OpusGuard 🎉')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShieldCheck size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="auth-logo-text">OpusGuard</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start monitoring your production systems in minutes</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={15} /></span>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Work email</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={15} /></span>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password
              {form.password && (
                <span style={{
                  marginLeft: 8, textTransform: 'none', letterSpacing: 0,
                  color: strength === 3 ? 'var(--green)' : strength === 2 ? 'var(--yellow)' : 'var(--red)',
                  fontWeight: 500,
                }}>
                  — {STRENGTH_LABEL[strength]}
                </span>
              )}
            </label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={15} /></span>
              <input
                id="reg-password"
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength meter */}
            {form.password && (
              <div className="pw-strength">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`pw-bar ${strength >= i ? STRENGTH_CLASS[strength] : ''}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            className="btn btn-primary btn-auth"
            type="submit"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
              : <><ArrowRight size={15} /> Get Started Free</>
            }
          </button>
        </form>

        {/* Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          {[
            'No credit card required',
            'Full access during free trial',
            'Cancel anytime',
          ].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--tx-3)' }}>
              <CheckCircle2 size={13} color="var(--green)" />
              {text}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="auth-footer" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
