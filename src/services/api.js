import axios from 'axios'
import useAuthStore from '../store/authStore'

// ─── Instance ────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

// ─── Request Interceptor — attach JWT ────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor — handle 401 with token refresh ────────────────────

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401, not on the refresh/login endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue concurrent requests while refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().getRefreshToken()

      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        })
        const newToken = data.access_token
        useAuthStore.getState().setToken(newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
}

// ─── User endpoints ───────────────────────────────────────────────────────────

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
  getPublicKey: (userId) => api.get(`/users/${userId}/public-key`),
}

// ─── Message / conversation endpoints ────────────────────────────────────────

export const messagesApi = {
  getConversations: () => api.get('/conversations'),
  getMessages: (userId, params = {}) =>
    api.get(`/conversations/${userId}/messages`, { params }),
  sendMessage: (body) => api.post('/messages', body),
}

export default api
