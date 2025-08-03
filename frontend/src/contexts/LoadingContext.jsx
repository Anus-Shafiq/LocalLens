import React, { createContext, useContext, useState } from 'react'

// Create context
const LoadingContext = createContext()

// Loading provider component
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Show loading with optional message
  const showLoading = (message = '') => {
    setLoadingMessage(message)
    setIsLoading(true)
  }

  // Hide loading
  const hideLoading = () => {
    setIsLoading(false)
    setLoadingMessage('')
  }

  // Context value
  const value = {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

// Custom hook to use loading context
export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export default LoadingContext