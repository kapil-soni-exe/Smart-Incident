import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to monitor your production systems</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={15} /></span>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={15} /></span>
              <input
                id="login-password"
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
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
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            className="btn btn-primary btn-auth"
            type="submit"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
              : <><ArrowRight size={15} /> Sign In</>
            }
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          New to OpusGuard?{' '}
          <Link to="/register">Create a free account</Link>
        </p>

        {/* Trust badges */}
        <div className="auth-features">
          <span className="auth-feature-tag"><Zap size={12} /> Real-time alerts</span>
          <span className="auth-feature-tag"><Shield size={12} /> SOC 2 compliant</span>
          <span className="auth-feature-tag"><Clock size={12} /> 99.9% uptime</span>
        </div>
      </div>
    </div>
  )
}
