import React from 'react'
import { Box } from '@mui/material'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children, hideHeader = false, hideFooter = false }) => {
  return (
    <Box className="min-h-screen flex flex-col bg-gray-50">
      {!hideHeader && <Header />}
      
      <Box component="main" className="flex-1">
        {children}
      </Box>
      
      {!hideFooter && <Footer />}
    </Box>
  )
}

export default Layout