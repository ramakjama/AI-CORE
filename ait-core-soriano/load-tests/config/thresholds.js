// Performance thresholds for different test scenarios

export const thresholds = {
  // Standard thresholds for most tests
  standard: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    http_reqs: ['rate>10'], // At least 10 requests per second
  },

  // Strict thresholds for critical endpoints
  strict: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.005'], // Error rate < 0.5%
    http_reqs: ['rate>50'], // At least 50 requests per second
  },

  // Relaxed thresholds for heavy operations
  relaxed: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'], // 95% < 5s, 99% < 10s
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    http_reqs: ['rate>5'], // At least 5 requests per second
  },

  // Authentication specific thresholds
  auth: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>20'],
  },

  // Database operation thresholds
  database: {
    http_req_duration: ['p(95)<3000', 'p(99)<8000'],
    http_req_failed: ['rate<0.02'],
    http_reqs: ['rate>15'],
  },

  // Document/file operation thresholds
  documents: {
    http_req_duration: ['p(95)<8000', 'p(99)<15000'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['rate>5'],
  },
};

export const getThresholds = (type = 'standard') => {
  return thresholds[type] || thresholds.standard;
};

export default thresholds;
