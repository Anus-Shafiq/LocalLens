import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
} from '@mui/material'
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const Login = () => {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    try {
      const result = await login(data.email, data.password)
      
      if (result.success) {
        navigate(from, { replace: true })
      } else {
        // Set form errors if login failed
        if (result.error?.includes('email')) {
          setError('email', { message: result.error })
        } else if (result.error?.includes('password')) {
          setError('password', { message: result.error })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (loading) {
    return <LoadingSpinner centered message="Checking authentication..." />
  }

  return (
    <>
      <Helmet>
        <title>Login - LocalLens</title>
        <meta name="description" content="Sign in to your LocalLens account to report and track local issues in your community." />
      </Helmet>

      <Box className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper elevation={3} className="p-8 rounded-2xl">
              {/* Header */}
              <Box className="text-center mb-8">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800 mb-2">
                  Welcome Back
                </Typography>
                <Typography variant="body1" className="text-gray-600">
                  Sign in to your LocalLens account
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" className="mb-6">
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <TextField
                  {...register('email')}
                  fullWidth
                  label="Email Address"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  className="bg-white"
                />

                {/* Password Field */}
                <TextField
                  {...register('password')}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock className="text-gray-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  className="bg-white"
                />

                {/* Forgot Password Link */}
                <Box className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Forgot your password?
                  </Link>
                </Box>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!isValid || isSubmitting}
                  startIcon={isSubmitting ? <LoadingSpinner size={20} /> : <LoginIcon />}
                  className="py-3 font-semibold"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <Divider className="my-8">
                <Typography variant="body2" className="text-gray-500">
                  Don't have an account?
                </Typography>
              </Divider>

              {/* Sign Up Link */}
              <Button
                component={Link}
                to="/register"
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<PersonAdd />}
                className="py-3 font-semibold"
              >
                Create New Account
              </Button>

              {/* Demo Accounts */}
              <Box className="mt-8 p-4 bg-gray-50 rounded-lg">
                <Typography variant="body2" className="font-semibold text-gray-700 mb-2">
                  Demo Accounts:
                </Typography>
                <Typography variant="body2" className="text-gray-600 text-xs">
                  <strong>User:</strong> user@demo.com / password123<br />
                  <strong>Admin:</strong> admin@demo.com / password123
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </>
  )
}

export default Login