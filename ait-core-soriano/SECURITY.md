# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of AIT-CORE Soriano Mediadores seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Disclose Publicly

Please do not create a public GitHub issue for security vulnerabilities. Public disclosure may put the entire community at risk.

### 2. Report Via Secure Channels

**Email**: security@sorianomediadore.com

**Subject Line**: `[SECURITY] Brief description of the issue`

**Include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Update**: Every 7 days until resolution
- **Fix Timeline**: Based on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### 4. Disclosure Policy

We follow coordinated disclosure:

1. We will work with you to understand and validate the vulnerability
2. We will develop and test a fix
3. We will release the fix
4. After a reasonable time (typically 90 days), you may publicly disclose the vulnerability

### 5. Bug Bounty Program

We offer rewards for valid security vulnerabilities:

- **Critical**: Up to €5,000
- **High**: Up to €2,500
- **Medium**: Up to €1,000
- **Low**: Up to €500

#### Qualifying Vulnerabilities

- Remote code execution (RCE)
- SQL injection
- Authentication bypass
- Authorization bypass
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Insecure direct object references (IDOR)
- Security misconfigurations
- Sensitive data exposure
- XML external entity (XXE) injection
- Broken access control
- Cryptographic failures
- Injection flaws

#### Non-Qualifying Issues

- Social engineering attacks
- Physical attacks
- Denial of service (DoS/DDoS)
- Spam or social media issues
- SSL/TLS best practices
- Missing security headers (unless exploitable)
- Clickjacking on pages with no sensitive actions
- Issues in third-party services
- Theoretical vulnerabilities without proof of concept
- Automated tool results without validation

### 6. Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts you own or with explicit permission from the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report the vulnerability to us as soon as possible
- Keep the vulnerability information confidential until we resolve it

We will not pursue legal action against researchers who follow these guidelines.

## Security Features

### Authentication & Authorization

- JWT-based authentication with RS256 algorithm
- Multi-factor authentication (MFA) support
- Role-based access control (RBAC)
- Permission-based access control
- Session management with secure cookies
- Account lockout after failed login attempts
- Password strength requirements
- OAuth 2.0 integration

### Data Protection

- Encryption at rest (AES-256-GCM)
- Encryption in transit (TLS 1.3)
- Secure password hashing (bcrypt with 12 rounds)
- Database connection encryption
- Sensitive data redaction in logs
- GDPR compliance features

### Network Security

- CORS configuration with strict origin whitelist
- Rate limiting on all endpoints
- DDoS protection
- IP whitelisting/blacklisting
- Firewall rules
- Intrusion detection

### Application Security

- Helmet.js security headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- XSS protection
- CSRF protection
- SQL injection prevention (parameterized queries)
- Input validation and sanitization
- Output encoding
- Secure session management

### Monitoring & Logging

- Security event logging
- Failed login attempt tracking
- API access logs
- Anomaly detection
- Real-time alerting
- Audit trail for compliance

### Vulnerability Management

- Automated dependency scanning (npm audit, Snyk)
- Regular security updates
- Penetration testing
- Code review process
- Security training for developers

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` files (never commit)
   - Use environment variables
   - Use secret management tools (Vault, AWS Secrets Manager)

2. **Input validation**
   - Validate all user input
   - Use type checking
   - Sanitize data before processing

3. **Authentication**
   - Always verify user identity
   - Use strong password policies
   - Implement MFA for sensitive operations
   - Never store passwords in plain text

4. **Authorization**
   - Follow principle of least privilege
   - Check permissions on every request
   - Don't rely on client-side checks

5. **Dependencies**
   - Keep dependencies up to date
   - Review dependency security advisories
   - Use `npm audit` regularly
   - Remove unused dependencies

6. **Code Review**
   - All code must be reviewed
   - Focus on security implications
   - Use automated security scanning

### For Users

1. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Use a password manager

2. **Enable MFA**
   - Use authenticator apps (not SMS)
   - Keep backup codes secure

3. **Keep software updated**
   - Enable automatic updates
   - Update promptly when notified

4. **Be cautious**
   - Verify email senders
   - Don't click suspicious links
   - Report phishing attempts

5. **Protect your account**
   - Log out when finished
   - Don't share credentials
   - Use different passwords for different services

## Security Contacts

- **Security Team**: security@sorianomediadore.com
- **Privacy Team**: privacy@sorianomediadore.com
- **Legal**: legal@sorianomediadore.com
- **Emergency Hotline**: +34 XXX XXX XXX (24/7)

## Security Updates

Subscribe to security updates:
- GitHub Security Advisories
- Email notifications: security-updates@sorianomediadore.com
- RSS feed: https://sorianomediadore.com/security/feed

## Compliance

We comply with:
- GDPR (General Data Protection Regulation)
- LOPD (Ley Orgánica de Protección de Datos)
- ISO 27001 (in progress)
- OWASP Top 10
- CIS Controls

## Resources

- [Security Hardening Guide](./security-hardening.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:

- (List will be updated as vulnerabilities are reported and fixed)

## Version History

- **1.0.0** (2026-01-28): Initial security policy

---

**Last Updated**: 2026-01-28

**Document Version**: 1.0.0

**Next Review Date**: 2026-04-28
