# Schema Catalog - Complete Reference

## Table of Contents
1. [Authentication & Users](#authentication--users)
2. [Policies](#policies)
3. [Claims](#claims)
4. [Invoices](#invoices)
5. [Customers](#customers)
6. [Validators](#validators)
7. [Utilities](#utilities)

---

## Authentication & Users

### 1. UserSchema
**Purpose**: Complete user entity with all fields
**Fields**: id, email, name, phone, role, status, emailVerified, image, coins, xp, level, lastLoginAt, loginCount, createdAt, updatedAt, deletedAt
**Use**: Database model, API responses

```typescript
import { UserSchema, type User } from '@ait-core/schemas';
const user = UserSchema.parse(data);
```

### 2. UserProfileSchema
**Purpose**: Public user profile (subset of User)
**Fields**: id, email, name, image, role, level
**Use**: Public API responses, user cards

```typescript
import { UserProfileSchema } from '@ait-core/schemas';
const profile = UserProfileSchema.parse(data);
```

### 3. RegisterSchema
**Purpose**: User registration with validation
**Fields**: email, password, confirmPassword, name, phone, acceptTerms, acceptPrivacy, marketingConsent
**Validation**: Passwords must match, terms must be accepted
**Use**: Registration forms

```typescript
import { RegisterSchema, type RegisterInput } from '@ait-core/schemas';
```

### 4. LoginSchema
**Purpose**: Login credentials
**Fields**: email, password, rememberMe
**Use**: Login forms

```typescript
import { LoginSchema, type LoginInput } from '@ait-core/schemas';
```

### 5. ChangePasswordSchema
**Purpose**: Password change with validation
**Fields**: currentPassword, newPassword, confirmPassword
**Validation**: New password must differ, passwords must match
**Use**: Password change forms

### 6. ForgotPasswordSchema
**Purpose**: Password reset request
**Fields**: email
**Use**: Forgot password forms

### 7. ResetPasswordSchema
**Purpose**: Password reset with token
**Fields**: token, password, confirmPassword
**Use**: Reset password forms

### 8. JWTPayloadSchema
**Purpose**: JWT token validation
**Fields**: sub, email, role, permissions, type, iat, exp, jti
**Use**: Token validation

### 9. SessionSchema
**Purpose**: User session tracking
**Fields**: id, userId, token, refreshToken, expiresAt, ipAddress, userAgent, createdAt, lastActivityAt
**Use**: Session management

### 10. PermissionSchema
**Purpose**: Permission entity
**Fields**: id, name, description, resource, action
**Use**: Permission system

### 11. APIKeySchema
**Purpose**: API key management
**Fields**: id, userId, name, key, permissions, expiresAt, lastUsedAt, createdAt, revokedAt
**Use**: API key authentication

---

## Policies

### 1. PolicySchema
**Purpose**: Complete insurance policy entity
**Fields**: id, policyNumber, type, status, customerId, insurerId, agentId, holder, coverages, beneficiaries, premium, premiumBreakdown, currency, paymentFrequency, startDate, endDate, renewalDate, autoRenewal, documentUrls, notes, createdAt, updatedAt
**Validation**: End date > start date, premium breakdown must match
**Use**: Database model, API responses

### 2. CreatePolicySchema
**Purpose**: Policy creation input
**Use**: POST /policies endpoint

### 3. UpdatePolicySchema
**Purpose**: Policy update input (partial)
**Use**: PATCH /policies/:id endpoint

### 4. FilterPoliciesSchema
**Purpose**: Policy search/filter parameters
**Fields**: type, status, customerId, insurerId, agentId, dates, autoRenewal, search, minPremium, maxPremium
**Use**: GET /policies?... query params

### 5. CancelPolicySchema
**Purpose**: Policy cancellation
**Fields**: reason, effectiveDate, refundAmount
**Use**: POST /policies/:id/cancel endpoint

### 6. RenewPolicySchema
**Purpose**: Policy renewal
**Fields**: newStartDate, newEndDate, newPremium, adjustedCoverages, notes
**Validation**: New end date > new start date
**Use**: POST /policies/:id/renew endpoint

### 7. PolicyQuoteSchema
**Purpose**: Quote request
**Fields**: type, coverages, holder, startDate, duration, paymentFrequency, additionalInfo
**Use**: POST /policies/quote endpoint

### 8. PolicyQuoteResultSchema
**Purpose**: Quote result response
**Fields**: quoteId, validUntil, premium, premiumBreakdown, coverages, terms, recommendedCoverages
**Use**: Quote API response

### 9. CoverageSchema
**Purpose**: Coverage details
**Fields**: id, name, description, amount, currency, deductible, type
**Use**: Nested in PolicySchema

### 10. PolicyHolderSchema
**Purpose**: Policy holder information
**Fields**: id, name, documentType, documentNumber, email, phone, address, city, postalCode, country, birthDate
**Use**: Nested in PolicySchema

### 11. BeneficiarySchema
**Purpose**: Beneficiary details
**Fields**: id, name, relationship, percentage, documentType, documentNumber, email, phone
**Validation**: Percentage 0-100
**Use**: Nested in PolicySchema

### 12. PremiumBreakdownSchema
**Purpose**: Premium calculation breakdown
**Fields**: netPremium, taxes, fees, surcharges, discounts, totalPremium, currency
**Validation**: Total must match calculation
**Use**: Nested in PolicySchema

### 13. PolicyDocumentSchema
**Purpose**: Policy document attachment
**Fields**: id, policyId, type, filename, url, uploadedAt, uploadedBy
**Use**: Document management

### 14. PolicyAmendmentSchema
**Purpose**: Policy amendment tracking
**Fields**: id, policyId, type, description, effectiveDate, previousValue, newValue, createdBy, createdAt
**Use**: Policy history

### 15. PaymentFrequencySchema
**Purpose**: Payment frequency enum
**Values**: ANNUAL, SEMI_ANNUAL, QUARTERLY, MONTHLY
**Use**: Policy payment options

---

## Claims

### 1. ClaimSchema
**Purpose**: Complete claim entity
**Fields**: id, claimNumber, policyId, customerId, assignedTo, type, status, priority, incidentDate, reportedDate, location, description, estimatedAmount, approvedAmount, paidAmount, currency, documents, participants, expenses, resolutionNotes, rejectionReason, resolvedAt, createdAt, updatedAt
**Validation**: Reported date >= incident date, approved <= estimated * 1.5, paid <= approved
**Use**: Database model, API responses

### 2. CreateClaimSchema
**Purpose**: Claim submission
**Use**: POST /claims endpoint

### 3. UpdateClaimSchema
**Purpose**: Claim updates (partial)
**Use**: PATCH /claims/:id endpoint

### 4. FilterClaimsSchema
**Purpose**: Claim search/filter parameters
**Fields**: type, status, priority, policyId, customerId, assignedTo, dates, amounts, search
**Use**: GET /claims?... query params

### 5. ChangeClaimStatusSchema
**Purpose**: Change claim status
**Fields**: status, notes, notifyCustomer
**Use**: PATCH /claims/:id/status endpoint

### 6. ApproveClaimSchema
**Purpose**: Claim approval
**Fields**: approvedAmount, notes, approvedExpenses
**Use**: POST /claims/:id/approve endpoint

### 7. RejectClaimSchema
**Purpose**: Claim rejection
**Fields**: reason, notifyCustomer
**Use**: POST /claims/:id/reject endpoint

### 8. ProcessClaimPaymentSchema
**Purpose**: Payment processing
**Fields**: amount, paymentMethod, reference, notes
**Use**: POST /claims/:id/payment endpoint

### 9. ClaimDocumentSchema
**Purpose**: Document attachment
**Fields**: id, type, url, filename, mimetype, size, description, uploadedAt, uploadedBy
**Use**: Nested in ClaimSchema

### 10. ClaimExpenseSchema
**Purpose**: Expense line item
**Fields**: id, description, amount, currency, category, date, receiptUrl, approved, approvedAmount
**Use**: Nested in ClaimSchema

### 11. ClaimParticipantSchema
**Purpose**: Witnesses, involved parties
**Fields**: id, type, name, contactInfo, statement, documentNumber
**Use**: Nested in ClaimSchema

### 12. ClaimCommentSchema
**Purpose**: Claim comments/notes
**Fields**: id, claimId, userId, content, isInternal, createdAt, updatedAt
**Use**: Comment tracking

---

## Invoices

### 1. InvoiceSchema
**Purpose**: Complete invoice entity
**Fields**: id, invoiceNumber, type, status, customerId, policyId, issuer, recipient, items, subtotal, discountTotal, taxTotal, taxes, total, currency, paidAmount, remainingAmount, payments, date, dueDate, paidAt, notes, terms, footer, pdfUrl, attachments, sentAt, viewedAt, createdAt, updatedAt
**Validation**: Due date >= date, subtotal = sum(items), total = subtotal + tax - discount, remaining = total - paid
**Use**: Database model, API responses

### 2. CreateInvoiceSchema
**Purpose**: Invoice creation
**Use**: POST /invoices endpoint

### 3. UpdateInvoiceSchema
**Purpose**: Invoice updates (partial)
**Use**: PATCH /invoices/:id endpoint

### 4. FilterInvoicesSchema
**Purpose**: Invoice search/filter parameters
**Fields**: status, type, customerId, policyId, dates, amounts, overdue, search
**Use**: GET /invoices?... query params

### 5. InvoiceItemSchema
**Purpose**: Invoice line item
**Fields**: id, description, quantity, unitPrice, discount, taxRate, subtotal, total, notes
**Validation**: Subtotal = quantity * unitPrice * (1 - discount%), total = subtotal * (1 + taxRate%)
**Use**: Nested in InvoiceSchema

### 6. SendInvoiceSchema
**Purpose**: Email invoice sending
**Fields**: recipientEmail, ccEmails, subject, message, attachPdf
**Use**: POST /invoices/:id/send endpoint

### 7. RecordPaymentSchema
**Purpose**: Record payment
**Fields**: amount, method, reference, paidAt, notes
**Use**: POST /invoices/:id/payment endpoint

### 8. CancelInvoiceSchema
**Purpose**: Invoice cancellation
**Fields**: reason, createCreditNote
**Use**: POST /invoices/:id/cancel endpoint

### 9. CreateCreditNoteSchema
**Purpose**: Credit note creation
**Fields**: originalInvoiceId, reason, items, partialRefund
**Use**: POST /invoices/:id/credit-note endpoint

### 10. RecurringInvoiceConfigSchema
**Purpose**: Recurring invoice configuration
**Fields**: frequency, startDate, endDate, maxOccurrences, autoSend, template
**Use**: Recurring billing setup

### 11. PaymentRecordSchema
**Purpose**: Payment history entry
**Fields**: id, invoiceId, amount, method, reference, paidAt, processedBy, notes
**Use**: Payment tracking

### 12. TaxDetailSchema
**Purpose**: Tax breakdown
**Fields**: type, name, rate, amount
**Use**: Nested in InvoiceSchema

### 13. InvoicePartySchema
**Purpose**: Issuer/recipient information
**Fields**: name, taxId, email, phone, address
**Use**: Nested in InvoiceSchema

### 14. InvoiceStatisticsSchema
**Purpose**: Invoice analytics
**Fields**: totalInvoices, totalAmount, paidAmount, unpaidAmount, overdueAmount, averageAmount, averagePaymentDays, byStatus, byMonth
**Use**: Analytics dashboard

---

## Customers

### 1. CustomerSchema
**Purpose**: Complete customer entity
**Fields**: id, type, status, segment, documentType, documentNumber, individualDetails, businessDetails, contactInfo, address, billingAddress, contactPersons, language, timezone, communicationPreferences, source, referredBy, assignedAgent, stats, riskScore, creditScore, notes, tags, createdAt, updatedAt
**Validation**: Individual customers must have individualDetails, Business customers must have businessDetails
**Use**: Database model, API responses

### 2. CreateCustomerSchema
**Purpose**: Customer creation
**Use**: POST /customers endpoint

### 3. UpdateCustomerSchema
**Purpose**: Customer updates (partial)
**Use**: PATCH /customers/:id endpoint

### 4. FilterCustomersSchema
**Purpose**: Customer search/filter parameters
**Fields**: type, status, segment, assignedAgent, source, hasActivePolicies, policies, lifetimeValue, tags, search, dates
**Use**: GET /customers?... query params

### 5. IndividualDetailsSchema
**Purpose**: Individual person details
**Fields**: firstName, lastName, middleName, gender, birthDate, birthPlace, nationality, maritalStatus, occupation, employer
**Use**: Nested in CustomerSchema (type: INDIVIDUAL)

### 6. BusinessDetailsSchema
**Purpose**: Business entity details
**Fields**: legalName, tradeName, taxId, industry, sector, employeeCount, annualRevenue, foundedDate, website, description
**Use**: Nested in CustomerSchema (type: BUSINESS/CORPORATE)

### 7. ContactPersonSchema
**Purpose**: Contact person (for business customers)
**Fields**: id, name, position, department, email, phone, isPrimary, notes
**Use**: Nested in CustomerSchema

### 8. ContactInfoSchema
**Purpose**: Contact information
**Fields**: email, emailSecondary, phone, phoneSecondary, mobile, fax, website, preferredContact
**Use**: Nested in CustomerSchema

### 9. CustomerInteractionSchema
**Purpose**: Interaction tracking
**Fields**: id, customerId, type, subject, description, direction, outcome, duration, createdBy, createdAt, scheduledFor
**Use**: CRM interaction log

### 10. CustomerDocumentSchema
**Purpose**: Customer document management
**Fields**: id, customerId, type, filename, url, expiryDate, uploadedAt, uploadedBy, verified, verifiedAt, verifiedBy
**Use**: KYC documents

---

## Validators

### Spanish Market
```typescript
validators.nif          // Spanish NIF/NIE (format: 12345678Z)
validators.cif          // Spanish CIF (format: A12345678)
validators.iban         // Spanish IBAN (format: ES22 digits)
validators.postalCode   // Spanish postal code (5 digits)
validators.licensePlate // Spanish license plate (1234ABC)
```

### International
```typescript
validators.email        // Email (RFC 5322)
validators.phone        // International phone (E.164)
validators.url          // URL validation
validators.uuid         // UUID v4
validators.cuid         // CUID
validators.password     // Strong password (8+, mixed, special)
validators.vin          // Vehicle identification number
validators.currency     // ISO 4217 (3 letters)
validators.countryCode  // ISO 3166-1 alpha-2 (2 letters)
```

### Common Types
```typescript
validators.positiveNumber    // > 0
validators.nonNegativeNumber // >= 0
validators.percentage        // 0-100
validators.pastDate          // date <= now
validators.futureDate        // date >= now
```

---

## Utilities

### 1. paginationSchema
**Purpose**: API pagination parameters
**Fields**: page (default: 1), limit (default: 20, max: 100), sortBy, sortOrder (asc/desc)
**Use**: GET endpoints with pagination

```typescript
import { paginationSchema, type Pagination } from '@ait-core/schemas';
const params = paginationSchema.parse(query);
```

### 2. dateRangeSchema
**Purpose**: Date range validation
**Fields**: from, to
**Validation**: to >= from
**Use**: Date filters

### 3. searchSchema
**Purpose**: Search parameters
**Fields**: query, fields, exactMatch
**Use**: Search endpoints

### 4. addressSchema
**Purpose**: Spanish address format
**Fields**: street, number, floor, door, postalCode, city, province, country (default: ES)
**Use**: Address fields

### 5. moneySchema
**Purpose**: Money amount with currency
**Fields**: amount, currency (default: EUR)
**Use**: Financial amounts

### 6. fileUploadSchema
**Purpose**: File upload validation
**Fields**: filename, mimetype, size (max: 10MB), url, buffer
**Use**: File upload endpoints

### 7. coordinateSchema
**Purpose**: GPS coordinates
**Fields**: latitude (-90 to 90), longitude (-180 to 180)
**Use**: Location fields

### 8. timeRangeSchema
**Purpose**: Time range (HH:mm format)
**Fields**: start, end
**Validation**: HH:mm format
**Use**: Business hours, time filters

### 9. createResponseSchema(schema)
**Purpose**: API response wrapper
**Fields**: success, data (validated by schema), meta
**Use**: Wrap API responses

```typescript
const UserResponseSchema = createResponseSchema(UserSchema);
```

### 10. createPaginatedResponseSchema(schema)
**Purpose**: Paginated response wrapper
**Fields**: success, data (array validated by schema), meta (pagination)
**Use**: Paginated API responses

```typescript
const UsersResponseSchema = createPaginatedResponseSchema(UserSchema);
```

### 11. errorResponseSchema
**Purpose**: Standard error response
**Fields**: success (false), error (code, message, details), meta
**Use**: Error responses

---

## Quick Reference

### Import Patterns

```typescript
// Import specific schemas
import {
  UserSchema,
  LoginSchema,
  PolicySchema,
  ClaimSchema,
} from '@ait-core/schemas';

// Import types
import type {
  User,
  LoginInput,
  Policy,
  Claim,
} from '@ait-core/schemas';

// Import validators
import { validators } from '@ait-core/schemas';

// Import utilities
import {
  paginationSchema,
  createResponseSchema,
} from '@ait-core/schemas';

// Import decorators
import {
  useZodForm,
  ZodValidationPipe,
} from '@ait-core/schemas';
```

### Common Operations

```typescript
// Parse (throws on error)
const data = schema.parse(input);

// Safe parse (returns result)
const result = schema.safeParse(input);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Type inference
type MyType = z.infer<typeof MySchema>;

// Extend schema
const ExtendedSchema = BaseSchema.extend({
  newField: z.string(),
});

// Make partial
const PartialSchema = BaseSchema.partial();

// Make required
const RequiredSchema = BaseSchema.required();
```

---

## Total Count

- **Domain Schemas**: 60+
- **Validators**: 20+
- **Utilities**: 11
- **Framework Integrations**: 5
- **Total**: 96+ reusable pieces

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Maintainer**: AIN TECH - AIT-CORE Team
