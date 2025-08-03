import axios from 'axios'
import toast from 'react-hot-toast'

// Create main axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create separate axios instance for refresh requests to avoid infinite loops
const refreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        if (!originalRequest._retry && (data?.error === 'TOKEN_EXPIRED' || data?.error === 'INVALID_TOKEN')) {
          // If we're already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return api(originalRequest)
            }).catch(err => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          isRefreshing = true
          
          try {
            // Try to refresh token using separate axios instance
            const refreshToken = getCookie('locallens_refresh_token')
            if (!refreshToken) {
              throw new Error('No refresh token available')
            }

            const response = await refreshApi.post('/auth/refresh', { refreshToken })
            const { token } = response.data
            
            if (!token) {
              throw new Error('No token received from refresh')
            }
            
            // Update token
            setAuthToken(token)
            setCookie('locallens_token', token, 7)
            
            // Process queued requests
            processQueue(null, token)
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
            
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            
            // Process queued requests with error
            processQueue(refreshError, null)
            
            // Clear auth data and redirect to login
            clearAuthData()
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              toast.error('Session expired. Please login again.')
              setTimeout(() => {
                window.location.href = '/login'
              }, 1000)
            }
            
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        } else {
          // Clear auth data and redirect to login for other 401 errors
          clearAuthData()
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            toast.error('Authentication failed. Please login again.')
            setTimeout(() => {
              window.location.href = '/login'
            }, 1000)
          }
        }
        break

      case 403:
        toast.error('Access denied. You don\'t have permission to perform this action.')
        break

      case 404:
        if (!originalRequest.url?.includes('/auth/profile')) {
          toast.error('Resource not found.')
        }
        break

      case 422:
        // Validation errors
        if (data?.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            toast.error(err.msg || err.message || 'Validation error')
          })
        } else {
          toast.error(data?.message || 'Validation failed')
        }
        break

      case 429:
        toast.error('Too many requests. Please try again later.')
        break

      case 500:
        toast.error('Server error. Please try again later.')
        break

      default:
        if (status >= 400) {
          toast.error(data?.message || 'An error occurred')
        }
    }

    return Promise.reject(error)
  }
)

// Helper functions for cookie management
const setCookie = (name, value, days) => {
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${
      window.location.protocol === 'https:' ? ';Secure' : ''
    }`
  } catch (error) {
    console.error('Error setting cookie:', error)
  }
}

const getCookie = (name) => {
  try {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  } catch (error) {
    console.error('Error getting cookie:', error)
    return null
  }
}

const clearAuthData = () => {
  try {
    // Clear cookies
    document.cookie = 'locallens_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'locallens_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Clear localStorage
    localStorage.removeItem('locallens_user')
    
    // Clear auth header
    delete api.defaults.headers.common['Authorization']
    
    // Log auth data cleared
    if (import.meta.env.DEV) {
      console.log('🧹 Auth data cleared')
    }
  } catch (error) {
    console.error('Error clearing auth data:', error)
  }
}

// Auth token management
const setAuthToken = (token) => {
  try {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      if (import.meta.env.DEV) {
        console.log('🔑 Auth token set')
      }
    } else {
      delete api.defaults.headers.common['Authorization']
      if (import.meta.env.DEV) {
        console.log('🔑 Auth token cleared')
      }
    }
  } catch (error) {
    console.error('Error setting auth token:', error)
  }
}

const clearAuthToken = () => {
  try {
    delete api.defaults.headers.common['Authorization']
    if (import.meta.env.DEV) {
      console.log('🔑 Auth token cleared')
    }
  } catch (error) {
    console.error('Error clearing auth token:', error)
  }
}

// API methods
const apiMethods = {
  // Set auth token
  setAuthToken,
  clearAuthToken,
  clearAuthData,

  // Generic HTTP methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),

  // File upload with progress
  uploadFile: (url, formData, onUploadProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
  },

  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      })

      // Create blob link to download
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename || 'download'
      link.click()

      // Clean up
      window.URL.revokeObjectURL(link.href)
      
      if (import.meta.env.DEV) {
        console.log(`📥 File downloaded: ${filename}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  },

  // Batch requests
  all: (requests) => axios.all(requests),
  spread: (callback) => axios.spread(callback),

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

// Export the enhanced API object
export default apiMethods