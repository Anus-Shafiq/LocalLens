import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../UI/LoadingSpinner'
import { Box, Typography, Button } from '@mui/material'
import { AdminPanelSettings, Home } from '@mui/icons-material'

const AdminRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner centered message="Checking permissions..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Show access denied if not admin
  if (!isAdmin()) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50">
        <Box className="text-center p-8 bg-white rounded-xl shadow-soft max-w-md mx-4">
          <AdminPanelSettings 
            sx={{ fontSize: 64, color: 'error.main', mb: 3 }} 
          />
          
          <Typography variant="h5" component="h1" gutterBottom className="font-bold text-gray-800">
            Access Denied
          </Typography>
          
          <Typography variant="body1" className="text-gray-600 mb-6">
            You don't have permission to access this area. Admin privileges are required.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Home />}
            onClick={() => window.location.href = '/dashboard'}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    )
  }

  // Render children if user is admin
  return children
}

export default AdminRoute