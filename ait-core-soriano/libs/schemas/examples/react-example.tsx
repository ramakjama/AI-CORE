/**
 * React Integration Examples
 *
 * Shows how to use @ait-core/schemas with React Hook Form
 */

import React from 'react';
import {
  // Hooks
  useZodForm,
  useZodMultiStepForm,
  useZodValidation,

  // Schemas
  LoginSchema,
  RegisterSchema,
  CreateCustomerSchema,
  CreatePolicySchema,

  // Types
  LoginInput,
  RegisterInput,
  CreateCustomerInput,
  CreatePolicyInput,
} from '@ait-core/schemas';

// ============================================
// EXAMPLE 1: Simple Login Form
// ============================================

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(LoginSchema);

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 2: Registration Form with Validation
// ============================================

function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm(RegisterSchema);

  const password = watch('password');

  const onSubmit = async (data: RegisterInput) => {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input type="email" {...register('email')} />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <label>Phone</label>
        <input {...register('phone')} />
        {errors.phone && <p className="error">{errors.phone.message}</p>}
      </div>

      <div>
        <label>Password</label>
        <input type="password" {...register('password')} />
        {errors.password && <p className="error">{errors.password.message}</p>}
        <p className="text-sm text-gray-500">
          Must contain uppercase, lowercase, number, and special character
        </p>
      </div>

      <div>
        <label>Confirm Password</label>
        <input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('acceptTerms')} />
          I accept the terms and conditions
        </label>
        {errors.acceptTerms && (
          <p className="error">{errors.acceptTerms.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('acceptPrivacy')} />
          I accept the privacy policy
        </label>
        {errors.acceptPrivacy && (
          <p className="error">{errors.acceptPrivacy.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: Multi-Step Form
// ============================================

import { Step1Schema, Step2Schema, Step3Schema } from './policy-form-schemas';

function MultiStepPolicyForm() {
  const schemas = [Step1Schema, Step2Schema, Step3Schema];

  const {
    form,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
  } = useZodMultiStepForm(schemas);

  const [formData, setFormData] = React.useState({});

  const onSubmit = (data: any) => {
    if (isLastStep) {
      // Submit all data
      console.log('Final data:', { ...formData, ...data });
    } else {
      // Save current step and move to next
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p>Step {currentStep + 1} of {totalSteps}</p>
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Render appropriate step */}
        {currentStep === 0 && <Step1Fields register={form.register} errors={form.formState.errors} />}
        {currentStep === 1 && <Step2Fields register={form.register} errors={form.formState.errors} />}
        {currentStep === 2 && <Step3Fields register={form.register} errors={form.formState.errors} />}

        <div className="flex justify-between mt-4">
          {!isFirstStep && (
            <button type="button" onClick={prevStep}>
              Previous
            </button>
          )}
          <button type="submit">
            {isLastStep ? 'Submit' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Field-Level Validation
// ============================================

function CustomValidationForm() {
  const { validate, validateField, errors, clearFieldError } = useZodValidation(
    CreateCustomerSchema
  );

  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    phone: '',
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    clearFieldError(field);
  };

  const handleFieldBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate(formData)) {
      console.log('Valid data:', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={(e) => handleFieldBlur('email', e.target.value)}
        />
        {errors.email && <p className="error">{errors.email}</p>}
      </div>

      <div>
        <input
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          onBlur={(e) => handleFieldBlur('name', e.target.value)}
        />
        {errors.name && <p className="error">{errors.name}</p>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

// ============================================
// EXAMPLE 5: Dynamic Form with Array Fields
// ============================================

function InvoiceForm() {
  const { register, handleSubmit, control, watch, formState: { errors } } = useZodForm(
    CreateInvoiceSchema
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');

  // Calculate totals automatically
  const subtotal = items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
  const taxTotal = items?.reduce((sum, item) => {
    const tax = (item.subtotal || 0) * ((item.taxRate || 0) / 100);
    return sum + tax;
  }, 0) || 0;
  const total = subtotal + taxTotal;

  const onSubmit = (data: any) => {
    console.log('Invoice data:', { ...data, subtotal, taxTotal, total });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Invoice Items</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 mb-4">
          <input
            {...register(`items.${index}.description`)}
            placeholder="Description"
          />
          <input
            type="number"
            {...register(`items.${index}.quantity`)}
            placeholder="Quantity"
          />
          <input
            type="number"
            {...register(`items.${index}.unitPrice`)}
            placeholder="Unit Price"
          />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            description: '',
            quantity: 1,
            unitPrice: 0,
            subtotal: 0,
            total: 0,
          })
        }
      >
        Add Item
      </button>

      <div className="mt-4">
        <p>Subtotal: €{subtotal.toFixed(2)}</p>
        <p>Tax: €{taxTotal.toFixed(2)}</p>
        <p>Total: €{total.toFixed(2)}</p>
      </div>

      <button type="submit">Create Invoice</button>
    </form>
  );
}

// ============================================
// EXAMPLE 6: Async Validation
// ============================================

import { z } from 'zod';

function AsyncEmailValidationForm() {
  const checkEmailExists = async (email: string) => {
    const response = await fetch(`/api/users/check-email?email=${email}`);
    const { exists } = await response.json();
    return !exists;
  };

  const ExtendedRegisterSchema = RegisterSchema.refine(
    async (data) => {
      return await checkEmailExists(data.email);
    },
    {
      message: 'Email already exists',
      path: ['email'],
    }
  );

  const { register, handleSubmit, formState: { errors, isValidating } } = useZodForm(
    ExtendedRegisterSchema
  );

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <div>
        <input {...register('email')} />
        {isValidating && <span>Checking email...</span>}
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export {
  LoginForm,
  RegisterForm,
  MultiStepPolicyForm,
  CustomValidationForm,
  InvoiceForm,
  AsyncEmailValidationForm,
};
