/**
 * Production Load Test
 * Purpose: Simulate realistic production traffic patterns
 * Duration: 30 minutes
 * VUs: Dynamic based on realistic patterns (peak 150)
 *
 * WARNING: Only run this against production-like environments
 * with proper monitoring and rollback plans in place
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  getAuthHeaders,
  randomEmail,
  thinkTime,
  weightedChoice,
  simulateUserBehavior,
} from '../utils/helpers.js';
import { getAuthToken, registerUser, loginUser } from '../utils/auth.js';
import env from '../config/environments.js';

// Production metrics
const userJourneySuccess = new Rate('user_journey_success');
const businessTransactionSuccess = new Rate('business_transaction_success');
const productionErrors = new Counter('production_errors');
const activeUsers = new Gauge('active_concurrent_users');
const userSessions = new Counter('user_sessions');
const apiCalls = new Counter('api_calls');

export const options = {
  // Realistic production traffic pattern
  stages: [
    // Morning ramp-up (8 AM - 9 AM)
    { duration: '5m', target: 30 },
    { duration: '2m', target: 50 },

    // Morning peak (9 AM - 11 AM)
    { duration: '3m', target: 80 },
    { duration: '5m', target: 100 },

    // Lunch dip (11 AM - 1 PM)
    { duration: '2m', target: 60 },

    // Afternoon peak (1 PM - 5 PM)
    { duration: '3m', target: 120 },
    { duration: '5m', target: 150 },

    // Evening decline (5 PM - 6 PM)
    { duration: '3m', target: 80 },
    { duration: '2m', target: 30 },

    // Cool down
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // Production SLA thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.005'], // 99.5% success rate
    user_journey_success: ['rate>0.95'],
    business_transaction_success: ['rate>0.98'],
  },
};

export function setup() {
  console.log('==================================================');
  console.log('PRODUCTION LOAD TEST');
  console.log('Environment:', __ENV.ENVIRONMENT || 'development');
  console.log('Target:', env.baseUrl);
  console.log('==================================================');

  const testUsers = [];

  // Create realistic user base
  for (let i = 0; i < 100; i++) {
    const email = randomEmail();
    const password = 'TestPassword123!';

    try {
      registerUser(email, password, `Prod Test User ${i}`);
      testUsers.push({ email, password, role: 'user' });
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

  // Track active users
  activeUsers.add(1);
  userSessions.add(1);

  // Simulate different user behaviors with weighted probabilities
  const userType = weightedChoice([
    { value: 'browser', weight: 60 },      // 60% casual browsers
    { value: 'transaction', weight: 30 },  // 30% transaction users
    { value: 'power', weight: 10 },        // 10% power users
  ]);

  let journeySuccess = true;

  try {
    switch (userType) {
      case 'browser':
        journeySuccess = browsing_journey(user);
        break;
      case 'transaction':
        journeySuccess = transaction_journey(user);
        break;
      case 'power':
        journeySuccess = power_user_journey(user);
        break;
    }

    userJourneySuccess.add(journeySuccess);
  } catch (error) {
    productionErrors.add(1);
    userJourneySuccess.add(0);
    console.error(`User journey failed: ${error}`);
  }

  sleep(Math.random() * 3 + 1); // 1-4 seconds between users
}

/**
 * Casual browsing journey (quick session)
 */
function browsing_journey(user) {
  let success = true;

  group('Browsing Journey', () => {
    // Quick health check
    const health = http.get(`${env.baseUrl}/health`);
    apiCalls.add(1);

    if (health.status !== 200) {
      productionErrors.add(1);
      success = false;
      return;
    }

    thinkTime(2, 4);

    // Check available services
    const services = http.get(`${env.baseUrl}/services`);
    apiCalls.add(1);

    check(services, {
      'browser: services loaded': (r) => r.status === 200,
    });

    thinkTime(3, 6);
  });

  return success;
}

/**
 * Transaction journey (user with authentication)
 */
function transaction_journey(user) {
  let success = true;
  let token = null;

  group('Transaction Journey', () => {
    // Login
    const loginResponse = loginUser(user.email, user.password);
    apiCalls.add(1);

    const loginSuccess = check(loginResponse, {
      'transaction: login success': (r) => r.status === 200,
      'transaction: has token': (r) => r.json() && r.json().data && r.json().data.accessToken,
    });

    if (!loginSuccess) {
      productionErrors.add(1);
      success = false;
      return;
    }

    token = loginResponse.json().data.accessToken;
    thinkTime(2, 4);

    // Get user profile
    const profile = http.get(
      `${env.authServiceUrl}/api/v1/auth/me`,
      getAuthHeaders(token)
    );
    apiCalls.add(1);

    check(profile, {
      'transaction: profile loaded': (r) => r.status === 200,
    });

    thinkTime(3, 5);

    // Perform business transaction
    const transactionSuccess = perform_business_transaction(token);
    businessTransactionSuccess.add(transactionSuccess);

    if (!transactionSuccess) {
      productionErrors.add(1);
      success = false;
    }

    thinkTime(2, 3);

    // Logout
    http.post(
      `${env.authServiceUrl}/api/v1/auth/logout`,
      null,
      getAuthHeaders(token)
    );
    apiCalls.add(1);
  });

  return success;
}

/**
 * Power user journey (multiple operations)
 */
function power_user_journey(user) {
  let success = true;
  let token = null;

  group('Power User Journey', () => {
    // Login
    const loginResponse = loginUser(user.email, user.password);
    apiCalls.add(1);

    if (loginResponse.status !== 200) {
      productionErrors.add(1);
      return false;
    }

    token = loginResponse.json().data.accessToken;
    thinkTime(1, 2);

    // Multiple rapid operations
    const operations = [
      () => http.get(`${env.authServiceUrl}/api/v1/auth/me`, getAuthHeaders(token)),
      () => http.get(`${env.baseUrl}/services`, getAuthHeaders(token)),
      () => http.get(`${env.baseUrl}/health`),
    ];

    for (const operation of operations) {
      try {
        operation();
        apiCalls.add(1);
        thinkTime(1, 2);
      } catch (error) {
        productionErrors.add(1);
        success = false;
      }
    }

    // Multiple business transactions
    for (let i = 0; i < 3; i++) {
      const transactionSuccess = perform_business_transaction(token);
      businessTransactionSuccess.add(transactionSuccess);
      thinkTime(2, 4);
    }
  });

  return success;
}

/**
 * Simulate a business transaction
 */
function perform_business_transaction(token) {
  try {
    // Example: Query data through gateway
    const response = http.get(
      `${env.baseUrl}/api/v1/data/health`,
      getAuthHeaders(token)
    );
    apiCalls.add(1);

    return response.status === 200 || response.status === 404;
  } catch (error) {
    productionErrors.add(1);
    return false;
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log('==================================================');
  console.log('PRODUCTION LOAD TEST COMPLETED');
  console.log(`Duration: ${Math.floor(duration)} minutes`);
  console.log(`Test Users: ${data.testUsers.length}`);
  console.log('==================================================');
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'production',
    environment: __ENV.ENVIRONMENT || 'development',
    target: env.baseUrl,
    duration: '32 minutes',
    peak_vus: 150,
    results: {
      total_requests: data.metrics.http_reqs?.values.count || 0,
      total_api_calls: data.metrics.api_calls?.values.count || 0,
      total_user_sessions: data.metrics.user_sessions?.values.count || 0,
      error_count: data.metrics.production_errors?.values.count || 0,
      error_rate: data.metrics.http_req_failed?.values.rate || 0,
      user_journey_success_rate: data.metrics.user_journey_success?.values.rate || 0,
      business_transaction_success_rate: data.metrics.business_transaction_success?.values.rate || 0,
      avg_response_time: data.metrics.http_req_duration?.values.avg || 0,
      p50_response_time: data.metrics.http_req_duration?.values.med || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
      p99_response_time: data.metrics.http_req_duration?.values['p(99)'] || 0,
      max_concurrent_users: data.metrics.vus_max?.values.value || 0,
    },
    sla_compliance: {
      response_time_sla: (data.metrics.http_req_duration?.values['p(95)'] || 0) < 2000,
      availability_sla: (data.metrics.http_req_failed?.values.rate || 0) < 0.005,
      transaction_sla: (data.metrics.business_transaction_success?.values.rate || 0) > 0.98,
      overall_pass:
        (data.metrics.http_req_duration?.values['p(95)'] || 0) < 2000 &&
        (data.metrics.http_req_failed?.values.rate || 0) < 0.005 &&
        (data.metrics.business_transaction_success?.values.rate || 0) > 0.98,
    },
    recommendations: generateRecommendations(data),
  };

  return {
    'reports/production-load-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\n' + '='.repeat(60) + '\n' +
            'PRODUCTION LOAD TEST RESULTS\n' +
            '='.repeat(60) + '\n' +
            JSON.stringify(summary, null, 2) + '\n' +
            '='.repeat(60) + '\n',
  };
}

function generateRecommendations(data) {
  const recommendations = [];
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;

  if (p95 > 2000) {
    recommendations.push('Response time exceeds SLA. Consider scaling or optimization.');
  }

  if (errorRate > 0.005) {
    recommendations.push('Error rate exceeds SLA. Investigate failed requests.');
  }

  if ((data.metrics.production_errors?.values.count || 0) > 50) {
    recommendations.push('High number of production errors detected. Check logs.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All metrics within acceptable ranges. System performing well.');
  }

  return recommendations;
}
