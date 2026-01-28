import { describe, it, expect } from '@jest/globals';
import {
  // Auth schemas
  UserSchema,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  // Policy schemas
  PolicySchema,
  CreatePolicySchema,
  CoverageSchema,
  // Claim schemas
  ClaimSchema,
  CreateClaimSchema,
  // Invoice schemas
  InvoiceSchema,
  InvoiceItemSchema,
  // Customer schemas
  CustomerSchema,
  CreateCustomerSchema,
  // Utils
  validators,
  paginationSchema,
  dateRangeSchema,
} from '../src';

describe('@ait-core/schemas', () => {
  describe('Validators', () => {
    describe('email', () => {
      it('should accept valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@example.co.uk',
          'user+tag@example.com',
        ];

        validEmails.forEach((email) => {
          const result = validators.email.safeParse(email);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid emails', () => {
        const invalidEmails = ['invalid', '@example.com', 'test@', 'test @example.com'];

        invalidEmails.forEach((email) => {
          const result = validators.email.safeParse(email);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('nif', () => {
      it('should accept valid Spanish NIFs', () => {
        const result = validators.nif.safeParse('12345678Z');
        expect(result.success).toBe(true);
      });

      it('should reject invalid NIFs', () => {
        const invalid = ['1234567', '12345678', 'ABCD1234Z'];
        invalid.forEach((nif) => {
          const result = validators.nif.safeParse(nif);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('iban', () => {
      it('should accept valid Spanish IBANs', () => {
        const result = validators.iban.safeParse('ES1234567890123456789012');
        expect(result.success).toBe(true);
      });

      it('should reject invalid IBANs', () => {
        const result = validators.iban.safeParse('ES123');
        expect(result.success).toBe(false);
      });
    });

    describe('password', () => {
      it('should accept strong passwords', () => {
        const result = validators.password.safeParse('StrongPass123!');
        expect(result.success).toBe(true);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short',
          'nouppercase123!',
          'NOLOWERCASE123!',
          'NoNumbers!',
          'NoSpecialChar123',
        ];

        weakPasswords.forEach((password) => {
          const result = validators.password.safeParse(password);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Auth Schemas', () => {
    describe('RegisterSchema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        name: 'John Doe',
        acceptTerms: true,
        acceptPrivacy: true,
      };

      it('should validate correct registration data', () => {
        const result = RegisterSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject mismatched passwords', () => {
        const result = RegisterSchema.safeParse({
          ...validData,
          confirmPassword: 'DifferentPass123!',
        });
        expect(result.success).toBe(false);
      });

      it('should require terms acceptance', () => {
        const result = RegisterSchema.safeParse({
          ...validData,
          acceptTerms: false,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('LoginSchema', () => {
      it('should validate correct login data', () => {
        const result = LoginSchema.safeParse({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = LoginSchema.safeParse({
          email: 'invalid-email',
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('ChangePasswordSchema', () => {
      it('should validate correct password change', () => {
        const result = ChangePasswordSchema.safeParse({
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        });
        expect(result.success).toBe(true);
      });

      it('should reject if new password equals current', () => {
        const result = ChangePasswordSchema.safeParse({
          currentPassword: 'SamePass123!',
          newPassword: 'SamePass123!',
          confirmPassword: 'SamePass123!',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Policy Schemas', () => {
    describe('CoverageSchema', () => {
      it('should validate correct coverage', () => {
        const result = CoverageSchema.safeParse({
          name: 'Basic Coverage',
          description: 'Basic protection',
          amount: 50000,
          currency: 'EUR',
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative amounts', () => {
        const result = CoverageSchema.safeParse({
          name: 'Test Coverage',
          amount: -1000,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('PolicySchema validation rules', () => {
      it('should reject end date before start date', () => {
        const result = PolicySchema.partial().safeParse({
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Invoice Schemas', () => {
    describe('InvoiceItemSchema', () => {
      it('should validate correct item with calculations', () => {
        const item = {
          description: 'Test Item',
          quantity: 2,
          unitPrice: 100,
          discount: 10,
          taxRate: 21,
          subtotal: 180, // 200 - 10% = 180
          total: 217.8, // 180 + 21% = 217.8
        };

        const result = InvoiceItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      });

      it('should reject incorrect subtotal calculation', () => {
        const item = {
          description: 'Test Item',
          quantity: 2,
          unitPrice: 100,
          discount: 0,
          taxRate: 0,
          subtotal: 999, // Wrong! Should be 200
          total: 200,
        };

        const result = InvoiceItemSchema.safeParse(item);
        expect(result.success).toBe(false);
      });

      it('should reject incorrect total calculation', () => {
        const item = {
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          taxRate: 21,
          subtotal: 100,
          total: 999, // Wrong! Should be 121
        };

        const result = InvoiceItemSchema.safeParse(item);
        expect(result.success).toBe(false);
      });
    });

    describe('InvoiceSchema validation rules', () => {
      it('should validate totals match items', () => {
        const items = [
          {
            description: 'Item 1',
            quantity: 2,
            unitPrice: 10,
            discount: 0,
            taxRate: 0,
            subtotal: 20,
            total: 20,
          },
          {
            description: 'Item 2',
            quantity: 1,
            unitPrice: 30,
            discount: 0,
            taxRate: 0,
            subtotal: 30,
            total: 30,
          },
        ];

        const result = InvoiceSchema.partial().safeParse({
          items,
          subtotal: 50,
          taxTotal: 0,
          total: 50,
          paidAmount: 0,
          remainingAmount: 50,
        });

        expect(result.success).toBe(true);
      });

      it('should reject due date before invoice date', () => {
        const result = InvoiceSchema.partial().safeParse({
          date: new Date('2024-12-31'),
          dueDate: new Date('2024-01-01'),
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Customer Schemas', () => {
    describe('CreateCustomerSchema', () => {
      it('should validate individual customer', () => {
        const result = CreateCustomerSchema.safeParse({
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          documentType: 'NIF',
          documentNumber: '12345678Z',
          individualDetails: {
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('1990-01-01'),
          },
          contactInfo: {
            email: 'john@example.com',
            phone: '+34612345678',
          },
          address: {
            street: 'Main St',
            postalCode: '28001',
            city: 'Madrid',
            province: 'Madrid',
            country: 'ES',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should require individual details for individual customers', () => {
        const result = CreateCustomerSchema.safeParse({
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          documentType: 'NIF',
          documentNumber: '12345678Z',
          // Missing individualDetails
          contactInfo: {
            email: 'john@example.com',
            phone: '+34612345678',
          },
          address: {
            street: 'Main St',
            postalCode: '28001',
            city: 'Madrid',
            province: 'Madrid',
            country: 'ES',
          },
        });

        expect(result.success).toBe(false);
      });

      it('should validate business customer', () => {
        const result = CreateCustomerSchema.safeParse({
          type: 'BUSINESS',
          status: 'ACTIVE',
          documentType: 'CIF',
          documentNumber: 'A12345678',
          businessDetails: {
            legalName: 'Example Corp',
            taxId: 'A12345678',
            industry: 'Technology',
          },
          contactInfo: {
            email: 'contact@example.com',
            phone: '+34912345678',
          },
          address: {
            street: 'Business Ave',
            postalCode: '28002',
            city: 'Madrid',
            province: 'Madrid',
            country: 'ES',
          },
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Utility Schemas', () => {
    describe('paginationSchema', () => {
      it('should provide defaults', () => {
        const result = paginationSchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.sortOrder).toBe('asc');
      });

      it('should coerce string numbers', () => {
        const result = paginationSchema.parse({
          page: '2',
          limit: '50',
        });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(50);
      });

      it('should enforce maximum limit', () => {
        const result = paginationSchema.safeParse({
          limit: 999,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('dateRangeSchema', () => {
      it('should accept valid date range', () => {
        const result = dateRangeSchema.safeParse({
          from: '2024-01-01',
          to: '2024-12-31',
        });
        expect(result.success).toBe(true);
      });

      it('should reject if end is before start', () => {
        const result = dateRangeSchema.safeParse({
          from: '2024-12-31',
          to: '2024-01-01',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types', () => {
      const result = LoginSchema.parse({
        email: 'test@example.com',
        password: 'password',
      });

      // TypeScript should infer these types
      expect(typeof result.email).toBe('string');
      expect(typeof result.password).toBe('string');
      expect(typeof result.rememberMe).toBe('boolean');
    });
  });
});
