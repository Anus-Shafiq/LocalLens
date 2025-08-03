import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

const AdminDashboard = () => {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - LocalLens</title>
      </Helmet>

      <Container maxWidth="lg" className="py-8">
        <Box className="text-center">
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            Admin Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Admin dashboard coming soon...
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default AdminDashboard