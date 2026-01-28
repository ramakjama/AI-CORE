import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const apiDuration = new Trend('api_duration');
export const requestCount = new Counter('requests');

/**
 * Generate random string
 */
export function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random email
 */
export function randomEmail() {
  return `test.${randomString(8)}@ait-core-test.com`;
}

/**
 * Generate random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Random sleep between min and max seconds
 */
export function randomSleep(min = 1, max = 5) {
  sleep(randomInt(min, max));
}

/**
 * Format headers with authentication
 */
export function getAuthHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': randomString(16),
    },
  };
}

/**
 * Standard headers without auth
 */
export function getStandardHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': randomString(16),
    },
  };
}

/**
 * Check response helper
 */
export function checkResponse(response, expectedStatus = 200, checkName = 'Response check') {
  const result = check(response, {
    [`${checkName}: status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${checkName}: response time < 2000ms`]: (r) => r.timings.duration < 2000,
    [`${checkName}: has success field`]: (r) => r.json() && r.json().hasOwnProperty('success'),
  });

  errorRate.add(!result);
  apiDuration.add(response.timings.duration);
  requestCount.add(1);

  return result;
}

/**
 * Check authentication response
 */
export function checkAuthResponse(response) {
  const result = check(response, {
    'auth: status is 200': (r) => r.status === 200,
    'auth: has token': (r) => r.json() && r.json().data && r.json().data.accessToken,
    'auth: has user': (r) => r.json() && r.json().data && r.json().data.user,
    'auth: response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  errorRate.add(!result);
  return result;
}

/**
 * Extract token from auth response
 */
export function extractToken(response) {
  const body = response.json();
  return body && body.data && body.data.accessToken ? body.data.accessToken : null;
}

/**
 * Think time - simulates user behavior
 */
export function thinkTime(min = 2, max = 5) {
  sleep(randomInt(min, max));
}

/**
 * Create test user data
 */
export function createTestUser() {
  return {
    email: randomEmail(),
    password: 'TestPassword123!',
    name: `Test User ${randomString(5)}`,
  };
}

/**
 * Create test document data
 */
export function createTestDocument() {
  return {
    title: `Document ${randomString(8)}`,
    content: `This is test content for document ${randomString(16)}`,
    type: ['pdf', 'doc', 'txt'][randomInt(0, 2)],
    tags: ['test', 'load-test', randomString(5)],
  };
}

/**
 * Create test notification data
 */
export function createTestNotification() {
  return {
    title: `Notification ${randomString(8)}`,
    message: `Test notification message ${randomString(20)}`,
    type: ['info', 'warning', 'success', 'error'][randomInt(0, 3)],
    priority: ['low', 'medium', 'high'][randomInt(0, 2)],
  };
}

/**
 * Batch request helper
 */
export function batchRequests(requests, maxBatchSize = 10) {
  const batches = [];
  for (let i = 0; i < requests.length; i += maxBatchSize) {
    batches.push(requests.slice(i, i + maxBatchSize));
  }
  return batches;
}

/**
 * Retry helper
 */
export function retry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        sleep(delayMs / 1000);
      }
    }
  }
  throw lastError;
}

/**
 * Performance logger
 */
export function logPerformance(name, startTime) {
  const duration = Date.now() - startTime;
  console.log(`[PERF] ${name}: ${duration}ms`);
  return duration;
}

/**
 * Weighted random choice
 */
export function weightedChoice(choices) {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let random = Math.random() * totalWeight;

  for (const choice of choices) {
    random -= choice.weight;
    if (random <= 0) {
      return choice.value;
    }
  }

  return choices[choices.length - 1].value;
}

/**
 * Generate realistic user behavior pattern
 */
export function simulateUserBehavior(actions) {
  for (const action of actions) {
    group(action.name, () => {
      action.fn();
      thinkTime(action.thinkTimeMin || 1, action.thinkTimeMax || 3);
    });
  }
}

export default {
  randomString,
  randomEmail,
  randomInt,
  randomSleep,
  getAuthHeaders,
  getStandardHeaders,
  checkResponse,
  checkAuthResponse,
  extractToken,
  thinkTime,
  createTestUser,
  createTestDocument,
  createTestNotification,
  batchRequests,
  retry,
  logPerformance,
  weightedChoice,
  simulateUserBehavior,
};
