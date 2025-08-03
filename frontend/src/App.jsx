import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

// Context
import { useAuth } from './contexts/AuthContext'
import { useLoading } from './contexts/LoadingContext'

// Components
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/UI/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Auth/AdminRoute'

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home/Home'))
const Login = React.lazy(() => import('./pages/Auth/Login'))
const Register = React.lazy(() => import('./pages/Auth/Register'))
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Reports = React.lazy(() => import('./pages/Reports/Reports'))
const ReportDetail = React.lazy(() => import('./pages/Reports/ReportDetail'))
const CreateReport = React.lazy(() => import('./pages/Reports/CreateReport'))
const Profile = React.lazy(() => import('./pages/Profile/Profile'))
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminReports = React.lazy(() => import('./pages/Admin/AdminReports'))
const AdminUsers = React.lazy(() => import('./pages/Admin/AdminUsers'))
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'))

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
}

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="large" />
  </div>
)

// Animated page wrapper
const AnimatedPage = ({ children }) => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const { isLoading } = useLoading()
  const location = useLocation()

  // Show loading spinner while auth is being determined
  if (authLoading) {
    return <PageLoadingFallback />
  }

  // Show global loading overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
          <LoadingSpinner />
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <Layout>
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Home />
                  </Suspense>
                </AnimatedPage>
              </Layout>
            }
          />
          
          <Route
            path="/reports"
            element={
              <Layout>
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Reports />
                  </Suspense>
                </AnimatedPage>
              </Layout>
            }
          />
          
          <Route
            path="/reports/:id"
            element={
              <Layout>
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ReportDetail />
                  </Suspense>
                </AnimatedPage>
              </Layout>
            }
          />

          {/* Auth routes - redirect if already logged in */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Login />
                  </Suspense>
                </AnimatedPage>
              )
            }
          />
          
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Register />
                  </Suspense>
                </AnimatedPage>
              )
            }
          />

          {/* Protected routes - require authentication */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create-report"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <CreateReport />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Profile />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes - require admin role */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminReports />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Layout>
                  <AnimatedPage>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminUsers />
                    </Suspense>
                  </AnimatedPage>
                </Layout>
              </AdminRoute>
            }
          />

          {/* 404 route */}
          <Route
            path="*"
            element={
              <Layout>
                <AnimatedPage>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <NotFound />
                  </Suspense>
                </AnimatedPage>
              </Layout>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App