import { test, expect } from '@playwright/test';
import { login, logout, register, TEST_USERS, clearAuth } from './utils/auth-helpers';
import { generateUser } from './utils/test-data';
import { toHaveNoAccessibilityViolations } from './utils/custom-matchers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');

      // Check if all form elements are present
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check for social login buttons
      await expect(page.locator('text=Or continue with')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await login(page, TEST_USERS.user);

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);

      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/Invalid.*password/i')).toBeVisible({ timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/valid email/i')).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123');
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/at least 6 characters/i')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/auth/login');

      const passwordInput = page.locator('input[type="password"]');
      const toggleButton = page.locator('button:has-text("Show password"), button:near(input[type="password"])').last();

      // Password should be hidden initially
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await toggleButton.click();

      // Password should be visible
      await expect(page.locator('input[type="text"][placeholder*="password" i]')).toBeVisible();

      // Click toggle again
      await toggleButton.click();

      // Password should be hidden again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should remember me checkbox work', async ({ page }) => {
      await page.goto('/auth/login');

      const rememberMeCheckbox = page.locator('input[type="checkbox"][id="rememberMe"]');

      // Check the checkbox
      await rememberMeCheckbox.check();
      await expect(rememberMeCheckbox).toBeChecked();

      // Uncheck the checkbox
      await rememberMeCheckbox.uncheck();
      await expect(rememberMeCheckbox).not.toBeChecked();
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/auth/login');

      await page.click('text=Forgot password?');

      await expect(page).toHaveURL(/.*forgot-password/);
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/auth/login');

      await page.click('text=Sign up');

      await expect(page).toHaveURL(/.*register/);
    });

    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/auth/login');

      const result = await toHaveNoAccessibilityViolations(page);
      expect(result.pass).toBeTruthy();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[type="email"]', TEST_USERS.user.email);
      await page.fill('input[type="password"]', TEST_USERS.user.password);

      // Click submit and check for loading state
      await page.click('button[type="submit"]');

      // Should show loading spinner or disabled button
      await expect(page.locator('button[type="submit"][disabled]')).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/auth/register');

      // Check if all form elements are present
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should register successfully with valid data', async ({ page }) => {
      const newUser = generateUser();

      await register(page, {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
      });

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/auth/register');

      const user = generateUser();

      await page.fill('input[name="name"]', user.name);
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.fill('input[name="confirmPassword"]', 'differentpassword');

      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/password.*match/i')).toBeVisible();
    });

    test('should validate email uniqueness', async ({ page }) => {
      await page.goto('/auth/register');

      // Try to register with existing user email
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', TEST_USERS.user.email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.check('input[name="terms"]');

      await page.click('button[type="submit"]');

      // Should show error about email already existing
      await expect(page.locator('text=/email.*already.*exist/i')).toBeVisible({ timeout: 5000 });
    });

    test('should require terms acceptance', async ({ page }) => {
      await page.goto('/auth/register');

      const user = generateUser();

      await page.fill('input[name="name"]', user.name);
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.fill('input[name="confirmPassword"]', user.password);

      // Don't check terms checkbox
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/accept.*terms/i')).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth/register');

      await page.click('text=Sign in');

      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await login(page, TEST_USERS.user);

      // Logout
      await logout(page);

      // Should redirect to login page
      await expect(page).toHaveURL(/.*auth\/login/);

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect back to login
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should clear auth tokens on logout', async ({ page }) => {
      // Login first
      await login(page, TEST_USERS.user);

      // Check tokens exist
      const tokensBefore = await page.evaluate(() => ({
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token'),
      }));

      expect(tokensBefore.access).toBeTruthy();
      expect(tokensBefore.refresh).toBeTruthy();

      // Logout
      await logout(page);

      // Check tokens are cleared
      const tokensAfter = await page.evaluate(() => ({
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token'),
      }));

      expect(tokensAfter.access).toBeNull();
      expect(tokensAfter.refresh).toBeNull();
    });
  });

  test.describe('Forgot Password', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should submit forgot password request', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.fill('input[type="email"]', TEST_USERS.user.email);
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=/reset.*link.*sent/i')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back to login', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.click('text=/back.*login/i');

      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Login first
      await login(page, TEST_USERS.user);

      // Access protected route
      await page.goto('/documents');

      // Should not redirect to login
      await expect(page).not.toHaveURL(/.*auth\/login/);
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session after page reload', async ({ page }) => {
      // Login
      await login(page, TEST_USERS.user);

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });
});
