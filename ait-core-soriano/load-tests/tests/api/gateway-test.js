/**
 * API Gateway Load Test
 * Purpose: Test gateway routing, circuit breaker, rate limiting
 * Focus: Service routing, health checks, circuit breaker behavior
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getAuthHeaders, randomEmail } from '../../utils/helpers.js';
import { getAuthToken, registerUser } from '../../utils/auth.js';
import env from '../../config/environments.js';

// Gateway-specific metrics
const routingSuccessRate = new Rate('routing_success');
const circuitBreakerOpen = new Counter('circuit_breaker_open');
const rateLimitExceeded = new Counter('rate_limit_exceeded');
const serviceAvailability = new Rate('service_availability');
const gatewayResponseTime = new Trend('gateway_response_time');

export const options = {
  stages: [
    { duration: '1m', target: 30 },
    { duration: '3m', target: 80 },
    { duration: '3m', target: 150 },
    { duration: '2m', target: 200 }, // Push gateway limits
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    routing_success: ['rate>0.95'],
    service_availability: ['rate>0.99'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  console.log('Setting up gateway test...');

  const testUsers = [];
  for (let i = 0; i < 20; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';
    registerUser(email, password, `Gateway Test User ${i}`);
    testUsers.push({ email, password });
  }

  return { testUsers };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  const token = getAuthToken(user.email, user.password);

  group('Gateway Health Checks', () => {
    const healthResponse = http.get(`${env.baseUrl}/health`);

    const healthSuccess = check(healthResponse, {
      'health: status is 200': (r) => r.status === 200,
      'health: success is true': (r) => r.json() && r.json().success === true,
      'health: has uptime': (r) => r.json() && r.json().uptime !== undefined,
    });

    serviceAvailability.add(healthSuccess);
    gatewayResponseTime.add(healthResponse.timings.duration);

    sleep(1);
  });

  group('Gateway Readiness', () => {
    const readyResponse = http.get(`${env.baseUrl}/health/ready`);

    check(readyResponse, {
      'ready: status is 200': (r) => r.status === 200,
      'ready: redis connected': (r) => r.json() && r.json().redis === 'connected',
      'ready: has services status': (r) => r.json() && r.json().services,
    });

    sleep(1);
  });

  group('Service Discovery', () => {
    const servicesResponse = http.get(`${env.baseUrl}/services`);

    const discoverySuccess = check(servicesResponse, {
      'services: status is 200': (r) => r.status === 200,
      'services: has service list': (r) => r.json() && r.json().services,
      'services: auth service available': (r) => {
        const services = r.json()?.services || [];
        return services.some(s => s.name === 'auth' && s.status === 'available');
      },
    });

    routingSuccessRate.add(discoverySuccess);

    sleep(1);
  });

  if (token) {
    group('Gateway Routing - Auth Service', () => {
      const startTime = Date.now();
      const authResponse = http.get(
        `${env.baseUrl}/api/v1/auth/me`,
        getAuthHeaders(token)
      );
      const duration = Date.now() - startTime;

      const routingSuccess = check(authResponse, {
        'routing auth: status is 200': (r) => r.status === 200,
        'routing auth: has X-Proxied-By header': (r) => r.headers['X-Proxied-By'] === 'AIT-Gateway',
        'routing auth: response time acceptable': (r) => r.timings.duration < 3000,
      });

      routingSuccessRate.add(routingSuccess);
      gatewayResponseTime.add(duration);

      if (authResponse.status === 503) {
        circuitBreakerOpen.add(1);
      }

      sleep(1);
    });

    group('Gateway Routing - DataHub Service', () => {
      const dataResponse = http.get(
        `${env.baseUrl}/api/v1/data/health`,
        getAuthHeaders(token)
      );

      const routingSuccess = check(dataResponse, {
        'routing data: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      });

      routingSuccessRate.add(routingSuccess);

      if (dataResponse.status === 503) {
        circuitBreakerOpen.add(1);
      }

      sleep(1);
    });

    group('Rate Limit Testing', () => {
      // Make rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        const rapidResponse = http.get(`${env.baseUrl}/health`);

        if (rapidResponse.status === 429) {
          rateLimitExceeded.add(1);
          check(rapidResponse, {
            'rate limit: has error message': (r) => r.json() && r.json().error,
          });
          break; // Stop if rate limited
        }
      }

      sleep(2);
    });
  }

  group('Gateway Metrics', () => {
    const metricsResponse = http.get(`${env.baseUrl}/metrics`);

    check(metricsResponse, {
      'metrics: status is 200': (r) => r.status === 200,
      'metrics: has prometheus format': (r) => r.body && r.body.includes('# TYPE'),
    });
  });

  sleep(2);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'gateway',
    service: 'API Gateway',
    results: {
      total_requests: data.metrics.http_reqs?.values.count || 0,
      routing_success_rate: data.metrics.routing_success?.values.rate || 0,
      service_availability_rate: data.metrics.service_availability?.values.rate || 0,
      circuit_breaker_trips: data.metrics.circuit_breaker_open?.values.count || 0,
      rate_limit_exceeded: data.metrics.rate_limit_exceeded?.values.count || 0,
      avg_gateway_response_time: data.metrics.gateway_response_time?.values.avg || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
    },
    analysis: {
      gateway_healthy: (data.metrics.service_availability?.values.rate || 0) > 0.99,
      rate_limiting_active: (data.metrics.rate_limit_exceeded?.values.count || 0) > 0,
      circuit_breaker_triggered: (data.metrics.circuit_breaker_open?.values.count || 0) > 0,
    },
  };

  return {
    'reports/gateway-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
