import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

const CreateReport = () => {
  return (
    <>
      <Helmet>
        <title>Create Report - LocalLens</title>
      </Helmet>

      <Container maxWidth="lg" className="py-8">
        <Box className="text-center">
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            Create New Report
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Report creation form coming soon...
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default CreateReport