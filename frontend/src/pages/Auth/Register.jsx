import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationCity,
  Visibility,
  VisibilityOff,
  PersonAdd,
  Login as LoginIcon,
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

// Validation schema
const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  phone: yup
    .string()
    .matches(/^[\+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid phone number')
    .optional(),
  city: yup
    .string()
    .min(2, 'City must be at least 2 characters')
    .required('City is required'),
  role: yup
    .string()
    .oneOf(['user', 'admin'], 'Please select a valid role')
    .required('Role is required'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
})

const Register = () => {
  const { register: registerUser, loading, error } = useAuth()
  const navigate = useNavigate()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    watch,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'user',
      agreeToTerms: false,
    },
  })

  const watchedRole = watch('role')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    try {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: {
          city: data.city,
        },
        role: data.role,
      }

      const result = await registerUser(userData)
      
      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        // Set form errors if registration failed
        if (result.error?.includes('email')) {
          setError('email', { message: result.error })
        } else if (result.error?.includes('password')) {
          setError('password', { message: result.error })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (loading) {
    return <LoadingSpinner centered message="Setting up your account..." />
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - LocalLens</title>
        <meta name="description" content="Create your LocalLens account to start reporting and tracking local issues in your community." />
      </Helmet>

      <Box className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper elevation={3} className="p-8 rounded-2xl">
              {/* Header */}
              <Box className="text-center mb-8">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800 mb-2">
                  Join LocalLens
                </Typography>
                <Typography variant="body1" className="text-gray-600">
                  Create your account to start making a difference in your community
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" className="mb-6">
                  {error}
                </Alert>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <TextField
                    {...register('name')}
                    fullWidth
                    label="Full Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Email */}
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
                  />

                  {/* Password */}
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
                  />

                  {/* Confirm Password */}
                  <TextField
                    {...register('confirmPassword')}
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="text-gray-400" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={toggleConfirmPasswordVisibility}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Phone */}
                  <TextField
                    {...register('phone')}
                    fullWidth
                    label="Phone Number (Optional)"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* City */}
                  <TextField
                    {...register('city')}
                    fullWidth
                    label="City"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationCity className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Role Selection */}
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    {...register('role')}
                    value={watchedRole}
                    label="Account Type"
                  >
                    <MenuItem value="user">
                      <Box>
                        <Typography variant="body1">Citizen</Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Report and track local issues
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box>
                        <Typography variant="body1">Area Administrator</Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Manage reports and track resolutions
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                  {errors.role && (
                    <FormHelperText>{errors.role.message}</FormHelperText>
                  )}
                </FormControl>

                {/* Terms and Conditions */}
                <FormControlLabel
                  control={
                    <Checkbox
                      {...register('agreeToTerms')}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
                {errors.agreeToTerms && (
                  <Typography variant="body2" color="error" className="mt-1">
                    {errors.agreeToTerms.message}
                  </Typography>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!isValid || isSubmitting}
                  startIcon={isSubmitting ? <LoadingSpinner size={20} /> : <PersonAdd />}
                  className="py-3 font-semibold"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              {/* Divider */}
              <Divider className="my-8">
                <Typography variant="body2" className="text-gray-500">
                  Already have an account?
                </Typography>
              </Divider>

              {/* Sign In Link */}
              <Button
                component={Link}
                to="/login"
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<LoginIcon />}
                className="py-3 font-semibold"
              >
                Sign In Instead
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </>
  )
}

export default Register