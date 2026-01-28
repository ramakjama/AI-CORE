/**
 * Smoke Test
 * Purpose: Verify that the system works under minimal load
 * Duration: 1 minute
 * VUs: 1-2
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getStandardHeaders } from '../utils/helpers.js';
import env from '../config/environments.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<3000'], // 99% of requests should be below 3s
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
  },
};

export default function () {
  group('Health Checks', () => {
    // Gateway health check
    const gatewayHealth = http.get(`${env.baseUrl}/health`);
    check(gatewayHealth, {
      'gateway health: status is 200': (r) => r.status === 200,
      'gateway health: success is true': (r) => r.json().success === true,
    });

    sleep(1);

    // Gateway readiness check
    const gatewayReady = http.get(`${env.baseUrl}/health/ready`);
    check(gatewayReady, {
      'gateway ready: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // Auth service health
    const authHealth = http.get(`${env.authServiceUrl}/api/v1/health`);
    check(authHealth, {
      'auth health: status is 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('Service Discovery', () => {
    const services = http.get(`${env.baseUrl}/services`);
    check(services, {
      'services: status is 200': (r) => r.status === 200,
      'services: has service list': (r) => r.json().success && r.json().services,
    });

    sleep(1);
  });

  group('Gateway Metrics', () => {
    const metrics = http.get(`${env.baseUrl}/metrics`);
    check(metrics, {
      'metrics: status is 200': (r) => r.status === 200,
      'metrics: has content': (r) => r.body && r.body.length > 0,
    });

    sleep(1);
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'reports/smoke-test-summary.json': JSON.stringify(data, null, 2),
  };
}
