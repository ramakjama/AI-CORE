/**
 * Soak Test (Endurance Test)
 * Purpose: Test system stability over extended period
 * Duration: 2 hours 10 minutes
 * VUs: 100 (sustained)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getAuthHeaders, randomEmail, thinkTime } from '../utils/helpers.js';
import { loginUser, registerUser } from '../utils/auth.js';
import env from '../config/environments.js';

// Custom metrics for long-running test
const memoryLeakIndicator = new Trend('response_time_trend');
const errorRateTrend = new Rate('error_rate_trend');
const degradationCounter = new Counter('performance_degradation');

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up
    { duration: '2h', target: 100 },   // Sustained load for 2 hours
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<6000'],
    http_req_failed: ['rate<0.02'],  // Maximum 2% error rate
    error_rate_trend: ['rate<0.03'], // Should not increase over time
  },
};

export function setup() {
  console.log('Setting up soak test - this will run for 2+ hours...');

  const testUsers = [];
  for (let i = 0; i < 50; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';

    try {
      registerUser(email, password, `Soak Test User ${i}`);
      testUsers.push({ email, password });
    } catch (error) {
      console.error(`Failed to create user ${i}`);
    }
  }

  return {
    testUsers,
    startTime: Date.now(),
  };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  const elapsedMinutes = (Date.now() - data.startTime) / 1000 / 60;

  group('Sustained User Activity', () => {
    const startTime = Date.now();
    const loginResponse = loginUser(user.email, user.password);
    const responseTime = Date.now() - startTime;

    // Track response time trend over time
    memoryLeakIndicator.add(responseTime);

    const success = check(loginResponse, {
      'soak: login successful': (r) => r.status === 200,
      'soak: no timeout': (r) => r.timings.duration < 10000,
    });

    errorRateTrend.add(!success);

    // Check for performance degradation over time
    if (responseTime > 3000 && elapsedMinutes > 30) {
      degradationCounter.add(1);
    }

    if (success && loginResponse.json().data) {
      const token = loginResponse.json().data.accessToken;

      // Simulate realistic user session
      group('Session Activity', () => {
        // Multiple operations in a session
        http.get(`${env.authServiceUrl}/api/v1/auth/me`, getAuthHeaders(token));
        thinkTime(2, 5);

        http.get(`${env.baseUrl}/health`);
        thinkTime(3, 7);

        http.get(`${env.baseUrl}/services`, getAuthHeaders(token));
        thinkTime(2, 4);
      });
    }
  });

  // Log progress every 15 minutes
  if (elapsedMinutes % 15 < 0.1) {
    console.log(`Soak test progress: ${Math.floor(elapsedMinutes)} minutes elapsed`);
  }

  sleep(Math.random() * 5 + 3); // 3-8 seconds think time
}

export function teardown(data) {
  const totalDuration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Soak test completed. Total duration: ${Math.floor(totalDuration)} minutes`);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'soak',
    duration: '2h 10m',
    vus: 100,
    results: {
      total_requests: data.metrics.http_reqs?.values.count || 0,
      avg_response_time: data.metrics.http_req_duration?.values.avg || 0,
      response_time_trend: data.metrics.response_time_trend?.values.avg || 0,
      error_rate: data.metrics.http_req_failed?.values.rate || 0,
      performance_degradation_count: data.metrics.performance_degradation?.values.count || 0,
    },
    stability_analysis: {
      stable: (data.metrics.http_req_failed?.values.rate || 0) < 0.02,
      memory_leak_suspected: (data.metrics.performance_degradation?.values.count || 0) > 100,
      recommendation: 'Check server logs and memory usage patterns',
    },
  };

  return {
    'reports/soak-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + JSON.stringify(summary, null, 2) + '\n',
  };
}
