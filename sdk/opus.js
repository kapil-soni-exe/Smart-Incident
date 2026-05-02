/**
 * OpusGuard SDK — opus.js
 * ======================
 * Lightweight error capture SDK for the Smart Incident Response Platform.
 * Drop this file into any JavaScript project to automatically capture
 * unhandled errors and promise rejections and send them to the OpusGuard backend.
 *
 * Usage:
 *   import Opus from './opus.js'
 *   Opus.init({ apiKey: 'opus_...', endpoint: 'http://localhost:5000' })
 */

const Opus = (() => {
  // ── Internal state ──────────────────────────────────────────────────────────
  let _config = {
    apiKey:   null,
    endpoint: 'http://localhost:5000',
    service:  'unknown-service',
    env:      'prod',
    debug:    false,
  }

  let _initialized = false

  // ── Internal logger — only logs when debug mode is on ──────────────────────
  const log = (...args) => {
    if (_config.debug) console.log('[OpusGuard]', ...args)
  }

  const warn = (...args) => console.warn('[OpusGuard]', ...args)

  // ── Serialize error object into a plain payload ────────────────────────────
  const serializeError = (err) => ({
    message:  err?.message  || String(err) || 'Unknown error',
    stack:    err?.stack    || null,
    name:     err?.name     || 'Error',
  })

  // ── Collect browser/environment metadata ───────────────────────────────────
  const collectMetadata = () => {
    const meta = {}
    // Browser environment
    if (typeof navigator !== 'undefined') {
      meta.userAgent = navigator.userAgent
      meta.language  = navigator.language
    }
    // Browser screen info
    if (typeof screen !== 'undefined') {
      meta.screenResolution = `${screen.width}x${screen.height}`
    }
    // URL / page context
    if (typeof window !== 'undefined') {
      meta.url      = window.location?.href
      meta.referrer = document.referrer || null
    }
    return meta
  }

  // ── Core: send error payload to OpusGuard backend ───────────────────────────────
  const sendError = async (payload) => {
    if (!_initialized) {
      warn('Not initialised. Call Opus.init() first.')
      return
    }

    if (!_config.apiKey) {
      warn('No API key configured.')
      return
    }

    const body = {
      message:     payload.message,
      service:     _config.service,
      severity:    payload.severity  || 'low',
      source:      payload.source    || 'frontend',
      environment: _config.env,
      stack:       payload.stack     || null,
      operation:   payload.operation || null,
      tags:        payload.tags      || [],
      metadata: {
        ...collectMetadata(),
        ...payload.metadata,        // Allow caller to override/add metadata
      },
    }

    try {
      const res = await fetch(`${_config.endpoint}/api/v1/errors`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key':    _config.apiKey,
        },
        body: JSON.stringify(body),
        // keepalive ensures the request completes even if the page is unloading
        keepalive: true,
      })

      if (!res.ok) {
        warn(`Backend responded with ${res.status}`)
        return
      }

      const data = await res.json()
      log('Error reported:', data)
      return data
    } catch (fetchErr) {
      // Never crash the host application — log silently
      warn('Failed to send error to OpusGuard:', fetchErr.message)
    }
  }

  // ── Attach global unhandled error listeners ────────────────────────────────
  const attachGlobalHandlers = () => {
    // Catches synchronous runtime errors (TypeError, ReferenceError, etc.)
    window.addEventListener('error', (event) => {
      log('Caught unhandled error:', event.error)
      sendError({
        message:  event.error?.message || event.message,
        stack:    event.error?.stack   || null,
        severity: 'high',
        operation: `${event.filename}:${event.lineno}`,
        tags: ['unhandled-error'],
      })
    })

    // Catches Promise rejections that were never .catch()'d
    window.addEventListener('unhandledrejection', (event) => {
      const err = event.reason
      log('Caught unhandled rejection:', err)
      sendError({
        message:  err?.message || String(err),
        stack:    err?.stack   || null,
        severity: 'high',
        tags: ['unhandled-promise-rejection'],
      })
    })

    log('Global error handlers attached.')
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  /**
   * init — initialise the SDK. Must be called before any capture.
   * @param {Object} options
   * @param {string} options.apiKey    — your OpusGuard API key (required)
   * @param {string} [options.endpoint] — OpusGuard backend URL
   * @param {string} [options.service]  — name of your service
   * @param {string} [options.env]      — 'dev' | 'staging' | 'prod'
   * @param {boolean}[options.debug]    — enable console logging
   */
  const init = (options = {}) => {
    if (_initialized) {
      warn('SDK already initialised.')
      return
    }

    if (!options.apiKey) {
      warn('apiKey is required in Opus.init()')
      return
    }

    // Merge caller options into config
    _config = { ..._config, ...options }
    _initialized = true

    // Auto-attach global handlers in browser environments
    if (typeof window !== 'undefined') {
      attachGlobalHandlers()
    }

    log(`Initialised — service: "${_config.service}", env: "${_config.env}"`)
  }

  /**
   * captureError — manually report a known error
   * @param {Error|string} err   — the error object or message string
   * @param {Object} [extra]     — optional: { severity, operation, tags, metadata }
   */
  const captureError = (err, extra = {}) => {
    const { message, stack } = serializeError(err)
    return sendError({
      message,
      stack,
      severity:  extra.severity  || 'medium',
      operation: extra.operation || null,
      tags:      extra.tags      || [],
      metadata:  extra.metadata  || {},
    })
  }

  /**
   * captureMessage — report a plain string message (no stack trace)
   * Useful for logging warnings or custom events.
   * @param {string} message
   * @param {Object} [extra]  — { severity, operation, tags }
   */
  const captureMessage = (message, extra = {}) => {
    return sendError({
      message,
      stack:     null,
      severity:  extra.severity || 'low',
      operation: extra.operation || null,
      tags:      ['manual', ...(extra.tags || [])],
    })
  }

  /**
   * withErrorBoundary — wraps an async function and auto-captures any thrown error
   * @param {Function} fn       — async function to wrap
   * @param {Object}   [extra]  — same extra options as captureError
   * @returns {Function}        — wrapped function with the same signature
   */
  const withErrorBoundary = (fn, extra = {}) => {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (err) {
        await captureError(err, { ...extra, operation: fn.name || extra.operation })
        throw err  // Re-throw so the caller can still handle it
      }
    }
  }

  // Expose the public interface
  return { init, captureError, captureMessage, withErrorBoundary }
})()

export default Opus
