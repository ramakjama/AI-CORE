import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should show validation errors for invalid inputs', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', '123');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email')).toBeVisible();
      await expect(page.locator('text=Password must be at least')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Email already exists')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.click('text=Sign In');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidPassword123!');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('text=Sign In');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL('/login');
    });

    test('should remember user with "Remember me" checkbox', async ({ page }) => {
      await page.click('text=Sign In');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.check('input[name="rememberMe"]');

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Check if cookie is set
      const cookies = await page.context().cookies();
      expect(cookies.some((c) => c.name === 'refreshToken')).toBeTruthy();
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await page.click('text=Sign In');
      await page.click('text=Forgot password?');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Reset link sent')).toBeVisible();
    });

    test('should reset password with valid token', async ({ page }) => {
      const resetToken = 'valid-reset-token-12345';
      await page.goto(`/reset-password?token=${resetToken}`);

      await page.fill('input[name="newPassword"]', 'NewSecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'NewSecurePassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Password reset successful')).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('should show error for expired reset token', async ({ page }) => {
      await page.goto('/reset-password?token=expired-token');

      await page.fill('input[name="newPassword"]', 'NewSecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'NewSecurePassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Reset link expired')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Logout');

      await expect(page).toHaveURL('/');

      // Verify tokens are cleared
      const cookies = await context.cookies();
      expect(cookies.some((c) => c.name === 'accessToken')).toBeFalsy();
    });
  });

  test.describe('Session Management', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should auto-logout on session expiration', async ({ page }) => {
      // Set very short session timeout for testing
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Wait for session to expire (mock or wait)
      await page.waitForTimeout(5000);

      // Try to access protected resource
      await page.goto('/dashboard/settings');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=Session expired')).toBeVisible();
    });
  });
});
