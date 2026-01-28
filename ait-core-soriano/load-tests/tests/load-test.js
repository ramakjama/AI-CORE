/**
 * Load Test
 * Purpose: Test system under expected normal load
 * Duration: 16 minutes
 * VUs: 0-100 (ramping)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  getAuthHeaders,
  getStandardHeaders,
  randomEmail,
  thinkTime,
  checkResponse
} from '../utils/helpers.js';
import { loginUser, registerUser, getAuthToken } from '../utils/auth.js';
import env from '../config/environments.js';
import { thresholds } from '../config/thresholds.js';

// Custom metrics
const authSuccessRate = new Rate('auth_success');
const apiResponseTime = new Trend('api_response_time');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: thresholds.standard,
};

export function setup() {
  // Setup phase - create test users
  console.log('Setting up test environment...');

  const testUsers = [];
  for (let i = 0; i < 10; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';
    registerUser(email, password, `Load Test User ${i}`);
    testUsers.push({ email, password });
  }

  return { testUsers };
}

export default function (data) {
  // Select random test user
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  let token = null;

  group('Authentication Flow', () => {
    const loginResponse = loginUser(user.email, user.password);
    const success = check(loginResponse, {
      'login successful': (r) => r.status === 200,
      'has access token': (r) => r.json() && r.json().data && r.json().data.accessToken,
    });

    authSuccessRate.add(success);
    apiResponseTime.add(loginResponse.timings.duration);
    totalRequests.add(1);

    if (success && loginResponse.json().data) {
      token = loginResponse.json().data.accessToken;
    }

    thinkTime(1, 3);
  });

  if (token) {
    group('User Operations', () => {
      // Get current user
      const meResponse = http.get(
        `${env.authServiceUrl}/api/v1/auth/me`,
        getAuthHeaders(token)
      );
      checkResponse(meResponse, 200, 'Get current user');

      thinkTime(2, 5);
    });

    group('Gateway Operations', () => {
      // Check services
      const servicesResponse = http.get(
        `${env.baseUrl}/services`,
        getAuthHeaders(token)
      );
      checkResponse(servicesResponse, 200, 'Get services');

      thinkTime(1, 3);

      // Health check
      const healthResponse = http.get(`${env.baseUrl}/health`);
      checkResponse(healthResponse, 200, 'Health check');

      thinkTime(1, 2);
    });

    group('Data Operations', () => {
      // Simulate data queries (through gateway)
      const dataResponse = http.get(
        `${env.baseUrl}/api/v1/data/health`,
        getAuthHeaders(token)
      );
      check(dataResponse, {
        'data query: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      });

      thinkTime(2, 4);
    });
  }

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total test users: ${data.testUsers.length}`);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'load',
    duration: '16m',
    max_vus: 100,
    metrics: {
      http_reqs: data.metrics.http_reqs,
      http_req_duration: data.metrics.http_req_duration,
      http_req_failed: data.metrics.http_req_failed,
      vus: data.metrics.vus,
      vus_max: data.metrics.vus_max,
    },
  };

  return {
    'reports/load-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: JSON.stringify(summary, null, 2),
  };
}
