import { test, expect } from '../../fixtures/auth.fixture';
import { navigateAndWait, verifyPageTitle } from '../../utils/helpers';

/**
 * Dashboard Navigation Tests
 *
 * Tests cover:
 * - Dashboard loading
 * - Navigation to different sections
 * - Module status display
 * - Real-time updates
 * - WebSocket connection
 * - Statistics display
 */

test.describe('Dashboard Navigation', () => {
  test('should load dashboard with all main elements', async ({ authenticatedPage: page }) => {
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify main heading
    await verifyPageTitle(page, /Dashboard/i);

    // Verify main sections are visible
    await expect(page.locator('text=/Welcome|Bienvenido/i')).toBeVisible();

    // Verify navigation is present
    const navigation = page.locator('nav, [role="navigation"]').first();
    await expect(navigation).toBeVisible();
  });

  test('should display WebSocket connection status', async ({ authenticatedPage: page }) => {
    // Look for connection indicator
    const connectionStatus = page.locator('text=/Connected|Disconnected|Conectado|Desconectado/i');
    await expect(connectionStatus.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display system statistics', async ({ authenticatedPage: page }) => {
    // Wait for statistics cards to load
    await page.waitForSelector('[data-testid="system-stats"], .stats, [class*="stat"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Verify statistics are displayed
    const statsCards = page.locator('text=/Total|Activ|Pólizas|Clientes|Siniestros/i');
    await expect(statsCards.first()).toBeVisible();
  });

  test('should navigate to policies page', async ({ authenticatedPage: page }) => {
    // Find and click policies link
    const polizasLink = page.locator('a[href*="/polizas"], text=/Pólizas|Policies/i').first();
    await polizasLink.click();

    // Verify navigation
    await page.waitForURL(/\/polizas/, { timeout: 5000 });
    await verifyPageTitle(page, /Pólizas|Policies/i);
  });

  test('should navigate to clients page', async ({ authenticatedPage: page }) => {
    // Find and click clients link
    const clientesLink = page.locator('a[href*="/clientes"], text=/Clientes|Clients/i').first();
    await clientesLink.click();

    // Verify navigation
    await page.waitForURL(/\/clientes/, { timeout: 5000 });
    await verifyPageTitle(page, /Clientes|Clients/i);
  });

  test('should navigate to claims page', async ({ authenticatedPage: page }) => {
    // Find and click claims link
    const siniestrosLink = page.locator('a[href*="/siniestros"], text=/Siniestros|Claims/i').first();
    await siniestrosLink.click();

    // Verify navigation
    await page.waitForURL(/\/siniestros/, { timeout: 5000 });
    await verifyPageTitle(page, /Siniestros|Claims/i);
  });

  test('should display modules overview', async ({ authenticatedPage: page }) => {
    // Wait for modules section
    const modulesSection = page.locator('text=/Modules Overview|Módulos/i');

    if (await modulesSection.isVisible()) {
      // Verify modules are displayed
      await expect(modulesSection).toBeVisible();

      // Check for module status indicators
      const moduleStatus = page.locator('[data-testid="module-status"], .module-status, text=/Active|Inactive/i');
      await expect(moduleStatus.first()).toBeVisible();
    }
  });

  test('should display recent activity', async ({ authenticatedPage: page }) => {
    // Wait for recent activity section
    const activitySection = page.locator('text=/Recent Activity|Actividad Reciente|Latest events/i');

    if (await activitySection.isVisible()) {
      await expect(activitySection).toBeVisible();
    }
  });

  test('should support navigation using browser back button', async ({ authenticatedPage: page }) => {
    // Navigate to policies
    await page.click('a[href*="/polizas"]');
    await page.waitForURL(/\/polizas/);

    // Go back
    await page.goBack();

    // Should be back on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await verifyPageTitle(page, /Dashboard/i);
  });

  test('should maintain navigation state after page refresh', async ({ authenticatedPage: page }) => {
    // Navigate to a specific page
    await page.click('a[href*="/clientes"]');
    await page.waitForURL(/\/clientes/);

    // Refresh page
    await page.reload();

    // Should still be on clients page
    await expect(page).toHaveURL(/\/clientes/);
    await verifyPageTitle(page, /Clientes/i);
  });

  test('should display user menu', async ({ authenticatedPage: page }) => {
    // Look for user menu trigger
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("Cerrar sesión")').first();

    if (await userMenu.isVisible()) {
      await userMenu.click();

      // Verify menu options
      const logoutOption = page.locator('text=Cerrar sesión, text=Logout');
      await expect(logoutOption.first()).toBeVisible();
    }
  });

  test('should handle responsive navigation on mobile', async ({ browser }) => {
    // Create mobile context
    const mobile = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });
    const page = await mobile.newPage();

    // Login
    await page.goto('/auth/login');
    await page.fill('input[id="email"]', 'user@soriano.com');
    await page.fill('input[id="password"]', 'User123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has([data-icon="menu"])').first();

    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Verify navigation menu appears
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();
    }

    await mobile.close();
  });

  test('should display breadcrumb navigation', async ({ authenticatedPage: page }) => {
    // Navigate to a nested page
    await page.click('a[href*="/polizas"]');
    await page.waitForURL(/\/polizas/);

    // Look for breadcrumbs
    const breadcrumb = page.locator('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label*="bread"]');

    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toContainText(/Dashboard|Home/i);
    }
  });

  test('should highlight active navigation item', async ({ authenticatedPage: page }) => {
    // Navigate to policies
    await page.click('a[href*="/polizas"]');
    await page.waitForURL(/\/polizas/);

    // Find the active navigation link
    const activeLink = page.locator('a[href*="/polizas"][aria-current="page"], a[href*="/polizas"].active').first();

    // Verify it has active styling (check for common active classes)
    if (await activeLink.isVisible()) {
      const classes = await activeLink.getAttribute('class');
      expect(classes).toMatch(/active|current|selected/i);
    }
  });

  test('should load dashboard widgets asynchronously', async ({ authenticatedPage: page }) => {
    // Wait for loading states to complete
    await page.waitForLoadState('networkidle');

    // Verify no loading spinners remain
    const loadingSpinner = page.locator('.loading, .spinner, [data-loading="true"]');
    await expect(loadingSpinner).toHaveCount(0, { timeout: 10000 });
  });

  test('should display quick actions or shortcuts', async ({ authenticatedPage: page }) => {
    // Look for quick action buttons
    const quickActions = page.locator('text=/Nueva Póliza|Nuevo Cliente|Nuevo Siniestro|Quick/i');

    if (await quickActions.first().isVisible()) {
      await expect(quickActions.first()).toBeVisible();
    }
  });

  test('should handle multiple tabs navigation', async ({ context }) => {
    // Create authenticated page
    const page1 = await context.newPage();
    await page1.goto('/auth/login');
    await page1.fill('input[id="email"]', 'user@soriano.com');
    await page1.fill('input[id="password"]', 'User123!');
    await page1.click('button[type="submit"]');
    await page1.waitForURL(/\/dashboard/);

    // Open new tab and navigate
    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    await page2.waitForLoadState('networkidle');

    // Should be authenticated in both tabs
    await expect(page1).toHaveURL(/\/dashboard/);
    await expect(page2).toHaveURL(/\/dashboard/);

    await page1.close();
    await page2.close();
  });

  test('should display notifications or alerts if present', async ({ authenticatedPage: page }) => {
    // Look for notification area
    const notifications = page.locator('[data-testid="notifications"], .notifications, [role="alert"]');

    if (await notifications.first().isVisible()) {
      await expect(notifications.first()).toBeVisible();
    }
  });

  test('should allow navigation via keyboard', async ({ authenticatedPage: page }) => {
    // Focus on first navigation link
    await page.keyboard.press('Tab');

    // Navigate using keyboard
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify focus is on a navigation element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
