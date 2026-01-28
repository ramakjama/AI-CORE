// Load test scenarios configuration

export const scenarios = {
  // Smoke test - minimal load to verify system works
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },

  // Load test - normal expected load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },  // Ramp up to 50 users
      { duration: '5m', target: 50 },  // Stay at 50 users
      { duration: '2m', target: 100 }, // Ramp up to 100 users
      { duration: '5m', target: 100 }, // Stay at 100 users
      { duration: '2m', target: 0 },   // Ramp down to 0 users
    ],
  },

  // Stress test - beyond normal load
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },  // Ramp up to 100 users
      { duration: '5m', target: 100 },  // Stay at 100 users
      { duration: '2m', target: 200 },  // Ramp up to 200 users
      { duration: '5m', target: 200 },  // Stay at 200 users
      { duration: '2m', target: 300 },  // Ramp up to 300 users
      { duration: '5m', target: 300 },  // Stay at 300 users
      { duration: '5m', target: 0 },    // Ramp down to 0 users
    ],
  },

  // Spike test - sudden traffic spike
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },   // Warm up
      { duration: '30s', target: 500 }, // Spike to 500 users
      { duration: '3m', target: 500 },  // Stay at spike
      { duration: '1m', target: 50 },   // Drop back
      { duration: '30s', target: 0 },   // Cool down
    ],
  },

  // Soak test - sustained load over time
  soak: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m', target: 100 },  // Ramp up
      { duration: '2h', target: 100 },  // Stay for 2 hours
      { duration: '5m', target: 0 },    // Ramp down
    ],
  },

  // Breakpoint test - find system limits
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 50,
    timeUnit: '1s',
    preAllocatedVUs: 100,
    maxVUs: 1000,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '5m', target: 400 },
      { duration: '5m', target: 800 },
      { duration: '5m', target: 1600 },
      { duration: '5m', target: 3200 },
    ],
  },

  // Production load test - realistic traffic patterns
  production: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m', target: 50 },   // Morning ramp up
      { duration: '10m', target: 100 }, // Peak morning
      { duration: '5m', target: 75 },   // Mid-day
      { duration: '10m', target: 150 }, // Afternoon peak
      { duration: '5m', target: 100 },  // Evening
      { duration: '5m', target: 0 },    // Night
    ],
  },

  // Capacity planning - incremental load increase
  capacity: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 500,
    stages: [
      { duration: '10m', target: 50 },
      { duration: '10m', target: 100 },
      { duration: '10m', target: 150 },
      { duration: '10m', target: 200 },
      { duration: '10m', target: 250 },
      { duration: '10m', target: 300 },
    ],
  },
};

export const getScenario = (name = 'load') => {
  return scenarios[name] || scenarios.load;
};

export default scenarios;
