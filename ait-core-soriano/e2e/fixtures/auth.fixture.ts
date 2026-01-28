import { test as base, Page } from '@playwright/test';

/**
 * Authentication fixtures and utilities
 * Provides authenticated page contexts for tests
 */

export interface AuthUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'agent' | 'user';
}

export const testUsers: Record<string, AuthUser> = {
  admin: {
    email: 'admin@soriano.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin',
  },
  agent: {
    email: 'agent@soriano.com',
    password: 'Agent123!',
    name: 'Agent User',
    role: 'agent',
  },
  user: {
    email: 'user@soriano.com',
    password: 'User123!',
    name: 'Regular User',
    role: 'user',
  },
};

/**
 * Login helper function
 */
export async function login(page: Page, user: AuthUser): Promise<void> {
  await page.goto('/auth/login');

  // Wait for the login form to be visible
  await page.waitForSelector('input[id="email"]', { state: 'visible' });

  // Fill in login credentials
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify we're logged in by checking for dashboard elements
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 5000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Look for user menu or logout button
  const userMenuButton = page.locator('[data-testid="user-menu"]').or(
    page.locator('button:has-text("Cerrar sesión")').first()
  );

  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();

    // Click logout option
    const logoutButton = page.locator('text=Cerrar sesión').or(
      page.locator('[data-testid="logout-button"]')
    );
    await logoutButton.click();

    // Wait for redirect to login
    await page.waitForURL('**/auth/login', { timeout: 5000 });
  }
}

/**
 * Extended test fixture with authenticated context
 */
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
  agentPage: Page;
}>({
  // Authenticated page as regular user
  authenticatedPage: async ({ page }, use) => {
    await login(page, testUsers.user);
    await use(page);
    await logout(page);
  },

  // Authenticated page as admin
  adminPage: async ({ page }, use) => {
    await login(page, testUsers.admin);
    await use(page);
    await logout(page);
  },

  // Authenticated page as agent
  agentPage: async ({ page }, use) => {
    await login(page, testUsers.agent);
    await use(page);
    await logout(page);
  },
});

export { expect } from '@playwright/test';
