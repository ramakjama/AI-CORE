#!/usr/bin/env python3
"""
Test log generator for ELK Stack (Python version)
Generates various types of logs to test the logging infrastructure
"""

import json
import random
import socket
import time
from datetime import datetime
from typing import Dict, Any
import sys

LOGSTASH_HOST = 'localhost'
LOGSTASH_PORT = 5000

APPLICATIONS = ['ait-core', 'ain-tech-web', 'soriano-ecliente', 'ait-engines', 'kong']
METHODS = ['GET', 'POST', 'PUT', 'DELETE']
STATUS_CODES = [200, 201, 400, 401, 403, 404, 500, 502, 503]
URLS = [
    '/api/users',
    '/api/policies',
    '/api/quotes',
    '/api/claims',
    '/api/auth/login',
    '/api/dashboard',
    '/api/reports',
]


def send_log(log: Dict[str, Any]) -> bool:
    """Send log to Logstash via TCP"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        sock.connect((LOGSTASH_HOST, LOGSTASH_PORT))
        sock.sendall((json.dumps(log) + '\n').encode('utf-8'))
        sock.close()
        return True
    except Exception as e:
        print(f"Failed to send log: {e}", file=sys.stderr)
        return False


def generate_http_request_log() -> Dict[str, Any]:
    """Generate HTTP request log"""
    status_code = random.choice(STATUS_CODES)
    level = 'error' if status_code >= 500 else 'warn' if status_code >= 400 else 'info'

    return {
        'level': level,
        'message': 'HTTP Request',
        'application': random.choice(APPLICATIONS),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'method': random.choice(METHODS),
        'url': random.choice(URLS),
        'statusCode': status_code,
        'duration': random.randint(10, 2000),
        'client_ip': f'192.168.1.{random.randint(1, 254)}',
        'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'correlationId': f'req-{int(time.time() * 1000)}-{random.randint(1000, 9999)}',
    }


def generate_error_log() -> Dict[str, Any]:
    """Generate error log"""
    errors = [
        'Database connection timeout',
        'Invalid user credentials',
        'Payment processing failed',
        'External API unavailable',
        'Rate limit exceeded',
        'File not found',
        'Permission denied',
    ]

    return {
        'level': 'error',
        'message': random.choice(errors),
        'application': random.choice(APPLICATIONS),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'error_type': 'application_error',
        'stack': 'Error: at function1() at function2() at function3()',
        'userId': f'user-{random.randint(1, 1000)}',
        'severity': random.choice(['low', 'medium', 'high']),
    }


def generate_business_event_log() -> Dict[str, Any]:
    """Generate business event log"""
    events = [
        'user_registered',
        'policy_created',
        'quote_requested',
        'claim_submitted',
        'payment_processed',
        'document_uploaded',
    ]
    event = random.choice(events)

    return {
        'level': 'info',
        'message': f'Event: {event}',
        'application': random.choice(APPLICATIONS),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'event': event,
        'eventData': {
            'userId': f'user-{random.randint(1, 1000)}',
            'amount': random.randint(100, 10000),
        },
    }


def generate_performance_log() -> Dict[str, Any]:
    """Generate performance log"""
    return {
        'level': 'info',
        'message': 'Performance Metric',
        'application': random.choice(APPLICATIONS),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'metric': random.choice([
            'database_query',
            'api_call',
            'calculation',
            'rendering',
        ]),
        'value': random.randint(50, 5000),
        'unit': 'ms',
    }


def generate_auth_log() -> Dict[str, Any]:
    """Generate authentication log"""
    auth_events = ['login', 'logout', 'failed', 'token_refresh']
    event = random.choice(auth_events)

    return {
        'level': 'warn' if event == 'failed' else 'info',
        'message': 'Authentication Event',
        'application': random.choice(APPLICATIONS),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'authEvent': event,
        'userId': f'user-{random.randint(1, 1000)}',
        'client_ip': f'192.168.1.{random.randint(1, 254)}',
    }


def generate_logs(count: int, delay_ms: int = 100) -> None:
    """Generate and send test logs"""
    print(f"🚀 Generating {count} test logs...")
    print(f"📡 Sending to: {LOGSTASH_HOST}:{LOGSTASH_PORT}")
    print()

    success_count = 0
    error_count = 0

    for i in range(count):
        log_type = random.randint(1, 100)

        # 50% HTTP requests, 15% errors, 15% events, 10% performance, 10% auth
        if log_type <= 50:
            log = generate_http_request_log()
        elif log_type <= 65:
            log = generate_error_log()
        elif log_type <= 80:
            log = generate_business_event_log()
        elif log_type <= 90:
            log = generate_performance_log()
        else:
            log = generate_auth_log()

        if send_log(log):
            success_count += 1
        else:
            error_count += 1

        if (i + 1) % 100 == 0:
            print(f"✅ Sent {i + 1}/{count} logs")

        # Add delay
        if delay_ms > 0:
            time.sleep(delay_ms / 1000.0)

    print()
    print("=" * 40)
    print("✅ Log generation complete!")
    print("=" * 40)
    print(f"Total logs: {count}")
    print(f"Successful: {success_count}")
    print(f"Failed: {error_count}")
    print()
    print("Check Kibana to view the logs:")
    print("http://localhost:5601")
    print("=" * 40)


if __name__ == '__main__':
    # Parse command line arguments
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    delay = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    try:
        generate_logs(count, delay)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        sys.exit(1)
