import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const TEST_USERS = {
  admin: {
    email: 'admin@ait-core.com',
    password: 'Admin123!',
    name: 'Admin User',
  },
  user: {
    email: 'user@ait-core.com',
    password: 'User123!',
    name: 'Test User',
  },
  collaborator: {
    email: 'collaborator@ait-core.com',
    password: 'Collab123!',
    name: 'Collaborator User',
  },
} as const;

/**
 * Login helper function
 * @param page - Playwright page instance
 * @param user - User credentials (email and password)
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/auth/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify successful login
  await expect(page).toHaveURL(/.*dashboard/);
}

/**
 * Login via API (faster than UI login)
 * @param page - Playwright page instance
 * @param user - User credentials
 */
export async function loginViaAPI(page: Page, user: TestUser) {
  const response = await page.request.post('http://localhost:3003/api/auth/login', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const data = await response.json();

  // Store tokens in localStorage
  await page.goto('/');
  await page.evaluate((tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }, data);

  // Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper function
 * @param page - Playwright page instance
 */
export async function logout(page: Page) {
  // Click on user menu
  await page.click('[data-testid="user-menu"]');

  // Wait for dropdown to appear
  await page.waitForSelector('[data-testid="logout-button"]', { state: 'visible' });

  // Click logout
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login
  await page.waitForURL('**/auth/login', { timeout: 10000 });

  // Verify logout
  await expect(page).toHaveURL(/.*auth\/login/);
}

/**
 * Check if user is authenticated
 * @param page - Playwright page instance
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
  return !!accessToken;
}

/**
 * Clear authentication state
 * @param page - Playwright page instance
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  });
}

/**
 * Setup authenticated session
 * Useful for tests that don't need to test login flow
 * @param page - Playwright page instance
 * @param user - User to authenticate as
 */
export async function setupAuthenticatedSession(page: Page, user: TestUser = TEST_USERS.user) {
  await loginViaAPI(page, user);
}

/**
 * Register a new user
 * @param page - Playwright page instance
 * @param user - User details
 */
export async function register(page: Page, user: TestUser) {
  await page.goto('/auth/register');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in registration form
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);

  // Accept terms
  await page.check('input[name="terms"]');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success or redirect
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Wait for authentication redirect
 * @param page - Playwright page instance
 */
export async function waitForAuthRedirect(page: Page) {
  await page.waitForURL((url) => {
    return url.pathname === '/auth/login' || url.pathname === '/dashboard';
  }, { timeout: 10000 });
}

/**
 * Mock authentication for offline testing
 * @param page - Playwright page instance
 * @param user - User to mock
 */
export async function mockAuth(page: Page, user: TestUser) {
  await page.addInitScript((mockUser) => {
    localStorage.setItem('access_token', 'mock-access-token');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      email: mockUser.email,
      name: mockUser.name,
      role: 'user',
    }));
  }, user);
}
