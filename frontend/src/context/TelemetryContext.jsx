/**
 * TelemetryContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Keeps the live 60-minute error graph data alive at the app level so that
 * navigating away from the Dashboard and back does NOT reset the spikes.
 *
 * - One WebSocket connection for the lifetime of the app session.
 * - One 10-second heartbeat ticker that pushes flat (0) buckets for new minutes.
 * - Historical trend fetched once on mount; subsequent updates come via WS.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../lib/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const timeStr = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const buildEmptyMinutes = () => {
  const data = []
  const now = new Date()
  now.setMinutes(now.getMinutes() - 60)
  for (let i = 0; i < 60; i++) {
    now.setMinutes(now.getMinutes() + 1)
    data.push({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: 0,
      critical: 0,
    })
  }
  return data
}

// ── Context ───────────────────────────────────────────────────────────────────

const TelemetryCtx = createContext(null)

export function TelemetryProvider({ children }) {
  const [liveData, setLiveData] = useState(buildEmptyMinutes)
  const [trendReady, setTrendReady] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // ── 1. Fetch historical trend once ──────────────────────────────────────
    api.get('/errors/trend')
      .then(res => {
        const historical = res.data.data // [{ _id: "14:20", count: 5, critical: 1 }]
        setLiveData(prev =>
          prev.map(entry => {
            const found = historical.find(t => t._id === entry.time)
            return found ? { ...entry, count: found.count, critical: found.critical } : entry
          })
        )
      })
      .catch(() => {/* silently ignore – graph just stays flat */ })
      .finally(() => setTrendReady(true))

    // ── 2. WebSocket – one persistent connection ─────────────────────────────
    const socketUrl =
      import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'

    const socket = io(socketUrl, { reconnectionAttempts: 10 })
    socketRef.current = socket

    socket.on('new_error', (error) => {
      setLiveData(prev => {
        const newData = [...prev]
        const now = timeStr()
        const last = { ...newData[newData.length - 1] }

        if (last.time === now) {
          last.count += 1
          if (error.severity === 'critical' || error.severity === 'high') {
            last.critical += 1
          }
          newData[newData.length - 1] = last
        } else {
          // New minute bucket – slide the window
          newData.shift()
          newData.push({
            time: now,
            count: 1,
            critical: (error.severity === 'critical' || error.severity === 'high') ? 1 : 0,
          })
        }
        return newData
      })
    })

    // ── 3. Heartbeat – push a zero bucket when a new minute starts ───────────
    const ticker = setInterval(() => {
      setLiveData(prev => {
        const newData = [...prev]
        const last = newData[newData.length - 1]
        const now = timeStr()

        if (last.time !== now) {
          newData.shift()
          newData.push({ time: now, count: 0, critical: 0 })
          return newData
        }
        return prev // no change – same minute
      })
    }, 10_000)

    return () => {
      socket.disconnect()
      clearInterval(ticker)
    }
  }, []) // runs once for the entire session

  return (
    <TelemetryCtx.Provider value={{ liveData, trendReady }}>
      {children}
    </TelemetryCtx.Provider>
  )
}

/** Consume live graph data from any page without re-creating the socket. */
export function useTelemetry() {
  const ctx = useContext(TelemetryCtx)
  if (!ctx) throw new Error('useTelemetry must be used inside <TelemetryProvider>')
  return ctx
}
