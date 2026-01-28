/**
 * Spike Test
 * Purpose: Test system behavior under sudden traffic spikes
 * Duration: 6 minutes
 * VUs: 0-500 (sudden spike)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getAuthHeaders, randomEmail, checkResponse } from '../utils/helpers.js';
import { loginUser, registerUser } from '../utils/auth.js';
import env from '../config/environments.js';

// Custom metrics
const spikeErrorRate = new Rate('spike_errors');
const spikeResponseTime = new Trend('spike_response_time');
const spikeRequests = new Counter('spike_requests');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Warm up
    { duration: '30s', target: 500 }, // Sudden spike to 500 users
    { duration: '3m', target: 500 },  // Maintain spike
    { duration: '1m', target: 50 },   // Drop back to normal
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'],  // More lenient for spike
    http_req_failed: ['rate<0.2'],      // Allow up to 20% errors during spike
    spike_errors: ['rate<0.3'],         // Spike-specific error threshold
  },
};

export function setup() {
  console.log('Setting up spike test environment...');

  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';

    try {
      registerUser(email, password, `Spike Test User ${i}`);
      testUsers.push({ email, password });
    } catch (error) {
      console.error(`Failed to create user ${i}`);
    }
  }

  return { testUsers };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];

  group('Spike Traffic Simulation', () => {
    const startTime = Date.now();

    // Try to login
    const loginResponse = loginUser(user.email, user.password);
    const duration = Date.now() - startTime;

    spikeRequests.add(1);
    spikeResponseTime.add(duration);

    const success = check(loginResponse, {
      'spike: login success or recoverable error': (r) =>
        r.status === 200 || r.status === 429 || r.status === 503,
      'spike: response received': (r) => r.body !== null,
    });

    if (loginResponse.status === 503) {
      circuitBreakerTrips.add(1);
    }

    spikeErrorRate.add(!success);

    if (loginResponse.status === 200 && loginResponse.json().data) {
      const token = loginResponse.json().data.accessToken;

      // Quick health check
      const healthResponse = http.get(`${env.baseUrl}/health`);
      spikeRequests.add(1);
      spikeErrorRate.add(healthResponse.status !== 200);
    }
  });

  // Minimal sleep to maintain spike pressure
  sleep(0.5);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'spike',
    duration: '6m',
    spike_vus: 500,
    results: {
      total_spike_requests: data.metrics.spike_requests?.values.count || 0,
      spike_error_rate: data.metrics.spike_errors?.values.rate || 0,
      circuit_breaker_trips: data.metrics.circuit_breaker_trips?.values.count || 0,
      avg_response_time: data.metrics.spike_response_time?.values.avg || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
    },
    analysis: {
      system_recovered: data.metrics.spike_errors?.values.rate < 0.3,
      circuit_breaker_activated: (data.metrics.circuit_breaker_trips?.values.count || 0) > 0,
    },
  };

  return {
    'reports/spike-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
