import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

const Reports = () => {
  return (
    <>
      <Helmet>
        <title>Community Reports - LocalLens</title>
        <meta name="description" content="Browse and view community reports in your area." />
      </Helmet>

      <Container maxWidth="lg" className="py-8">
        <Box className="text-center">
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            Community Reports
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Reports listing coming soon...
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default Reports