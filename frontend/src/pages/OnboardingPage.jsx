import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Copy, CheckCircle2 } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useAuth()
  const [done, setDone] = useState({})

  const copy = (text, label = 'Copied!') => { navigator.clipboard.writeText(text); toast.success(label) }
  const markDone = (num) => setDone(d => ({ ...d, [num]: true }))

  const initSnippet = `import Opus from './opus.js'

Opus.init({
  apiKey:   '${user?.apiKey || 'YOUR_API_KEY'}',
  endpoint: 'http://localhost:5000',
  service:  'my-service',
  env:      'prod',
})`

  const sdkFileNote = `// Copy sdk/opus.js from the OpusGuard repo into your project directory`

  const verifySnippet = `// Trigger a test error to confirm setup:
throw new Error('OpusGuard test error — delete me after verifying')`

  const completed = Object.keys(done).length

  return (
    <Layout title="Onboarding">
      <div style={{ maxWidth: 700 }}>

        {/* Hero */}
        <div style={{
          background: 'var(--brand-dim)',
          border: '1px solid rgba(108,95,199,0.3)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>
            Welcome to OpusGuard 🚀
          </div>
          <div style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.6 }}>
            Connect your application in 4 quick steps to start capturing errors and incidents in real time.
          </div>
          {/* Progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Progress</span>
              <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>{completed}/4 steps</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-surface3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'var(--brand)',
                width: `${(completed / 4) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step 1 */}
          <StepCard num={1} title="Copy your API Key" done={done[1]}>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 12, lineHeight: 1.6 }}>
              Your unique API key authenticates all SDK calls. Keep it secret.
            </p>
            <div style={{
              background: 'var(--bg-surface2)', border: '1px solid var(--bd)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--tx)', wordBreak: 'break-all', flex: 1 }}>
                {user?.apiKey || '—'}
              </code>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 9px', gap: 5, flexShrink: 0 }}
                onClick={() => { copy(user?.apiKey || '', 'API key copied!'); markDone(1) }}>
                <Copy size={11} /> Copy
              </button>
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard num={2} title="Add the Opus SDK" done={done[2]}>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 12, lineHeight: 1.6 }}>
              Copy <code style={{ fontFamily: 'monospace', background: 'var(--bg-surface3)', padding: '1px 5px', borderRadius: 3, color: 'var(--tx)' }}>sdk/opus.js</code> from the OpusGuard project root into your application directory.
            </p>
            <pre className="stack-trace" style={{ fontSize: 12 }}>{sdkFileNote}</pre>
            <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 12, gap: 5 }} onClick={() => markDone(2)}>
              <CheckCircle2 size={12} /> Mark as done
            </button>
          </StepCard>

          {/* Step 3 */}
          <StepCard num={3} title="Initialise in your app" done={done[3]}>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 12, lineHeight: 1.6 }}>
              Add this at the entry point of your app (e.g. <code style={{ fontFamily: 'monospace', background: 'var(--bg-surface3)', padding: '1px 5px', borderRadius: 3, color: 'var(--tx)' }}>index.js</code> or <code style={{ fontFamily: 'monospace', background: 'var(--bg-surface3)', padding: '1px 5px', borderRadius: 3, color: 'var(--tx)' }}>main.jsx</code>).
            </p>
            <div style={{ position: 'relative' }}>
              <pre className="stack-trace" style={{ fontSize: 12 }}>{initSnippet}</pre>
              <button
                style={{ position: 'absolute', top: 8, right: 8, background: 'var(--bg-surface3)', border: '1px solid var(--bd)', color: 'var(--tx-2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, cursor: 'pointer' }}
                onClick={() => { copy(initSnippet, 'Snippet copied!'); markDone(3) }}
              >Copy</button>
            </div>
          </StepCard>

          {/* Step 4 */}
          <StepCard num={4} title="Verify errors are flowing" done={done[4]}>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 12, lineHeight: 1.6 }}>
              Throw a test error. It will appear on your Issues page within seconds if everything is wired up correctly.
            </p>
            <div style={{ position: 'relative' }}>
              <pre className="stack-trace" style={{ fontSize: 12 }}>{verifySnippet}</pre>
              <button
                style={{ position: 'absolute', top: 8, right: 8, background: 'var(--bg-surface3)', border: '1px solid var(--bd)', color: 'var(--tx-2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, cursor: 'pointer' }}
                onClick={() => { copy(verifySnippet); markDone(4) }}
              >Copy</button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <a href="/issues" className="btn btn-primary" style={{ fontSize: 13 }}>View Issues →</a>
              <button className="btn btn-ghost" style={{ fontSize: 13, gap: 5 }} onClick={() => markDone(4)}>
                <CheckCircle2 size={13} /> All done
              </button>
            </div>
          </StepCard>

        </div>
      </div>
    </Layout>
  )
}

function StepCard({ num, title, done, children }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${done ? 'var(--green)' : 'var(--brand)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: done ? 'var(--green-bg)' : 'var(--brand-dim)',
          color: done ? 'var(--green)' : 'var(--brand-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
        }}>
          {done ? '✓' : num}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: done ? 'var(--green)' : 'var(--tx)' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}
