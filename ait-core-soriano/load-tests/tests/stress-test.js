/**
 * Stress Test
 * Purpose: Test system beyond normal load to find breaking points
 * Duration: 26 minutes
 * VUs: 0-300 (ramping)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  getAuthHeaders,
  randomEmail,
  thinkTime,
  checkResponse
} from '../utils/helpers.js';
import { loginUser, registerUser, getAuthToken } from '../utils/auth.js';
import env from '../config/environments.js';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const responseTime = new Trend('response_time');
const activeUsers = new Gauge('active_users');
const failedLogins = new Counter('failed_logins');
const successfulLogins = new Counter('successful_logins');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 300 },  // Ramp up to 300 users (stress)
    { duration: '5m', target: 300 },  // Stay at 300 users
    { duration: '5m', target: 0 },    // Gradual ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'], // More lenient for stress test
    http_req_failed: ['rate<0.1'],    // Allow up to 10% errors under stress
    errors: ['rate<0.15'],            // Custom error threshold
  },
};

export function setup() {
  console.log('Setting up stress test environment...');

  const testUsers = [];
  // Create more users for stress testing
  for (let i = 0; i < 50; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';

    try {
      registerUser(email, password, `Stress Test User ${i}`);
      testUsers.push({ email, password });
    } catch (error) {
      console.error(`Failed to create user ${i}: ${error}`);
    }
  }

  console.log(`Created ${testUsers.length} test users`);
  return { testUsers };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  let token = null;

  group('High-Load Authentication', () => {
    const startTime = Date.now();
    const loginResponse = loginUser(user.email, user.password);
    const duration = Date.now() - startTime;

    const success = check(loginResponse, {
      'stress login: status is 200': (r) => r.status === 200,
      'stress login: has token': (r) => r.json() && r.json().data && r.json().data.accessToken,
      'stress login: response time acceptable': (r) => r.timings.duration < 5000,
    });

    if (success) {
      successfulLogins.add(1);
      successRate.add(1);
      token = loginResponse.json().data.accessToken;
    } else {
      failedLogins.add(1);
      errorRate.add(1);
    }

    responseTime.add(duration);
  });

  if (token) {
    group('Concurrent User Operations', () => {
      // Multiple rapid requests to stress the system
      const batch = http.batch([
        ['GET', `${env.authServiceUrl}/api/v1/auth/me`, null, getAuthHeaders(token)],
        ['GET', `${env.baseUrl}/health`, null, {}],
        ['GET', `${env.baseUrl}/services`, null, getAuthHeaders(token)],
      ]);

      batch.forEach((response, index) => {
        const success = response.status === 200 || response.status === 404;
        errorRate.add(!success);
        successRate.add(success);
      });
    });

    group('High-Frequency Data Requests', () => {
      for (let i = 0; i < 5; i++) {
        const response = http.get(
          `${env.baseUrl}/health`,
          getAuthHeaders(token)
        );

        errorRate.add(response.status !== 200);
        successRate.add(response.status === 200);
      }
    });
  }

  // Minimal think time to maintain stress
  sleep(Math.random() * 2);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log(`Total users tested: ${data.testUsers.length}`);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'stress',
    duration: '26m',
    max_vus: 300,
    results: {
      total_requests: metrics.http_reqs ? metrics.http_reqs.values.count : 0,
      failed_requests: metrics.http_req_failed ? metrics.http_req_failed.values.passes : 0,
      avg_response_time: metrics.http_req_duration ? metrics.http_req_duration.values.avg : 0,
      p95_response_time: metrics.http_req_duration ? metrics.http_req_duration.values['p(95)'] : 0,
      p99_response_time: metrics.http_req_duration ? metrics.http_req_duration.values['p(99)'] : 0,
      error_rate: metrics.errors ? metrics.errors.values.rate : 0,
      successful_logins: metrics.successful_logins ? metrics.successful_logins.values.count : 0,
      failed_logins: metrics.failed_logins ? metrics.failed_logins.values.count : 0,
    },
    analysis: {
      breaking_point_reached: metrics.http_req_failed && metrics.http_req_failed.values.rate > 0.1,
      performance_degradation: metrics.http_req_duration && metrics.http_req_duration.values['p(95)'] > 5000,
    },
  };

  return {
    'reports/stress-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
