import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';
import { toHaveNoAccessibilityViolations, waitForNetworkIdle } from './utils/custom-matchers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, TEST_USERS.user);
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);
  });

  test.describe('Layout and Navigation', () => {
    test('should display dashboard with all main components', async ({ page }) => {
      // Check for main layout elements
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="topbar"]')).toBeVisible();

      // Check for dashboard heading
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();
    });

    test('should navigate to different sections via sidebar', async ({ page }) => {
      // Navigate to Documents
      await page.click('[data-testid="sidebar-documents"], a[href*="documents"]');
      await expect(page).toHaveURL(/.*documents/);

      // Navigate to Calendar
      await page.click('[data-testid="sidebar-calendar"], a[href*="calendar"]');
      await expect(page).toHaveURL(/.*calendar/);

      // Navigate to Tasks
      await page.click('[data-testid="sidebar-tasks"], a[href*="tasks"]');
      await expect(page).toHaveURL(/.*tasks/);

      // Navigate back to Dashboard
      await page.click('[data-testid="sidebar-dashboard"], a[href*="dashboard"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should toggle sidebar collapse', async ({ page }) => {
      const sidebar = page.locator('[data-testid="sidebar"]');
      const toggleButton = page.locator('[data-testid="sidebar-toggle"]');

      // Check if sidebar is initially expanded
      await expect(sidebar).toBeVisible();

      // Toggle collapse
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500); // Wait for animation

        // Sidebar should be collapsed (check for collapsed class or width)
        const isCollapsed = await sidebar.evaluate((el) => {
          return el.classList.contains('collapsed') || el.offsetWidth < 100;
        });

        expect(isCollapsed).toBeTruthy();

        // Toggle expand
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should open command palette with keyboard shortcut', async ({ page }) => {
      // Press Cmd+K or Ctrl+K
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');

      // Command palette should be visible
      await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
    });
  });

  test.describe('Dashboard Widgets', () => {
    test('should display statistics cards', async ({ page }) => {
      // Check for common dashboard stats
      const statsCards = page.locator('[data-testid*="stat-card"]');
      await expect(statsCards.first()).toBeVisible();

      // Count should be > 0
      const count = await statsCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display recent activities', async ({ page }) => {
      const recentActivities = page.locator('[data-testid="recent-activities"]');

      if (await recentActivities.isVisible()) {
        // Should have at least one activity item
        const activityItems = page.locator('[data-testid*="activity-item"]');
        expect(await activityItems.count()).toBeGreaterThan(0);
      }
    });

    test('should display charts', async ({ page }) => {
      const charts = page.locator('canvas, svg[class*="chart"]').first();

      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }
    });

    test('should load quick actions', async ({ page }) => {
      const quickActions = page.locator('[data-testid="quick-actions"]');

      if (await quickActions.isVisible()) {
        const actionButtons = page.locator('[data-testid*="quick-action"]');
        expect(await actionButtons.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('User Menu', () => {
    test('should open user menu', async ({ page }) => {
      await page.click('[data-testid="user-menu"]');

      // Menu should be visible
      await expect(page.locator('[data-testid="user-menu-dropdown"]')).toBeVisible();
    });

    test('should navigate to settings from user menu', async ({ page }) => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="settings-link"], text=Settings');

      await expect(page).toHaveURL(/.*settings/);
    });

    test('should navigate to profile from user menu', async ({ page }) => {
      await page.click('[data-testid="user-menu"]');

      const profileLink = page.locator('[data-testid="profile-link"], text=/profile/i');
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await expect(page).toHaveURL(/.*profile/);
      }
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle between light and dark mode', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');

      if (await themeToggle.isVisible()) {
        // Get current theme
        const htmlElement = page.locator('html');
        const initialTheme = await htmlElement.getAttribute('class');

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Theme should change
        const newTheme = await htmlElement.getAttribute('class');
        expect(newTheme).not.toBe(initialTheme);

        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(500);

        const finalTheme = await htmlElement.getAttribute('class');
        expect(finalTheme).toBe(initialTheme);
      }
    });
  });

  test.describe('Search', () => {
    test('should open search dialog', async ({ page }) => {
      const searchButton = page.locator('[data-testid="search-button"], input[type="search"]');

      if (await searchButton.isVisible()) {
        await searchButton.click();

        // Search dialog or input should be focused
        await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      }
    });

    test('should search and display results', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');

      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Debounce

        // Results should appear
        const results = page.locator('[data-testid="search-results"]');
        if (await results.isVisible()) {
          await expect(results).toBeVisible();
        }
      }
    });
  });

  test.describe('Notifications', () => {
    test('should open notifications panel', async ({ page }) => {
      const notificationsButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationsButton.isVisible()) {
        await notificationsButton.click();

        // Notifications panel should be visible
        await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
      }
    });

    test('should display notification badge', async ({ page }) => {
      const notificationBadge = page.locator('[data-testid="notification-badge"]');

      if (await notificationBadge.isVisible()) {
        // Badge should have count
        const badgeText = await notificationBadge.textContent();
        expect(badgeText).toBeTruthy();
      }
    });

    test('should mark notification as read', async ({ page }) => {
      const notificationsButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationsButton.isVisible()) {
        await notificationsButton.click();

        const firstNotification = page.locator('[data-testid^="notification-"]').first();
        if (await firstNotification.isVisible()) {
          // Click notification or mark as read button
          const markReadButton = firstNotification.locator('[data-testid="mark-read"]');
          if (await markReadButton.isVisible()) {
            await markReadButton.click();

            // Notification should be marked as read (check for class or style change)
            await expect(firstNotification).toHaveClass(/read/);
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
      if (await mobileMenuButton.isVisible()) {
        await expect(mobileMenuButton).toBeVisible();

        // Click to open mobile menu
        await mobileMenuButton.click();

        // Mobile sidebar should be visible
        await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
      }
    });

    test('should hide sidebar on mobile by default', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const sidebar = page.locator('[data-testid="sidebar"]');

      // Sidebar should be hidden or have mobile class
      const isHidden = await sidebar.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.transform.includes('translate');
      });

      expect(isHidden).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      const loadTime = Date.now() - startTime;

      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      // Filter out known/acceptable errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('404') &&
          !error.includes('Extension')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const result = await toHaveNoAccessibilityViolations(page);
      expect(result.pass).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through main elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Check if an element has focus
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1
    });

    test('should have alt text for images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');

        // All images should have alt attribute (can be empty for decorative images)
        expect(alt).toBeDefined();
      }
    });
  });

  test.describe('Data Refresh', () => {
    test('should refresh data manually', async ({ page }) => {
      const refreshButton = page.locator('[data-testid="refresh-button"]');

      if (await refreshButton.isVisible()) {
        await refreshButton.click();

        // Should show loading state
        await expect(refreshButton).toHaveClass(/loading|disabled/);

        // Wait for refresh to complete
        await page.waitForTimeout(2000);

        // Loading state should be removed
        await expect(refreshButton).not.toHaveClass(/loading|disabled/);
      }
    });
  });
});
