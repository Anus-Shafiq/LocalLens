import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <>
      <Helmet>
        <title>Dashboard - LocalLens</title>
        <meta name="description" content="Your LocalLens dashboard - manage your reports and track community issues." />
      </Helmet>

      <Container maxWidth="lg" className="py-8">
        <Box className="text-center">
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Dashboard coming soon...
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default Dashboard