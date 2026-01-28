import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Dashboard Overview', () => {
    test('should display dashboard with all widgets', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('[data-testid="stats-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="modules-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    });

    test('should display system statistics', async ({ page }) => {
      const statsWidget = page.locator('[data-testid="stats-widget"]');

      await expect(statsWidget.locator('text=Active Modules')).toBeVisible();
      await expect(statsWidget.locator('text=Total Users')).toBeVisible();
      await expect(statsWidget.locator('text=System Health')).toBeVisible();
    });

    test('should refresh data on demand', async ({ page }) => {
      const refreshButton = page.locator('button[aria-label="Refresh data"]');
      await refreshButton.click();

      await expect(page.locator('text=Data refreshed')).toBeVisible();
    });

    test('should navigate between dashboard sections', async ({ page }) => {
      await page.click('text=Analytics');
      await expect(page).toHaveURL('/dashboard/analytics');

      await page.click('text=Policies');
      await expect(page).toHaveURL('/dashboard/policies');

      await page.click('text=Dashboard');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Module Management', () => {
    test('should display active modules', async ({ page }) => {
      const modulesSection = page.locator('[data-testid="modules-overview"]');

      await expect(modulesSection).toBeVisible();
      await expect(modulesSection.locator('.module-card')).toHaveCount(3, {
        timeout: 10000,
      });
    });

    test('should enable/disable modules', async ({ page }) => {
      await page.goto('/dashboard/modules');

      const moduleToggle = page
        .locator('[data-testid="module-ai-accountant"]')
        .locator('button[aria-label="Toggle module"]');

      await moduleToggle.click();
      await expect(page.locator('text=Module updated')).toBeVisible();
    });

    test('should configure module settings', async ({ page }) => {
      await page.goto('/dashboard/modules');

      await page
        .locator('[data-testid="module-ai-accountant"]')
        .locator('button[aria-label="Configure"]')
        .click();

      await expect(page.locator('text=Module Configuration')).toBeVisible();

      await page.fill('input[name="apiKey"]', 'test-api-key');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Configuration saved')).toBeVisible();
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent activities', async ({ page }) => {
      const activityFeed = page.locator('[data-testid="recent-activity"]');

      await expect(activityFeed).toBeVisible();
      await expect(activityFeed.locator('.activity-item')).toHaveCount(5, {
        timeout: 10000,
      });
    });

    test('should filter activities by type', async ({ page }) => {
      await page.selectOption('select[name="activityType"]', 'login');

      const activities = page.locator('.activity-item');
      await expect(activities.first()).toContainText('logged in');
    });

    test('should load more activities on scroll', async ({ page }) => {
      const activityFeed = page.locator('[data-testid="recent-activity"]');

      const initialCount = await activityFeed.locator('.activity-item').count();

      await activityFeed.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(1000);

      const newCount = await activityFeed.locator('.activity-item').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Search Functionality', () => {
    test('should search across modules', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('accounting');

      await page.waitForTimeout(500); // Debounce

      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible();
      await expect(results.locator('.search-result')).toHaveCount(3, {
        timeout: 5000,
      });
    });

    test('should navigate to search result on click', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('balance sheet');

      await page.waitForTimeout(500);

      await page.click('[data-testid="search-results"] .search-result:first-child');

      await expect(page).toHaveURL(/\/dashboard\/accounting/);
    });

    test('should show "no results" for invalid search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('xyznonexistent123');

      await page.waitForTimeout(500);

      await expect(page.locator('text=No results found')).toBeVisible();
    });
  });

  test.describe('Notifications', () => {
    test('should display notification bell with count', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]');

      await expect(notificationBell).toBeVisible();
      await expect(notificationBell.locator('.badge')).toContainText('3');
    });

    test('should open notifications panel', async ({ page }) => {
      await page.click('[data-testid="notification-bell"]');

      const notificationsPanel = page.locator('[data-testid="notifications-panel"]');
      await expect(notificationsPanel).toBeVisible();
      await expect(notificationsPanel.locator('.notification-item')).toHaveCount(3, {
        timeout: 5000,
      });
    });

    test('should mark notification as read', async ({ page }) => {
      await page.click('[data-testid="notification-bell"]');

      const notification = page.locator('.notification-item:first-child');
      await notification.locator('button[aria-label="Mark as read"]').click();

      await expect(notification).toHaveClass(/read/);
    });

    test('should mark all notifications as read', async ({ page }) => {
      await page.click('[data-testid="notification-bell"]');

      await page.click('button:has-text("Mark all as read")');

      const unreadBadge = page.locator('[data-testid="notification-bell"] .badge');
      await expect(unreadBadge).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('[aria-label="Open menu"]');
      await expect(mobileMenuButton).toBeVisible();

      await mobileMenuButton.click();

      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should stack widgets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const widgets = page.locator('.widget');
      const firstWidget = widgets.first();
      const secondWidget = widgets.nth(1);

      const firstBox = await firstWidget.boundingBox();
      const secondBox = await secondWidget.boundingBox();

      // Widgets should be stacked vertically
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should lazy load module content', async ({ page }) => {
      const moduleCard = page.locator('[data-testid="module-ai-accountant"]');

      // Module should show loading state initially
      await expect(moduleCard.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Content should load
      await expect(moduleCard.locator('[data-testid="module-content"]')).toBeVisible({
        timeout: 5000,
      });

      // Loading spinner should disappear
      await expect(moduleCard.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    });
  });
});
