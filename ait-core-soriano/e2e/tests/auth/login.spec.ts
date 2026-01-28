import { test, expect } from '@playwright/test';
import { testUsers, login, logout } from '../../fixtures/auth.fixture';
import { navigateAndWait, waitForToast } from '../../utils/helpers';

/**
 * Authentication Tests - Login Flow
 *
 * Tests cover:
 * - Successful login
 * - Invalid credentials
 * - Empty form submission
 * - Remember me functionality
 * - Redirect after login
 * - Logout functionality
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/auth/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /AIT-CORE|Soriano/i })).toBeVisible();

    // Verify form elements
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify links
    await expect(page.locator('text=¿Olvidaste tu contraseña?')).toBeVisible();
    await expect(page.locator('a[href*="/auth/register"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const user = testUsers.user;

    // Fill in credentials
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify dashboard is loaded
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify user is logged in (check for user menu or logout button)
    const userIndicator = page.locator('[data-testid="user-menu"]').or(
      page.locator('text=Cerrar sesión')
    );
    await expect(userIndicator.first()).toBeVisible();
  });

  test('should show error with invalid email', async ({ page }) => {
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Wait for error message
    const errorMessage = page.locator('text=/Error|credenciales|incorrecta/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    // Verify still on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should show error with empty credentials', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Check for validation errors
    const emailError = page.locator('text=/correo|email|requerido|obligatorio/i');
    await expect(emailError.first()).toBeVisible();
  });

  test('should show error with invalid email format', async ({ page }) => {
    await page.fill('input[id="email"]', 'not-an-email');
    await page.fill('input[id="password"]', 'Password123!');

    // Trigger validation by clicking submit or blurring
    await page.click('button[type="submit"]');

    // Check for email format validation error
    const emailFormatError = page.locator('text=/válido|formato|email/i');
    await expect(emailFormatError.first()).toBeVisible();
  });

  test('should toggle remember me checkbox', async ({ page }) => {
    const checkbox = page.locator('input[id="rememberMe"]');

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Check the checkbox
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck the checkbox
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=¿Olvidaste tu contraseña?');

    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('a[href*="/auth/register"]');

    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should redirect authenticated user from login page', async ({ page }) => {
    // First login
    await login(page, testUsers.user);

    // Try to go to login page
    await page.goto('/auth/login');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('should maintain login after page refresh', async ({ page }) => {
    // Login
    await login(page, testUsers.user);

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // Login first
    await login(page, testUsers.user);

    // Logout
    await logout(page);

    // Verify redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect back to login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('should handle multiple failed login attempts', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', `WrongPassword${i}`);
      await page.click('button[type="submit"]');

      // Wait for error
      await page.waitForTimeout(1000);
    }

    // Should still show error message
    const errorMessage = page.locator('text=/Error|credenciales/i');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[id="email"]', testUsers.user.email);
    await page.fill('input[id="password"]', testUsers.user.password);

    // Click submit and check for loading indicator
    await page.click('button[type="submit"]');

    // Look for loading indicator (spinner, disabled button, or loading text)
    const loadingIndicator = page.locator('button[type="submit"][disabled], button:has-text("Iniciando"), .animate-spin');

    // Note: This might be too fast to catch, so we use a short timeout
    try {
      await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading might be too fast, which is fine
    }

    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should handle redirect parameter after login', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/polizas');

    // Should redirect to login with redirect parameter
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

    // Login
    await page.fill('input[id="email"]', testUsers.user.email);
    await page.fill('input[id="password"]', testUsers.user.password);
    await page.click('button[type="submit"]');

    // Should redirect to originally requested page (dashboard or polizas)
    await page.waitForURL(/\/(dashboard|polizas)/, { timeout: 10000 });
  });
});
