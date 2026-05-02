// Base Axios instance — all API calls go through here
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',          // Proxied to http://localhost:5000 via vite.config
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sirp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sirp_token')
      localStorage.removeItem('sirp_user')
      window.location.href = '/login'  // Redirect to login page
    }
    return Promise.reject(err)
  }
)

export default api
