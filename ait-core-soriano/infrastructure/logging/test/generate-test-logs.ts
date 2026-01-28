/**
 * Test log generator for ELK Stack
 * Generates various types of logs to test the logging infrastructure
 */

import axios from 'axios';

const LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'localhost';
const LOGSTASH_PORT = process.env.LOGSTASH_PORT || '5000';
const LOGSTASH_URL = `http://${LOGSTASH_HOST}:${LOGSTASH_PORT}`;

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  application: string;
  timestamp: string;
  [key: string]: any;
}

const applications = ['ait-core', 'ain-tech-web', 'soriano-ecliente', 'ait-engines', 'kong'];
const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];
const urls = [
  '/api/users',
  '/api/policies',
  '/api/quotes',
  '/api/claims',
  '/api/auth/login',
  '/api/dashboard',
  '/api/reports',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendLog(log: LogEntry): Promise<void> {
  try {
    await axios.post(LOGSTASH_URL, log, {
      timeout: 1000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Failed to send log:', err.message);
  }
}

function generateHttpRequestLog(): LogEntry {
  const statusCode = randomElement(statusCodes);
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  return {
    level,
    message: 'HTTP Request',
    application: randomElement(applications),
    timestamp: new Date().toISOString(),
    method: randomElement(methods),
    url: randomElement(urls),
    statusCode,
    duration: randomInt(10, 2000),
    client_ip: `192.168.1.${randomInt(1, 254)}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    correlationId: `req-${Date.now()}-${randomInt(1000, 9999)}`,
  };
}

function generateErrorLog(): LogEntry {
  const errors = [
    'Database connection timeout',
    'Invalid user credentials',
    'Payment processing failed',
    'External API unavailable',
    'Rate limit exceeded',
    'File not found',
    'Permission denied',
  ];

  return {
    level: 'error',
    message: randomElement(errors),
    application: randomElement(applications),
    timestamp: new Date().toISOString(),
    error_type: 'application_error',
    stack: 'Error: at function1() at function2() at function3()',
    userId: `user-${randomInt(1, 1000)}`,
    severity: randomElement(['low', 'medium', 'high']),
  };
}

function generateBusinessEventLog(): LogEntry {
  const events = [
    'user_registered',
    'policy_created',
    'quote_requested',
    'claim_submitted',
    'payment_processed',
    'document_uploaded',
  ];

  return {
    level: 'info',
    message: `Event: ${randomElement(events)}`,
    application: randomElement(applications),
    timestamp: new Date().toISOString(),
    event: randomElement(events),
    eventData: {
      userId: `user-${randomInt(1, 1000)}`,
      amount: randomInt(100, 10000),
    },
  };
}

function generatePerformanceLog(): LogEntry {
  return {
    level: 'info',
    message: 'Performance Metric',
    application: randomElement(applications),
    timestamp: new Date().toISOString(),
    metric: randomElement([
      'database_query',
      'api_call',
      'calculation',
      'rendering',
    ]),
    value: randomInt(50, 5000),
    unit: 'ms',
  };
}

function generateAuthLog(): LogEntry {
  const authEvents = ['login', 'logout', 'failed', 'token_refresh'];
  const event = randomElement(authEvents);

  return {
    level: event === 'failed' ? 'warn' : 'info',
    message: 'Authentication Event',
    application: randomElement(applications),
    timestamp: new Date().toISOString(),
    authEvent: event,
    userId: `user-${randomInt(1, 1000)}`,
    client_ip: `192.168.1.${randomInt(1, 254)}`,
  };
}

async function generateLogs(count: number, delayMs: number = 100): Promise<void> {
  console.log(`🚀 Generating ${count} test logs...`);
  console.log(`📡 Sending to: ${LOGSTASH_URL}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < count; i++) {
    const logType = randomInt(1, 100);

    let log: LogEntry;

    if (logType <= 50) {
      // 50% HTTP requests
      log = generateHttpRequestLog();
    } else if (logType <= 65) {
      // 15% errors
      log = generateErrorLog();
    } else if (logType <= 80) {
      // 15% business events
      log = generateBusinessEventLog();
    } else if (logType <= 90) {
      // 10% performance metrics
      log = generatePerformanceLog();
    } else {
      // 10% auth events
      log = generateAuthLog();
    }

    try {
      await sendLog(log);
      successCount++;

      if ((i + 1) % 100 === 0) {
        console.log(`✅ Sent ${i + 1}/${count} logs`);
      }
    } catch (err) {
      errorCount++;
    }

    // Add delay to simulate realistic traffic
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log('');
  console.log('========================================');
  console.log('✅ Log generation complete!');
  console.log('========================================');
  console.log(`Total logs: ${count}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log('');
  console.log('Check Kibana to view the logs:');
  console.log('http://localhost:5601');
  console.log('========================================');
}

// Parse command line arguments
const args = process.argv.slice(2);
const count = args[0] ? parseInt(args[0]) : 1000;
const delay = args[1] ? parseInt(args[1]) : 100;

// Run the generator
generateLogs(count, delay).catch(err => {
  console.error('Error generating logs:', err);
  process.exit(1);
});
