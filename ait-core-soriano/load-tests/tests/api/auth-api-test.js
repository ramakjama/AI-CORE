/**
 * Authentication API Load Test
 * Purpose: Comprehensive testing of authentication endpoints
 * Focus: Login, Register, Refresh, Logout, MFA
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  getAuthHeaders,
  getStandardHeaders,
  randomEmail,
  randomString,
} from '../../utils/helpers.js';
import env from '../../config/environments.js';

// Auth-specific metrics
const loginSuccessRate = new Rate('login_success');
const registerSuccessRate = new Rate('register_success');
const tokenRefreshSuccessRate = new Rate('token_refresh_success');
const mfaVerificationRate = new Rate('mfa_verification_success');
const rateLimitHits = new Counter('rate_limit_hits');

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    login_success: ['rate>0.95'],           // 95% success rate
    register_success: ['rate>0.9'],         // 90% success rate
    token_refresh_success: ['rate>0.98'],   // 98% success rate
    http_req_duration: ['p(95)<1500'],      // Auth should be fast
  },
};

export default function () {
  const email = randomEmail();
  const password = 'TestPassword123!';
  const name = `Test User ${randomString(5)}`;

  group('User Registration', () => {
    const registerPayload = JSON.stringify({
      email: email,
      password: password,
      name: name,
    });

    const registerResponse = http.post(
      `${env.authServiceUrl}/api/v1/auth/register`,
      registerPayload,
      getStandardHeaders()
    );

    const registerSuccess = check(registerResponse, {
      'register: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'register: has user data': (r) => r.json() && r.json().data,
      'register: response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    registerSuccessRate.add(registerSuccess);

    if (registerResponse.status === 429) {
      rateLimitHits.add(1);
    }

    sleep(1);
  });

  group('User Login', () => {
    const loginPayload = JSON.stringify({
      email: email,
      password: password,
    });

    const loginResponse = http.post(
      `${env.authServiceUrl}/api/v1/auth/login`,
      loginPayload,
      getStandardHeaders()
    );

    const loginSuccess = check(loginResponse, {
      'login: status is 200': (r) => r.status === 200,
      'login: has access token': (r) => r.json() && r.json().data && r.json().data.accessToken,
      'login: has refresh token': (r) => r.json() && r.json().data && r.json().data.refreshToken,
      'login: has user info': (r) => r.json() && r.json().data && r.json().data.user,
      'login: response time < 1500ms': (r) => r.timings.duration < 1500,
    });

    loginSuccessRate.add(loginSuccess);

    if (loginResponse.status === 429) {
      rateLimitHits.add(1);
    }

    if (loginSuccess) {
      const { accessToken, refreshToken } = loginResponse.json().data;

      sleep(2);

      group('Get Current User', () => {
        const meResponse = http.get(
          `${env.authServiceUrl}/api/v1/auth/me`,
          getAuthHeaders(accessToken)
        );

        check(meResponse, {
          'me: status is 200': (r) => r.status === 200,
          'me: has user data': (r) => r.json() && r.json().data && r.json().data.user,
          'me: email matches': (r) => r.json() && r.json().data && r.json().data.user.email === email,
        });

        sleep(1);
      });

      group('Token Refresh', () => {
        const refreshPayload = JSON.stringify({
          refreshToken: refreshToken,
        });

        const refreshResponse = http.post(
          `${env.authServiceUrl}/api/v1/auth/refresh`,
          refreshPayload,
          getStandardHeaders()
        );

        const refreshSuccess = check(refreshResponse, {
          'refresh: status is 200': (r) => r.status === 200,
          'refresh: has new access token': (r) => r.json() && r.json().data && r.json().data.accessToken,
          'refresh: response time < 1000ms': (r) => r.timings.duration < 1000,
        });

        tokenRefreshSuccessRate.add(refreshSuccess);

        sleep(1);
      });

      group('User Logout', () => {
        const logoutResponse = http.post(
          `${env.authServiceUrl}/api/v1/auth/logout`,
          null,
          getAuthHeaders(accessToken)
        );

        check(logoutResponse, {
          'logout: status is 200': (r) => r.status === 200,
          'logout: success is true': (r) => r.json() && r.json().success === true,
        });
      });
    }
  });

  sleep(2);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'auth_api',
    service: 'Authentication Service',
    results: {
      total_requests: data.metrics.http_reqs?.values.count || 0,
      login_success_rate: data.metrics.login_success?.values.rate || 0,
      register_success_rate: data.metrics.register_success?.values.rate || 0,
      token_refresh_success_rate: data.metrics.token_refresh_success?.values.rate || 0,
      rate_limit_hits: data.metrics.rate_limit_hits?.values.count || 0,
      avg_response_time: data.metrics.http_req_duration?.values.avg || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
    },
  };

  return {
    'reports/auth-api-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
