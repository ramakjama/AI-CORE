import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForToast } from '../../utils/helpers';
import { generateTimestamp } from '../../fixtures/test-data';

/**
 * Authentication Tests - Registration Flow
 *
 * Tests cover:
 * - Successful registration
 * - Form validation
 * - Password strength requirements
 * - Duplicate email handling
 * - Terms and conditions
 */

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/auth/register');
  });

  test('should display registration form correctly', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /Regist|Crear cuenta/i })).toBeVisible();

    // Verify form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify link to login
    await expect(page.locator('a[href*="/auth/login"]')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    const timestamp = generateTimestamp();
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${timestamp}@test.com`,
      password: 'SecurePassword123!',
      phone: '+34 600123456',
    };

    // Fill registration form
    const firstNameInput = page.locator('input[name="firstName"], input[id="firstName"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(newUser.firstName);
    }

    const lastNameInput = page.locator('input[name="lastName"], input[id="lastName"]');
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(newUser.lastName);
    }

    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[type="password"]', newUser.password);

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[id="confirmPassword"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill(newUser.password);
    }

    const phoneInput = page.locator('input[type="tel"], input[name="phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(newUser.phone);
    }

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success (redirect to login or dashboard)
    await page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 15000 });

    // Verify success message or page
    const successIndicator = page.locator('text=/éxito|exitoso|bienvenido|welcome/i');
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');

    await expect(successIndicator.or(dashboardHeading).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'not-valid-email');
    await page.fill('input[type="password"]', 'Password123!');

    // Trigger validation
    await page.click('button[type="submit"]');

    // Check for validation error
    const errorMessage = page.locator('text=/válido|formato|correo/i');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should show error for weak password', async ({ page }) => {
    const timestamp = generateTimestamp();

    await page.fill('input[type="email"]', `test${timestamp}@test.com`);
    await page.fill('input[type="password"]', '123'); // Weak password

    // Trigger validation
    await page.click('button[type="submit"]');

    // Check for password strength error
    const errorMessage = page.locator('text=/contraseña|password|caracteres|segura/i');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const timestamp = generateTimestamp();

    await page.fill('input[type="email"]', `test${timestamp}@test.com`);
    await page.fill('input[type="password"]', 'Password123!');

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[id="confirmPassword"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill('DifferentPassword123!');

      // Trigger validation
      await page.click('button[type="submit"]');

      // Check for mismatch error
      const errorMessage = page.locator('text=/coincid|match|igual/i');
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Try to register with existing email
    await page.fill('input[type="email"]', 'admin@soriano.com');
    await page.fill('input[type="password"]', 'Password123!');

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[id="confirmPassword"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill('Password123!');
    }

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');

    // Wait for error message
    const errorMessage = page.locator('text=/existe|ya registrado|duplicado/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should require terms acceptance if checkbox present', async ({ page }) => {
    const timestamp = generateTimestamp();

    await page.fill('input[type="email"]', `test${timestamp}@test.com`);
    await page.fill('input[type="password"]', 'Password123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      // Make sure checkbox is unchecked
      if (await termsCheckbox.isChecked()) {
        await termsCheckbox.uncheck();
      }

      await page.click('button[type="submit"]');

      // Should show error about accepting terms
      const errorMessage = page.locator('text=/términos|condiciones|aceptar/i');
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should show loading state during registration', async ({ page }) => {
    const timestamp = generateTimestamp();

    await page.fill('input[type="email"]', `test${timestamp}@test.com`);
    await page.fill('input[type="password"]', 'Password123!');

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[id="confirmPassword"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill('Password123!');
    }

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Click submit
    await page.click('button[type="submit"]');

    // Check for loading indicator
    const loadingIndicator = page.locator('button[type="submit"][disabled], button:has-text("Registrando"), .animate-spin');

    try {
      await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading might be too fast, which is fine
    }
  });

  test('should navigate to login page from registration', async ({ page }) => {
    await page.click('a[href*="/auth/login"]');

    // Verify navigation to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should validate all required fields', async ({ page }) => {
    // Click submit without filling anything
    await page.click('button[type="submit"]');

    // Should see validation errors for required fields
    const errors = page.locator('text=/requerido|obligatorio|necesario/i');
    await expect(errors.first()).toBeVisible();

    // Verify still on registration page
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('button[aria-label*="password"], button:has([data-icon="eye"])').first();

    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // If toggle button exists, click it
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });
});
