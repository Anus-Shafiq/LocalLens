const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123',
  city: 'Test City',
  role: 'user'
};

// Test functions
async function testHealthCheck() {
  try {
    console.log('🔍 Testing health check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    console.log('🔍 Testing user registration...');
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    console.log('✅ User registration passed');
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === 'USER_EXISTS') {
      console.log('ℹ️ User already exists, skipping registration');
      return null;
    }
    console.error('❌ User registration failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUserLogin() {
  try {
    console.log('🔍 Testing user login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    console.log('✅ User login passed');
    return response.data;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProtectedRoute(token) {
  try {
    console.log('🔍 Testing protected route...');
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route access passed');
    return response.data;
  } catch (error) {
    console.error('❌ Protected route access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testReportsEndpoint(token) {
  try {
    console.log('🔍 Testing reports endpoint...');
    const response = await axios.get(`${API_BASE_URL}/reports`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    console.log('✅ Reports endpoint passed');
    return response.data;
  } catch (error) {
    console.error('❌ Reports endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

async function testInvalidRoute() {
  try {
    console.log('🔍 Testing invalid route (should return 404)...');
    await axios.get(`${API_BASE_URL}/invalid-route`);
    console.error('❌ Invalid route test failed - should have returned 404');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Invalid route correctly returned 404');
      return true;
    }
    console.error('❌ Invalid route test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting LocalLens Backend Tests\n');
  
  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    protectedRoute: false,
    reportsEndpoint: false,
    invalidRoute: false
  };

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  console.log('');

  if (!results.healthCheck) {
    console.error('❌ Backend is not running. Please start the server first.');
    process.exit(1);
  }

  // Test 2: User Registration
  const registrationResult = await testUserRegistration();
  results.registration = registrationResult !== false;
  console.log('');

  // Test 3: User Login
  const loginResult = await testUserLogin();
  results.login = loginResult !== false;
  console.log('');

  let token = null;
  if (loginResult && loginResult.token) {
    token = loginResult.token;
  }

  // Test 4: Protected Route
  if (token) {
    results.protectedRoute = await testProtectedRoute(token);
    console.log('');
  }

  // Test 5: Reports Endpoint
  results.reportsEndpoint = await testReportsEndpoint(token);
  console.log('');

  // Test 6: Invalid Route (404 test)
  results.invalidRoute = await testInvalidRoute();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the backend configuration.');
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});