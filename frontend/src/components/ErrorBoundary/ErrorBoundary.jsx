import React from 'react'
import { Box, Typography, Button, Container } from '@mui/material'
import { ErrorOutline, Refresh } from '@mui/icons-material'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" className="min-h-screen flex items-center justify-center">
          <Box className="text-center p-8">
            <ErrorOutline 
              sx={{ fontSize: 80, color: 'error.main', mb: 3 }} 
            />
            
            <Typography variant="h4" component="h1" gutterBottom className="font-bold text-gray-800">
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" className="text-gray-600 mb-6 max-w-md mx-auto">
              We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
            </Typography>

            <Box className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                size="large"
              >
                Refresh Page
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={this.handleGoHome}
                size="large"
              >
                Go to Home
              </Button>
            </Box>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
                <Typography variant="h6" className="font-semibold mb-2 text-red-600">
                  Error Details (Development Only):
                </Typography>
                <Typography variant="body2" component="pre" className="text-xs text-gray-700 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary