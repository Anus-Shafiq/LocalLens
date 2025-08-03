import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material'
import { Home, ArrowBack } from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - LocalLens</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <Container maxWidth="md" className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Typography variant="h1" className="text-8xl font-bold text-primary-600 mb-4">
            404
          </Typography>
          
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            Page Not Found
          </Typography>
          
          <Typography variant="body1" className="text-gray-600 mb-8 max-w-md mx-auto">
            Sorry, the page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </Typography>

          <Box className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
              startIcon={<Home />}
              className="px-6 py-3"
            >
              Go Home
            </Button>
            
            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              className="px-6 py-3"
            >
              Go Back
            </Button>
          </Box>
        </motion.div>
      </Container>
    </>
  )
}

export default NotFound