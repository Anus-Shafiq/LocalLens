import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Report,
  Add,
  AdminPanelSettings,
  Logout,
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Header = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    handleProfileMenuClose()
  }

  const menuItems = [
    { label: 'Home', path: '/', icon: null },
    { label: 'Reports', path: '/reports', icon: <Report /> },
    ...(user ? [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { label: 'Create Report', path: '/create-report', icon: <Add /> },
      ...(isAdmin() ? [
        { label: 'Admin Panel', path: '/admin', icon: <AdminPanelSettings /> },
      ] : []),
    ] : []),
  ]

  return (
    <AppBar position="sticky" className="bg-white shadow-sm" elevation={1}>
      <Toolbar className="px-4 lg:px-8">
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          className="flex-grow font-bold text-primary-600 no-underline"
          sx={{ textDecoration: 'none', color: 'primary.main' }}
        >
          LocalLens
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box className="flex items-center space-x-4">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                startIcon={item.icon}
                className="text-gray-700 hover:text-primary-600"
              >
                {item.label}
              </Button>
            ))}
            
            {user ? (
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            ) : (
              <Box className="flex space-x-2">
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  color="primary"
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Profile Menu */}
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
            <AccountCircle className="mr-2" />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout className="mr-2" />
            Logout
          </MenuItem>
        </Menu>

        {/* Mobile Menu */}
        <Menu
          id="mobile-menu"
          anchorEl={mobileMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
        >
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => { navigate(item.path); handleMobileMenuClose(); }}
            >
              {item.icon && <Box className="mr-2">{item.icon}</Box>}
              {item.label}
            </MenuItem>
          ))}
          
          {!user && (
            <>
              <MenuItem onClick={() => { navigate('/login'); handleMobileMenuClose(); }}>
                Login
              </MenuItem>
              <MenuItem onClick={() => { navigate('/register'); handleMobileMenuClose(); }}>
                Sign Up
              </MenuItem>
            </>
          )}
          
          {user && (
            <>
              <MenuItem onClick={() => { navigate('/profile'); handleMobileMenuClose(); }}>
                <AccountCircle className="mr-2" />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleLogout(); handleMobileMenuClose(); }}>
                <Logout className="mr-2" />
                Logout
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header