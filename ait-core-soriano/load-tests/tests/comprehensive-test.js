/**
 * Comprehensive Load Test
 * Purpose: Test all services and endpoints in a single comprehensive suite
 * Duration: 20 minutes
 * VUs: 0-120 (ramping)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  getAuthHeaders,
  getStandardHeaders,
  randomEmail,
  thinkTime,
} from '../utils/helpers.js';
import { setupAuth, loginUser, registerUser } from '../utils/auth.js';
import env from '../config/environments.js';

// Comprehensive metrics
const endpointSuccessRate = new Rate('endpoint_success');
const serviceHealthRate = new Rate('service_health');
const overallSystemHealth = new Rate('system_health');
const endpointCalls = new Counter('endpoint_calls');

export const options = {
  stages: [
    { duration: '3m', target: 40 },
    { duration: '7m', target: 80 },
    { duration: '5m', target: 120 },
    { duration: '3m', target: 60 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    endpoint_success: ['rate>0.9'],
    service_health: ['rate>0.95'],
    system_health: ['rate>0.95'],
    http_req_duration: ['p(95)<3000'],
  },
};

export function setup() {
  console.log('Starting comprehensive load test...');

  const testUsers = [];
  for (let i = 0; i < 30; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';

    try {
      registerUser(email, password, `Comprehensive Test User ${i}`);
      testUsers.push({ email, password });
    } catch (error) {
      console.error(`Setup error for user ${i}`);
    }
  }

  return { testUsers };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  let systemHealthy = true;

  // Test all service health endpoints
  group('Service Health Checks', () => {
    const healthChecks = [
      { name: 'Gateway', url: `${env.baseUrl}/health` },
      { name: 'Gateway Ready', url: `${env.baseUrl}/health/ready` },
      { name: 'Auth Service', url: `${env.authServiceUrl}/api/v1/health` },
    ];

    for (const healthCheck of healthChecks) {
      const response = http.get(healthCheck.url);
      endpointCalls.add(1);

      const success = check(response, {
        [`${healthCheck.name}: healthy`]: (r) => r.status === 200,
      });

      serviceHealthRate.add(success);
      if (!success) systemHealthy = false;
    }

    sleep(1);
  });

  // Test authentication workflows
  group('Authentication Workflows', () => {
    const loginResponse = loginUser(user.email, user.password);
    endpointCalls.add(1);

    const loginSuccess = check(loginResponse, {
      'comprehensive: login success': (r) => r.status === 200,
    });

    endpointSuccessRate.add(loginSuccess);
    if (!loginSuccess) systemHealthy = false;

    if (loginSuccess && loginResponse.json().data) {
      const token = loginResponse.json().data.accessToken;

      thinkTime(1, 2);

      // Test authenticated endpoints
      const meResponse = http.get(
        `${env.authServiceUrl}/api/v1/auth/me`,
        getAuthHeaders(token)
      );
      endpointCalls.add(1);

      const meSuccess = check(meResponse, {
        'comprehensive: get user success': (r) => r.status === 200,
      });

      endpointSuccessRate.add(meSuccess);
      if (!meSuccess) systemHealthy = false;

      thinkTime(2, 4);

      // Test gateway routing
      group('Gateway Routing', () => {
        const routes = [
          { name: 'Services', path: '/services' },
          { name: 'Metrics', path: '/metrics' },
        ];

        routes.forEach(route => {
          const response = http.get(`${env.baseUrl}${route.path}`);
          endpointCalls.add(1);

          const success = check(response, {
            [`comprehensive: ${route.name} accessible`]: (r) => r.status === 200,
          });

          endpointSuccessRate.add(success);
          if (!success) systemHealthy = false;

          sleep(0.5);
        });
      });

      thinkTime(1, 2);

      // Test proxied services through gateway
      group('Proxied Services', () => {
        const proxiedEndpoints = [
          { service: 'Auth', url: `${env.baseUrl}/api/v1/auth/me` },
          { service: 'DataHub', url: `${env.baseUrl}/api/v1/data/health` },
        ];

        proxiedEndpoints.forEach(endpoint => {
          const response = http.get(endpoint.url, getAuthHeaders(token));
          endpointCalls.add(1);

          const success = check(response, {
            [`comprehensive: ${endpoint.service} proxy works`]: (r) =>
              r.status === 200 || r.status === 404,
          });

          endpointSuccessRate.add(success);

          sleep(0.5);
        });
      });
    }
  });

  // Overall system health
  overallSystemHealth.add(systemHealthy);

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'comprehensive',
    duration: '20 minutes',
    max_vus: 120,
    coverage: {
      services_tested: ['API Gateway', 'Auth Service', 'DataHub Service'],
      endpoints_tested: [
        '/health',
        '/health/ready',
        '/services',
        '/metrics',
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/me',
        '/api/v1/data/health',
      ],
    },
    results: {
      total_endpoint_calls: data.metrics.endpoint_calls?.values.count || 0,
      endpoint_success_rate: data.metrics.endpoint_success?.values.rate || 0,
      service_health_rate: data.metrics.service_health?.values.rate || 0,
      overall_system_health: data.metrics.system_health?.values.rate || 0,
      total_requests: data.metrics.http_reqs?.values.count || 0,
      error_rate: data.metrics.http_req_failed?.values.rate || 0,
      avg_response_time: data.metrics.http_req_duration?.values.avg || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
      p99_response_time: data.metrics.http_req_duration?.values['p(99)'] || 0,
    },
    assessment: {
      all_services_healthy: (data.metrics.service_health?.values.rate || 0) > 0.95,
      all_endpoints_working: (data.metrics.endpoint_success?.values.rate || 0) > 0.9,
      system_stable: (data.metrics.system_health?.values.rate || 0) > 0.95,
      performance_acceptable: (data.metrics.http_req_duration?.values['p(95)'] || 0) < 3000,
    },
  };

  return {
    'reports/comprehensive-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
