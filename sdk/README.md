# OpusGuard SDK

Lightweight JavaScript SDK for the **OpusGuard**.

---

## Installation

Copy `opus.js` into your project, or symlink it from the monorepo:

```bash
# From your app directory
cp ../sdk/opus.js ./src/opus.js
```

---

## Quick Start

```js
import Opus from './opus.js'

// 1. Initialise once at your app entry point (index.js / main.jsx)
Opus.init({
  apiKey:   'opus_your_api_key_here',   // From OpusGuard Settings page
  endpoint: 'http://localhost:5000',     // Your OpusGuard backend URL
  service:  'my-frontend',              // Name shown in dashboard
  env:      'prod',                     // dev | staging | prod
  debug:    false,                      // true = logs to console
})
```

After `init()` the SDK **automatically captures**:
- Unhandled JavaScript errors (`window.onerror`)
- Unhandled Promise rejections (`unhandledrejection`)

---

## Manual Capture

### `captureError(error, options?)`

```js
try {
  await fetchPayment()
} catch (err) {
  Opus.captureError(err, {
    severity:  'critical',             // low | medium | high | critical
    operation: 'fetchPayment',
    tags:      ['payments', 'stripe'],
    metadata:  { userId: '123' },
  })
}
```

### `captureMessage(message, options?)`

```js
Opus.captureMessage('Checkout flow started', {
  severity: 'low',
  tags: ['analytics'],
})
```

### `withErrorBoundary(fn, options?)`

Wraps an async function — captures and re-throws any error:

```js
const safeFetch = Opus.withErrorBoundary(fetchUserData, {
  severity:  'high',
  operation: 'fetchUserData',
})

const user = await safeFetch(userId)  // error auto-reported if thrown
```

---

## Options Reference

| Option     | Type    | Default               | Description                         |
|------------|---------|-----------------------|-------------------------------------|
| `apiKey`   | string  | **required**          | Your OpusGuard API key                   |
| `endpoint` | string  | `http://localhost:5000` | OpusGuard backend base URL             |
| `service`  | string  | `unknown-service`     | Service label in the dashboard      |
| `env`      | string  | `prod`                | Environment (`dev`/`staging`/`prod`)|
| `debug`    | boolean | `false`               | Enable console logging              |

---

## How It Works

```
Your App  →  SDK  →  POST /api/v1/errors  →  Backend
                                              ↓
                                         Aggregation (MD5 fingerprint)
                                              ↓
                                         count ≥ 10? → Incident created
                                              ↓
                                         BullMQ → AI Suggestion + Slack alert
```
