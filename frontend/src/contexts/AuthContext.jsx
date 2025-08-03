import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'
import api from '../services/api'

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  error: null,
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKENS: 'SET_TOKENS',
}

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      }

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case AUTH_ACTIONS.SET_TOKENS:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      }

    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Token storage keys
const TOKEN_KEY = 'locallens_token'
const REFRESH_TOKEN_KEY = 'locallens_refresh_token'
const USER_KEY = 'locallens_user'

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Store tokens and user data
  const storeAuthData = useCallback((user, token, refreshToken) => {
    try {
      // Store tokens in secure cookies
      Cookies.set(TOKEN_KEY, token, { 
        expires: 7, // 7 days
        secure: import.meta.env.PROD,
        sameSite: 'strict'
      })
      
      if (refreshToken) {
        Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { 
          expires: 30, // 30 days
          secure: import.meta.env.PROD,
          sameSite: 'strict'
        })
      }

      // Store user data in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      // Set token in API service
      api.setAuthToken(token)
    } catch (error) {
      console.error('Error storing auth data:', error)
    }
  }, [])

  // Clear stored auth data
  const clearAuthData = useCallback(() => {
    try {
      Cookies.remove(TOKEN_KEY)
      Cookies.remove(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      api.clearAuthToken()
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint if user is logged in
      if (state.token) {
        await api.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear auth data regardless of API call result
      clearAuthData()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    }
  }, [state.token, clearAuthData])

  // Refresh token function
  const refreshAuthToken = useCallback(async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken })
      const { token: newToken } = response.data

      // Update stored token
      Cookies.set(TOKEN_KEY, newToken, { 
        expires: 7,
        secure: import.meta.env.PROD,
        sameSite: 'strict'
      })

      // Set new token in API service
      api.setAuthToken(newToken)

      // Update state
      dispatch({
        type: AUTH_ACTIONS.SET_TOKENS,
        payload: { token: newToken, refreshToken },
      })

      return newToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }, [logout])

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = Cookies.get(TOKEN_KEY)
        const refreshToken = Cookies.get(REFRESH_TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (token && storedUser) {
          const user = JSON.parse(storedUser)
          
          // Set tokens in API service
          api.setAuthToken(token)
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user,
              token,
              refreshToken,
            },
          })

          // Verify token is still valid
          try {
            await api.get('/auth/profile')
          } catch (error) {
            if (error.response?.status === 401) {
              // Token expired, try to refresh
              if (refreshToken) {
                await refreshAuthToken(refreshToken)
              } else {
                logout()
              }
            }
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      }
    }

    initializeAuth()
  }, [refreshAuthToken, logout]) // Fixed: Added dependency array

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await api.post('/auth/login', { email, password })
      const { user, token, refreshToken } = response.data

      // Store auth data
      storeAuthData(user, token, refreshToken)

      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token, refreshToken },
      })

      toast.success(`Welcome back, ${user.name}!`)
      return { success: true, user }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [storeAuthData])

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await api.post('/auth/register', userData)
      const { user, token, refreshToken } = response.data

      // Store auth data
      storeAuthData(user, token, refreshToken)

      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token, refreshToken },
      })

      toast.success(`Welcome to LocalLens, ${user.name}!`)
      return { success: true, user }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [storeAuthData])

  // Update user profile
  const updateUser = useCallback(async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData)
      const { user } = response.data

      // Update stored user data
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      // Update state
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user })

      toast.success('Profile updated successfully')
      return { success: true, user }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })

      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!state.user && !!state.token
  }, [state.user, state.token])

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return state.user?.role === 'admin'
  }, [state.user?.role])

  // Get user permissions
  const getUserPermissions = useCallback(() => {
    if (!state.user) return []
    
    const permissions = ['read_reports', 'create_reports']
    
    if (state.user.role === 'admin') {
      permissions.push(
        'manage_reports',
        'manage_users',
        'view_analytics',
        'change_report_status'
      )
    }
    
    return permissions
  }, [state.user])

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    changePassword,
    refreshAuthToken,
    
    // Utilities
    isAuthenticated,
    isAdmin,
    getUserPermissions,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext