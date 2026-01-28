# Frequently Asked Questions (FAQ)

**Version 1.0.0** | **Last Updated:** January 28, 2026

---

## Table of Contents

1. [General Questions](#general-questions)
2. [Technical Questions](#technical-questions)
3. [Deployment Questions](#deployment-questions)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)
6. [Licensing and Pricing](#licensing-and-pricing)
7. [Security](#security)
8. [Integration](#integration)

---

## General Questions

### What is AIT-CORE Soriano Mediadores?

AIT-CORE is a next-generation intelligent ERP-OS platform specifically designed for insurance brokerage firms. It combines 57 specialized modules, 16 AI agents, and 23 computational engines to provide a comprehensive solution for managing every aspect of an insurance business.

### Who is this platform for?

AIT-CORE is designed for:
- Insurance brokers and agents
- Insurance brokerage firms
- Insurance mediators
- Financial advisors specializing in insurance
- Enterprise organizations with insurance needs

### What makes AIT-CORE different from other insurance management systems?

Key differentiators:
- **AI-Powered Intelligence**: 16 autonomous AI agents that analyze, recommend, and execute
- **Modular Architecture**: Enable only the modules you need
- **Comprehensive Coverage**: 20 specialized insurance modules covering all insurance types
- **Modern Tech Stack**: Built with latest technologies (Next.js, NestJS, TypeScript)
- **Real-time Analytics**: Live dashboards with AI-driven insights
- **Full Integration**: Connects with 200+ external APIs

### How long does it take to implement?

Implementation timeline varies:
- **Small Firm (1-10 users)**: 2-4 weeks
- **Medium Firm (10-50 users)**: 4-8 weeks
- **Large Enterprise (50+ users)**: 8-16 weeks

Timeline includes: setup, data migration, training, and go-live.

### Can I try it before purchasing?

Yes! We offer:
- **Free Demo**: 30-minute guided demonstration
- **Free Trial**: 14-day trial with full access to Standard features
- **Sandbox Environment**: Test environment for development

Contact sales@aintech.es to get started.

### Is my data secure?

Absolutely. Security measures include:
- End-to-end encryption (AES-256)
- SOC 2 Type II certified
- GDPR and LOPD compliant
- ISO 27001 certified infrastructure
- Regular security audits
- 24/7 security monitoring
- Automatic backups every 6 hours
- Multi-factor authentication (MFA)

### Can I migrate from my current system?

Yes, we provide migration services for:
- Policies and client data
- Historical claims
- Documents and attachments
- User accounts and permissions
- Custom configurations

Our team handles the entire migration process with zero downtime.

### What languages are supported?

Currently supported:
- Spanish (es-ES)
- English (en-US)

Coming soon:
- Catalan
- Galician
- Basque
- French
- Portuguese

### Can I customize the platform?

Yes, customization options include:
- **Standard License**: Limited customization (colors, logo, basic fields)
- **Pro License**: Moderate customization (workflows, forms, reports)
- **Enterprise License**: Full customization (custom modules, integrations, features)

### How often is the platform updated?

Release schedule:
- **Security patches**: As needed (immediately)
- **Bug fixes**: Weekly
- **Minor updates**: Monthly
- **Major updates**: Quarterly

All updates are automatic with zero downtime.

---

## Technical Questions

### What technologies does AIT-CORE use?

**Frontend:**
- Next.js 14 (React framework)
- TypeScript 5.3
- TailwindCSS 3
- Shadcn/ui components

**Backend:**
- NestJS 10 (Node.js framework)
- TypeScript 5.3
- Prisma ORM
- PostgreSQL 15

**Infrastructure:**
- Docker
- Kubernetes
- AWS/Azure/GCP
- Redis for caching
- Kafka for event streaming

**AI Engines:**
- Python 3.11+
- FastAPI
- Claude Sonnet 4.5
- TensorFlow

### What are the system requirements?

**Client Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Internet connection (5 Mbps minimum, 25 Mbps recommended)
- Screen resolution: 1366x768 minimum (1920x1080 recommended)

**Server Requirements (Self-Hosted):**
- See [Deployment Guide](DEPLOYMENT_GUIDE.md) for detailed specifications

### Can I self-host AIT-CORE?

Yes, self-hosting options:
- **On-Premises**: Deploy in your own data center
- **Private Cloud**: Deploy in your private cloud (AWS, Azure, GCP)
- **Hybrid**: Combination of cloud and on-premises

Self-hosting requires Enterprise license.

### Does it work offline?

Limited offline functionality available:
- **Mobile App**: Can view recent data and submit claims while offline (syncs when online)
- **Web App**: Requires internet connection

For full offline capabilities, consider self-hosted deployment.

### What database does it use?

Primary database: **PostgreSQL 15+**

Why PostgreSQL:
- ACID compliant
- Excellent performance
- JSON/JSONB support
- Full-text search
- Mature and stable
- Great tooling

Also uses:
- **Redis**: Caching and session management
- **Elasticsearch**: Search and analytics
- **S3/MinIO**: Document storage

### How scalable is the platform?

Highly scalable:
- **Horizontal Scaling**: Add more servers as needed
- **Vertical Scaling**: Increase server resources
- **Auto-Scaling**: Automatic scaling based on load
- **Load Balancing**: Distribute traffic across servers
- **Database Replication**: Read replicas for high traffic

Proven to handle:
- 100,000+ policies
- 10,000+ concurrent users
- 1 million+ documents
- Real-time processing

### What APIs are available?

Complete REST API with:
- 200+ endpoints
- OpenAPI/Swagger documentation
- Rate limiting (configurable)
- Webhooks for real-time events
- SDKs for JavaScript, Python, PHP

See [API Documentation](API_DOCUMENTATION.md) for details.

### Can I integrate with external systems?

Yes! Built-in integrations:
- **Accounting**: QuickBooks, Xero, Sage
- **CRM**: Salesforce, HubSpot
- **Email**: Gmail, Outlook, SendGrid
- **Payment**: Stripe, PayPal
- **Calendar**: Google Calendar, Outlook
- **Communication**: Slack, Microsoft Teams

Plus 200+ other integrations via AIT-CONNECTOR.

Custom integrations available with Enterprise license.

### What about mobile apps?

Mobile apps available for:
- **iOS**: iPhone and iPad (iOS 14+)
- **Android**: Phones and tablets (Android 8+)

Features:
- Access policies and clients
- Submit claims with photos
- Create quotes
- Push notifications
- Offline mode (limited)
- Biometric authentication

### How is performance?

Performance benchmarks:
- **Page Load**: < 2 seconds
- **API Response**: < 200ms average
- **Search**: < 100ms
- **Report Generation**: < 5 seconds
- **99.9% uptime** SLA (Enterprise)

Performance optimized with:
- CDN (Cloudflare)
- Redis caching
- Database indexing
- Code splitting
- Image optimization

---

## Deployment Questions

### What hosting options are available?

1. **Cloud Hosted (SaaS)**: We host and manage everything
2. **Self-Hosted**: Deploy in your infrastructure
3. **Hybrid**: Combination of cloud and on-premises

### How long does deployment take?

**Cloud Hosted:**
- Account creation: Immediate
- Initial setup: 1-2 hours
- Data migration: 1-7 days (depending on data volume)
- Training: 1-5 days
- **Total**: 1-2 weeks typical

**Self-Hosted:**
- Infrastructure setup: 1-3 days
- Application deployment: 1 day
- Configuration: 1-2 days
- Data migration: 1-7 days
- Testing: 2-3 days
- **Total**: 2-4 weeks typical

### What cloud providers are supported?

Supported providers:
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)
- DigitalOcean
- Any Kubernetes-compatible provider

Recommended: AWS or Azure for enterprise deployments.

### Do you provide deployment support?

Yes, deployment support included:
- **Standard**: Email support during business hours
- **Pro**: Priority email + phone support
- **Enterprise**: Dedicated deployment engineer + 24/7 support

### What about SSL certificates?

SSL certificates handled automatically:
- **Cloud Hosted**: Included, auto-renewing (Let's Encrypt)
- **Self-Hosted**: Automatic with cert-manager, or bring your own

### Can I use my own domain?

Yes! Use your custom domain:
- api.yourdomain.com
- app.yourdomain.com
- admin.yourdomain.com

DNS configuration instructions provided during setup.

### How do updates work?

**Cloud Hosted:**
- Automatic updates with zero downtime
- Scheduled during maintenance windows
- Rollback available if issues occur
- Notification before major updates

**Self-Hosted:**
- Updates available via container registry
- You control when to update
- Rolling update strategy (zero downtime)
- Rollback scripts provided

### What about disaster recovery?

Disaster recovery plan:
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 15 minutes
- **Multi-region failover**: Automatic (Enterprise)
- **Database replication**: Real-time
- **Backups**: Every 6 hours, retained 30 days
- **DR testing**: Quarterly

---

## Troubleshooting

### Login Issues

**Q: I can't log in, what should I do?**

A: Try these steps:
1. Verify email and password are correct
2. Check caps lock is off
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Reset password if needed
6. Contact support if still unable to log in

**Q: 2FA code not working?**

A: Ensure:
- Device time is synced correctly
- Using latest code (expires every 30 seconds)
- Typing code correctly (no spaces)
- Using correct authenticator app

Try backup codes if available.

### Performance Issues

**Q: System is slow, what can I do?**

A: Check:
1. Internet speed (minimum 5 Mbps required)
2. Close unnecessary browser tabs
3. Clear browser cache
4. Disable browser extensions
5. Try different browser
6. Check system status page

If issue persists, contact support with:
- Browser and OS version
- Screenshot of issue
- Network speed test results

**Q: Page won't load?**

A: Try:
1. Refresh the page (F5 or Ctrl+R)
2. Clear browser cache
3. Check internet connection
4. Try different browser/device
5. Check status page for maintenance

### Data Issues

**Q: My data didn't save?**

A: Check:
- Status indicator shows "Saved"
- No error messages displayed
- You have permission for that action
- Internet connection is stable

Auto-save happens every 30 seconds. Look for drafts in case of connection loss.

**Q: Can't find a record?**

A: Verify:
- Search filters are correct
- Spelling is accurate
- Record wasn't deleted (check trash)
- You have permission to view it

Try advanced search or contact support.

### Module Issues

**Q: Module won't enable?**

A: Check:
- You have required license
- Dependencies are satisfied
- No conflicting modules
- Contact admin to enable

**Q: Module showing errors?**

A: Check:
- Module health dashboard (Admin Panel)
- Error logs
- Try disabling and re-enabling
- Contact support if persists

### API Issues

**Q: API returning 401 Unauthorized?**

A: Verify:
- Token is valid and not expired
- Using correct Authorization header format
- Token has required permissions
- Refresh token if needed

**Q: API returning 429 Too Many Requests?**

A: You've exceeded rate limit:
- Wait for rate limit reset (check X-RateLimit-Reset header)
- Reduce request frequency
- Implement caching
- Upgrade license for higher limits

---

## Best Practices

### Security Best Practices

**Q: How should I manage passwords?**

A: Follow these guidelines:
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Never reuse passwords
- Use password manager
- Enable 2FA for all users
- Rotate passwords quarterly
- Never share passwords

**Q: What security settings should I enable?**

A: Recommended settings:
- ✅ Enforce 2FA for all users
- ✅ Set session timeout (recommended: 30 minutes)
- ✅ Enable IP whitelist (if possible)
- ✅ Require strong passwords
- ✅ Enable audit logging
- ✅ Regular security training for staff

### Performance Best Practices

**Q: How can I improve performance?**

A: Optimize:
- Use filters to limit query results
- Close unnecessary browser tabs
- Clear cache regularly
- Use most recent browser version
- Optimize images before upload
- Archive old data

**Q: Should I use caching?**

A: Yes, caching improves performance:
- Browser caching (automatic)
- API response caching (configurable)
- Report caching (recommended)

### Data Management Best Practices

**Q: How should I organize my data?**

A: Best practices:
- Use consistent naming conventions
- Tag and categorize properly
- Archive old records regularly
- Delete test data
- Use bulk operations for efficiency
- Regular data quality audits

**Q: How often should I backup?**

A: Backup strategy:
- **Automatic backups**: Every 6 hours (included)
- **Manual backups**: Before major changes
- **Export critical data**: Monthly
- **Test restores**: Quarterly

### Module Management Best Practices

**Q: Which modules should I enable?**

A: Enable only what you need:
- Start with Core Business modules
- Add Insurance Specialized as needed
- Enable Analytics for insights
- Add Marketing if doing campaigns
- Keep disabled modules off (reduces complexity)

**Q: How many modules can I run?**

A: Depends on license and resources:
- **Standard**: Up to 15 modules recommended
- **Pro**: Up to 35 modules recommended
- **Enterprise**: All 57 modules supported

Monitor system resources and performance.

---

## Licensing and Pricing

### What license tiers are available?

Three tiers available:

**Standard ($99/user/month):**
- Core Business modules
- Basic insurance modules
- Up to 10 users
- Email support (business hours)
- 50 GB storage

**Pro ($199/user/month):**
- All Standard features
- All insurance specialized modules
- Marketing & Sales modules
- Up to 50 users
- Priority support (phone + email)
- 500 GB storage
- Advanced analytics

**Enterprise (Custom pricing):**
- All Pro features
- All 57 modules
- Unlimited users
- 24/7 dedicated support
- Unlimited storage
- Custom integrations
- SLA guarantees
- White-label options

### Are there setup fees?

- **Standard**: $0 setup fee
- **Pro**: $0 setup fee
- **Enterprise**: Custom (includes migration and training)

### Do you offer discounts?

Yes, discounts available:
- **Annual billing**: 20% discount
- **Non-profit**: 30% discount
- **Education**: 50% discount
- **Volume**: Custom pricing for 100+ users

### Can I upgrade my license?

Yes, upgrade anytime:
- Pro-rated billing
- Immediate access to new features
- No downtime during upgrade
- Contact support to upgrade

### What's included in support?

**Standard:**
- Email support
- Response time: 24-48 hours
- Knowledge base access
- Community forum

**Pro:**
- Email + phone support
- Response time: 4-12 hours
- Priority queue
- Video chat support

**Enterprise:**
- 24/7 dedicated support
- Response time: < 1 hour
- Dedicated account manager
- On-site support available
- Custom SLA

### Is there a money-back guarantee?

Yes! 30-day money-back guarantee:
- Full refund within 30 days
- No questions asked
- Keep exported data

---

## Security

### How is data encrypted?

**At Rest:**
- AES-256 encryption for database
- Encrypted S3 buckets for files
- Encrypted backups

**In Transit:**
- TLS 1.3 for all connections
- HTTPS only (HTTP redirected)
- Certificate pinning in mobile apps

### Where is data stored?

**Cloud Hosted:**
- Primary: EU (Frankfurt, Germany)
- Backup: EU (Dublin, Ireland)
- Other regions available (US, Asia-Pacific)

**Self-Hosted:**
- Your choice of location

GDPR compliant with data residency options.

### Who can access my data?

Access control:
- **Your team**: Based on roles and permissions you set
- **AIT Support**: Only with your explicit permission (Enterprise only)
- **System**: Automated backups and monitoring (no human access)

### What compliance certifications do you have?

Certifications and compliance:
- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ GDPR compliant
- ✅ LOPD compliant
- ✅ PCI DSS (for payment processing)
- ✅ HIPAA (on request)

### How do you handle data breaches?

Data breach protocol:
1. Immediate investigation and containment
2. Notification within 24 hours
3. Full transparency on impact
4. Free credit monitoring for affected users
5. Post-incident review and improvements

Zero data breaches to date.

### Can I export my data?

Yes! Data portability:
- Export all data anytime
- Multiple formats (CSV, JSON, Excel)
- Includes documents and attachments
- Automated export via API
- Bulk export tools available

No lock-in, your data is always yours.

### What about GDPR compliance?

GDPR features included:
- Data processing agreements
- Right to be forgotten
- Data portability
- Consent management
- Privacy by design
- Data protection officer
- Incident response plan
- Regular compliance audits

### How do you handle user permissions?

Role-based access control (RBAC):
- Pre-defined roles (Admin, Manager, Agent, Viewer)
- Custom roles available
- Granular permissions per module
- IP restrictions (Enterprise)
- Time-based access (Enterprise)
- Audit trail for all actions

---

## Integration

### What integrations are available?

**Built-in Integrations:**
- Accounting: QuickBooks, Xero, Sage
- CRM: Salesforce, HubSpot
- Email: Gmail, Outlook
- Calendar: Google Calendar, Outlook
- Payment: Stripe, PayPal
- Communication: Slack, Teams

**Via API:**
- 200+ integrations via Zapier
- Custom integrations via REST API
- Webhooks for real-time events

### How do webhooks work?

Webhooks allow real-time notifications:

**Setup:**
1. Configure webhook URL in settings
2. Select events to monitor
3. Verify webhook signature

**Events Available:**
- policy.created, policy.updated
- claim.submitted, claim.approved
- payment.completed
- client.created
- And more...

See [API Documentation](API_DOCUMENTATION.md) for details.

### Can I build custom integrations?

Yes! Options:
- **REST API**: Full API access (all licenses)
- **Webhooks**: Real-time events (all licenses)
- **Custom Development**: We build it for you (Enterprise)

SDKs available for JavaScript, Python, PHP.

### What about data sync?

Data synchronization:
- Real-time sync for critical data
- Scheduled sync for reports (configurable)
- Conflict resolution (last-write-wins or manual)
- Sync status monitoring
- Error alerts and retry logic

### How do I migrate from another system?

Migration process:
1. **Assessment**: Analyze current system and data
2. **Mapping**: Map fields between systems
3. **Test Migration**: Migrate to sandbox environment
4. **Validation**: Verify data accuracy
5. **Production Migration**: Migrate to live system
6. **Post-Migration Support**: Ensure everything works

We handle the entire process (Enterprise includes migration support).

---

## Still Have Questions?

### Contact Us

**Sales Inquiries:**
- Email: sales@aintech.es
- Phone: +34 900 XXX XXX
- Schedule demo: https://aintech.es/demo

**Technical Support:**
- Email: support@aintech.es
- Phone: +34 900 YYY YYY (Pro/Enterprise)
- Portal: https://support.aintech.es

**General Questions:**
- Email: hello@aintech.es
- Community Forum: https://community.aintech.es
- Documentation: https://docs.aintech.es

### Resources

- **Documentation**: https://docs.aintech.es
- **API Reference**: https://docs.aintech.es/api
- **Video Tutorials**: https://youtube.com/@aintech
- **Blog**: https://aintech.es/blog
- **Status Page**: https://status.aintech.es

---

*FAQ v1.0.0 | Last Updated: January 28, 2026*

*Have a question not listed here? Email us at hello@aintech.es*
