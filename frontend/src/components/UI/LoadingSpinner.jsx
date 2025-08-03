import React from 'react'
import { CircularProgress, Box } from '@mui/material'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  centered = false,
  message = '',
  className = '' 
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  }

  const spinnerSize = typeof size === 'number' ? size : sizeMap[size]

  const spinner = (
    <Box 
      className={`flex flex-col items-center justify-center ${className}`}
      sx={{ 
        ...(centered && {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        })
      }}
    >
      <CircularProgress 
        size={spinnerSize} 
        color={color}
        thickness={4}
      />
      {message && (
        <p className="mt-3 text-sm text-gray-600 font-medium">
          {message}
        </p>
      )}
    </Box>
  )

  if (centered) {
    return (
      <Box className="relative w-full h-full min-h-[200px]">
        {spinner}
      </Box>
    )
  }

  return spinner
}

export default LoadingSpinner