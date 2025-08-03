import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

const Profile = () => {
  return (
    <>
      <Helmet>
        <title>Profile - LocalLens</title>
      </Helmet>

      <Container maxWidth="lg" className="py-8">
        <Box className="text-center">
          <Typography variant="h4" className="font-bold text-gray-800 mb-4">
            User Profile
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Profile management coming soon...
          </Typography>
        </Box>
      </Container>
    </>
  )
}

export default Profile