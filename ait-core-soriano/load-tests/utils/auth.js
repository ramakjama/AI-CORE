import http from 'k6/http';
import { check } from 'k6';
import { getStandardHeaders, extractToken, randomEmail } from './helpers.js';
import env from '../config/environments.js';

/**
 * Register a new user
 */
export function registerUser(email, password, name) {
  const payload = JSON.stringify({
    email: email || randomEmail(),
    password: password || 'TestPassword123!',
    name: name || 'Test User',
  });

  const response = http.post(
    `${env.authServiceUrl}/api/v1/auth/register`,
    payload,
    getStandardHeaders()
  );

  check(response, {
    'register: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  return response;
}

/**
 * Login user and get token
 */
export function loginUser(email, password) {
  const payload = JSON.stringify({
    email: email || __ENV.TEST_USER_EMAIL || 'test@ait-core.com',
    password: password || __ENV.TEST_USER_PASSWORD || 'TestPassword123!',
  });

  const response = http.post(
    `${env.authServiceUrl}/api/v1/auth/login`,
    payload,
    getStandardHeaders()
  );

  check(response, {
    'login: status is 200': (r) => r.status === 200,
    'login: has token': (r) => r.json() && r.json().data && r.json().data.accessToken,
  });

  return response;
}

/**
 * Get authentication token
 */
export function getAuthToken(email, password) {
  const response = loginUser(email, password);
  return extractToken(response);
}

/**
 * Refresh authentication token
 */
export function refreshToken(refreshToken) {
  const payload = JSON.stringify({
    refreshToken: refreshToken,
  });

  const response = http.post(
    `${env.authServiceUrl}/api/v1/auth/refresh`,
    payload,
    getStandardHeaders()
  );

  check(response, {
    'refresh: status is 200': (r) => r.status === 200,
    'refresh: has new token': (r) => r.json() && r.json().data && r.json().data.accessToken,
  });

  return response;
}

/**
 * Logout user
 */
export function logoutUser(token) {
  const response = http.post(
    `${env.authServiceUrl}/api/v1/auth/logout`,
    null,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(response, {
    'logout: status is 200': (r) => r.status === 200,
  });

  return response;
}

/**
 * Get current user info
 */
export function getCurrentUser(token) {
  const response = http.get(
    `${env.authServiceUrl}/api/v1/auth/me`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(response, {
    'me: status is 200': (r) => r.status === 200,
    'me: has user data': (r) => r.json() && r.json().data && r.json().data.user,
  });

  return response;
}

/**
 * Setup authentication for test session
 */
export function setupAuth() {
  const email = randomEmail();
  const password = 'TestPassword123!';

  // Register
  registerUser(email, password, 'Load Test User');

  // Login and get token
  const token = getAuthToken(email, password);

  return { email, password, token };
}

export default {
  registerUser,
  loginUser,
  getAuthToken,
  refreshToken,
  logoutUser,
  getCurrentUser,
  setupAuth,
};
