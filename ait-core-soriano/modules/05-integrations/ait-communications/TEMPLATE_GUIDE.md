# Template Development Guide

Complete guide for creating and managing communication templates in AIT Communications.

## Template Types

### 1. Email Templates (MJML)

MJML is a markup language for responsive emails.

**Example: Welcome Email**
```mjml
<mjml>
  <mj-head>
    <mj-title>Welcome to Soriano Mediadores</mj-title>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff">
      <mj-column>
        <mj-text font-size="24px" color="#2c3e50">
          Hello {{name}}!
        </mj-text>
        <mj-button href="{{url '/dashboard'}}">
          Go to Dashboard
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

### 2. SMS Templates (Handlebars)

Plain text templates with Handlebars syntax.

**Example: OTP Code**
```handlebars
Your verification code is: {{code}}

Valid for {{expires_in}} minutes.

Do not share this code with anyone.

- Soriano Mediadores
```

### 3. WhatsApp Templates (Handlebars)

WhatsApp supports basic markdown formatting.

**Example: Claim Update**
```handlebars
🔔 *Claim Update*

Hello {{customer_name}},

Your claim *{{claim_number}}* has been updated.

*Status:* {{claim_status}}
{{#if approved_amount}}
*Approved Amount:* {{currency approved_amount 'EUR'}}
{{/if}}

View details: {{url '/claims/' claim_id}}

_Soriano Mediadores_
```

## Handlebars Helpers

### Currency Formatting

```handlebars
{{currency amount}}              # 1.234,56 €
{{currency amount 'EUR'}}        # 1.234,56 €
{{currency amount 'USD'}}        # $1,234.56
```

### Date Formatting

```handlebars
{{date timestamp}}               # 25/01/2026
{{date timestamp 'long'}}        # 25 de enero de 2026
```

### Text Transformation

```handlebars
{{upper text}}                   # UPPERCASE
{{lower text}}                   # lowercase
{{truncate text 50}}             # Truncate to 50 characters
```

### URL Generation

```handlebars
{{url '/dashboard'}}             # https://sorianomediadores.com/dashboard
{{url '/policies/' policy_id}}   # https://sorianomediadores.com/policies/123
```

### Conditionals

```handlebars
{{#if condition}}
  Show this if true
{{else}}
  Show this if false
{{/if}}

{{#if_eq status "APPROVED"}}
  Your claim was approved!
{{/if_eq}}
```

### Loops

```handlebars
{{#each items}}
  - {{this.name}}: {{currency this.price 'EUR'}}
{{/each}}
```

## Template Variables

### Common Variables

All templates have access to:
- `customer_name` - Customer's name
- `customer_email` - Customer's email
- `customer_phone` - Customer's phone
- `company_name` - Soriano Mediadores
- `company_email` - Contact email
- `company_phone` - Contact phone
- `app_url` - Application URL
- `logo_url` - Company logo URL

### Email-Specific Variables

- `unsubscribe_url` - Unsubscribe link
- `tracking_pixel_url` - Open tracking pixel

### Template-Specific Variables

**Policy Templates:**
- `policy_number`
- `policy_type`
- `start_date`
- `end_date`
- `premium`
- `coverage_amount`

**Claim Templates:**
- `claim_number`
- `claim_status`
- `claim_date`
- `approved_amount`
- `incident_date`

**Payment Templates:**
- `payment_amount`
- `payment_date`
- `payment_method`
- `invoice_number`
- `due_date`

## Creating New Templates

### 1. Create Template File

```bash
# Email template
touch src/templates/email/my-template.mjml

# SMS template
touch src/templates/sms/my-template.hbs

# WhatsApp template
touch src/templates/whatsapp/my-template.hbs
```

### 2. Define Template Content

**Email (MJML):**
```mjml
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>
          {{content}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

**SMS (Handlebars):**
```handlebars
{{content}}

- {{company_name}}
```

**WhatsApp (Handlebars):**
```handlebars
*{{title}}*

{{content}}

_{{company_name}}_
```

### 3. Register Template in Database

```typescript
import { TemplateService } from '@ait-core/communications';

const templateService = new TemplateService();

await templateService.createTemplate(
  'EMAIL',                    // Channel
  'TRANSACTIONAL',           // Type
  'my-template',             // Name
  templateContent,           // MJML/Handlebars content
  {                          // Metadata
    subject: 'Template Subject',
    description: 'Template description',
    variables: ['customer_name', 'amount']
  }
);
```

### 4. Use Template

```typescript
await orchestrator.sendMessage({
  to: 'customer@example.com',
  channel: 'EMAIL',
  templateId: 'my-template',
  templateData: {
    customer_name: 'Juan García',
    amount: 1500
  }
});
```

## Template Best Practices

### Email Templates

1. **Use MJML components** for responsive design
2. **Test on multiple clients** (Gmail, Outlook, Apple Mail)
3. **Keep subject lines under 60 characters**
4. **Use alt text for images**
5. **Include plain text version**
6. **Add unsubscribe link**
7. **Use web-safe fonts**
8. **Optimize images** (< 1MB)

### SMS Templates

1. **Keep messages under 160 characters** for single segment
2. **Use clear, concise language**
3. **Include sender name**
4. **Add opt-out instructions** for marketing
5. **Use link shortening** for URLs
6. **Avoid special characters** that may cause encoding issues

### WhatsApp Templates

1. **Follow WhatsApp template guidelines**
2. **Get templates approved** before use
3. **Use markdown sparingly** (*bold*, _italic_)
4. **Keep media files optimized**
5. **Respect 24-hour session window**
6. **Use interactive elements** when appropriate

## Testing Templates

### Preview Template

```typescript
const templateService = new TemplateService();

const preview = await templateService.preview('template-id', {
  customer_name: 'Test User',
  amount: 1000
});

console.log(preview);
```

### Send Test Email

```bash
POST /api/email/send
{
  "to": "test@example.com",
  "templateId": "my-template",
  "data": {
    "customer_name": "Test User"
  }
}
```

### Validate Template

```typescript
// Check required variables
const template = await prisma.communicationTemplate.findUnique({
  where: { name: 'my-template' }
});

const requiredVars = template.metadata.variables;
const providedVars = Object.keys(templateData);

const missing = requiredVars.filter(v => !providedVars.includes(v));
if (missing.length > 0) {
  throw new Error(`Missing variables: ${missing.join(', ')}`);
}
```

## Template Versioning

Templates support versioning for A/B testing and rollback.

```typescript
// Update template (creates new version)
await templateService.updateTemplate(
  'template-id',
  newContent,
  { version: 2, changelog: 'Updated button color' }
);

// Roll back to previous version
await prisma.communicationTemplate.update({
  where: { id: 'template-id' },
  data: { content: previousContent, version: 1 }
});
```

## Internationalization

### Multi-language Templates

```typescript
// Create language-specific templates
await templateService.createTemplate(
  'EMAIL',
  'TRANSACTIONAL',
  'welcome-es',  // Spanish
  spanishContent
);

await templateService.createTemplate(
  'EMAIL',
  'TRANSACTIONAL',
  'welcome-en',  // English
  englishContent
);

// Use based on customer language
const templateId = customer.language === 'es' ? 'welcome-es' : 'welcome-en';
```

## Template Analytics

Track template performance:

```typescript
const tracking = new DeliveryTrackingService();

// Get top performing templates
const topTemplates = await tracking.getTopTemplates(10);

// Get template statistics
const stats = await prisma.communicationLog.groupBy({
  by: ['templateId'],
  where: { templateId: 'my-template' },
  _count: { id: true },
  _avg: { openCount: true, clickCount: true }
});
```

## Common Template Examples

See the `/src/templates/` directory for production-ready templates:

**Email:**
- `welcome.mjml` - Welcome new users
- `policy-issued.mjml` - Policy confirmation
- `payment-receipt.mjml` - Payment confirmation
- `claim-update.mjml` - Claim status update
- `newsletter.mjml` - Marketing newsletter

**SMS:**
- `otp-code.hbs` - 2FA verification
- `payment-reminder.hbs` - Payment due reminder
- `policy-expiring.hbs` - Policy expiration warning
- `appointment-reminder.hbs` - Appointment reminder

**WhatsApp:**
- `claim-update.hbs` - Claim status notification
- `policy-renewal.hbs` - Policy renewal reminder
- `document-ready.hbs` - Document ready for download

## Resources

- [MJML Documentation](https://mjml.io/documentation/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Twilio WhatsApp Templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)
