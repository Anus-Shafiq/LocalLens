import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material'
import {
  Report,
  Dashboard,
  AdminPanelSettings,
  TrendingUp,
  People,
  LocationOn,
} from '@mui/icons-material'
import { Helmet } from 'react-helmet-async'

import { useAuth } from '../../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <Report className="text-primary-600" />,
      title: 'Report Issues',
      description: 'Easily report local problems like potholes, broken streetlights, or garbage collection issues.',
    },
    {
      icon: <Dashboard className="text-primary-600" />,
      title: 'Track Progress',
      description: 'Monitor the status of your reports and see how your community issues are being resolved.',
    },
    {
      icon: <People className="text-primary-600" />,
      title: 'Community Engagement',
      description: 'Connect with neighbors and work together to improve your local area.',
    },
    {
      icon: <AdminPanelSettings className="text-primary-600" />,
      title: 'Admin Dashboard',
      description: 'Area administrators can efficiently manage and resolve community reports.',
    },
    {
      icon: <TrendingUp className="text-primary-600" />,
      title: 'Analytics',
      description: 'Get insights into community issues and track improvement trends over time.',
    },
    {
      icon: <LocationOn className="text-primary-600" />,
      title: 'Location-Based',
      description: 'Reports are organized by location, making it easy to focus on your specific area.',
    },
  ]

  const stats = [
    { number: '10,000+', label: 'Reports Submitted' },
    { number: '8,500+', label: 'Issues Resolved' },
    { number: '500+', label: 'Active Communities' },
    { number: '95%', label: 'User Satisfaction' },
  ]

  return (
    <>
      <Helmet>
        <title>LocalLens - Hyperlocal Issue Reporting Platform</title>
        <meta name="description" content="Report and track local issues in your community. Help make your neighborhood better with LocalLens." />
      </Helmet>

      {/* Hero Section */}
      <Box className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Typography variant="h2" component="h1" className="font-bold text-gray-800 mb-6">
              Make Your Community Better
            </Typography>
            <Typography variant="h5" className="text-gray-600 mb-8 max-w-3xl mx-auto">
              LocalLens empowers citizens to report local issues and track their resolution. 
              Join thousands of community members making a real difference.
            </Typography>
            
            <Box className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    className="px-8 py-3 font-semibold"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    component={Link}
                    to="/create-report"
                    variant="outlined"
                    size="large"
                    className="px-8 py-3 font-semibold"
                  >
                    Report an Issue
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    size="large"
                    className="px-8 py-3 font-semibold"
                  >
                    Get Started
                  </Button>
                  <Button
                    component={Link}
                    to="/reports"
                    variant="outlined"
                    size="large"
                    className="px-8 py-3 font-semibold"
                  >
                    View Reports
                  </Button>
                </>
              )}
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box className="py-16 bg-white">
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <Typography variant="h3" className="font-bold text-primary-600 mb-2">
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" className="text-gray-600">
                    {stat.label}
                  </Typography>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className="py-20 bg-gray-50">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Typography variant="h3" component="h2" className="font-bold text-gray-800 mb-4">
              Everything You Need
            </Typography>
            <Typography variant="h6" className="text-gray-600 max-w-2xl mx-auto">
              LocalLens provides all the tools you need to report issues, track progress, 
              and make a real impact in your community.
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <Avatar className="bg-primary-100 mb-4" sx={{ width: 56, height: 56 }}>
                        {feature.icon}
                      </Avatar>
                      <Typography variant="h6" className="font-semibold mb-2">
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="py-20 bg-primary-600">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Typography variant="h3" component="h2" className="font-bold text-white mb-4">
              Ready to Make a Difference?
            </Typography>
            <Typography variant="h6" className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Join our community of engaged citizens working together to improve local neighborhoods.
            </Typography>
            
            {!user && (
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 font-semibold"
              >
                Sign Up Today
              </Button>
            )}
          </motion.div>
        </Container>
      </Box>
    </>
  )
}

export default Home