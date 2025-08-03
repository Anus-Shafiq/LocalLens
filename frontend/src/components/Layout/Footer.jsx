import React from 'react'
import { Box, Typography, Container, Link, Grid } from '@mui/material'
import { GitHub, Twitter, LinkedIn, Email } from '@mui/icons-material'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <Box component="footer" className="bg-gray-800 text-white mt-auto">
      <Container maxWidth="lg" className="py-8">
        <Grid container spacing={4}>
          {/* About Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" className="font-bold mb-3">
              LocalLens
            </Typography>
            <Typography variant="body2" className="text-gray-300 mb-3">
              Empowering communities to report and track local issues. 
              Making neighborhoods better, one report at a time.
            </Typography>
            <Box className="flex space-x-2">
              <Link href="#" color="inherit" aria-label="GitHub">
                <GitHub />
              </Link>
              <Link href="#" color="inherit" aria-label="Twitter">
                <Twitter />
              </Link>
              <Link href="#" color="inherit" aria-label="LinkedIn">
                <LinkedIn />
              </Link>
              <Link href="#" color="inherit" aria-label="Email">
                <Email />
              </Link>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" className="font-semibold mb-3">
              Quick Links
            </Typography>
            <Box className="flex flex-col space-y-2">
              <Link href="/" color="inherit" className="text-gray-300 hover:text-white">
                Home
              </Link>
              <Link href="/reports" color="inherit" className="text-gray-300 hover:text-white">
                Reports
              </Link>
              <Link href="/dashboard" color="inherit" className="text-gray-300 hover:text-white">
                Dashboard
              </Link>
              <Link href="/create-report" color="inherit" className="text-gray-300 hover:text-white">
                Create Report
              </Link>
            </Box>
          </Grid>

          {/* Support */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" className="font-semibold mb-3">
              Support
            </Typography>
            <Box className="flex flex-col space-y-2">
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Help Center
              </Link>
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Contact Us
              </Link>
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                FAQ
              </Link>
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Guidelines
              </Link>
            </Box>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" className="font-semibold mb-3">
              Legal
            </Typography>
            <Box className="flex flex-col space-y-2">
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Terms of Service
              </Link>
              <Link href="#" color="inherit" className="text-gray-300 hover:text-white">
                Cookie Policy
              </Link>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" className="font-semibold mb-3">
              Contact
            </Typography>
            <Box className="flex flex-col space-y-2 text-gray-300">
              <Typography variant="body2">
                support@locallens.app
              </Typography>
              <Typography variant="body2">
                +1 (555) 123-4567
              </Typography>
              <Typography variant="body2">
                Available 24/7
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Section */}
        <Box className="border-t border-gray-700 mt-8 pt-6">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="text-gray-400">
                © {currentYear} LocalLens. All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="text-gray-400 text-right">
                Built with ❤️ for better communities
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer