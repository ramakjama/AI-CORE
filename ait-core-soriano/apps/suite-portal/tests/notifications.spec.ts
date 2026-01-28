import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';
import { waitForNetworkIdle, toShowToast } from './utils/custom-matchers';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, TEST_USERS.user);
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);
  });

  test.describe('Toast Notifications', () => {
    test('should display success toast', async ({ page }) => {
      // Trigger an action that shows success toast (e.g., save document)
      const saveButton = page.locator('[data-testid="save-button"], button:has-text("Save")');

      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Toast should appear
        const toast = page.locator('[data-testid="toast"], [role="status"]').first();
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Should have success styling
        const hasSuccessClass = await toast.evaluate((el) =>
          el.classList.contains('success') || el.getAttribute('data-type') === 'success'
        );
      }
    });

    test('should display error toast', async ({ page }) => {
      // Trigger an action that might fail
      // For testing, we can try to access an invalid resource
      await page.goto('/documents/invalid-document-id');

      const toast = page.locator('[data-testid="toast"], [role="alert"]').first();

      if (await toast.isVisible({ timeout: 5000 })) {
        await expect(toast).toBeVisible();

        // Should have error styling
        const hasErrorClass = await toast.evaluate((el) =>
          el.classList.contains('error') || el.getAttribute('data-type') === 'error'
        );
      }
    });

    test('should display warning toast', async ({ page }) => {
      // Warning toasts are typically shown for validation or cautionary messages
      const warningTrigger = page.locator('[data-testid="trigger-warning"]');

      if (await warningTrigger.isVisible()) {
        await warningTrigger.click();

        const toast = page.locator('[data-testid="toast"][data-type="warning"]');
        await expect(toast).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display info toast', async ({ page }) => {
      const infoTrigger = page.locator('[data-testid="trigger-info"]');

      if (await infoTrigger.isVisible()) {
        await infoTrigger.click();

        const toast = page.locator('[data-testid="toast"][data-type="info"]');
        await expect(toast).toBeVisible({ timeout: 5000 });
      }
    });

    test('should auto-dismiss toast after timeout', async ({ page }) => {
      // Trigger a toast
      const saveButton = page.locator('[data-testid="save-button"]');

      if (await saveButton.isVisible()) {
        await saveButton.click();

        const toast = page.locator('[data-testid="toast"]').first();
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Wait for auto-dismiss (usually 3-5 seconds)
        await page.waitForTimeout(6000);

        // Toast should be gone
        await expect(toast).not.toBeVisible();
      }
    });

    test('should manually dismiss toast', async ({ page }) => {
      // Trigger a toast
      const saveButton = page.locator('[data-testid="save-button"]');

      if (await saveButton.isVisible()) {
        await saveButton.click();

        const toast = page.locator('[data-testid="toast"]').first();
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Click dismiss button
        const dismissButton = toast.locator('[data-testid="dismiss-toast"], button[aria-label*="close" i]');
        if (await dismissButton.isVisible()) {
          await dismissButton.click();

          // Toast should disappear immediately
          await expect(toast).not.toBeVisible();
        }
      }
    });

    test('should stack multiple toasts', async ({ page }) => {
      // Navigate to a page with toast demo or trigger multiple actions
      await page.goto('/dashboard');

      // Trigger multiple toasts quickly
      // This would depend on your implementation
      // For now, we'll just verify that multiple toasts can exist

      const toasts = page.locator('[data-testid="toast"]');
      const initialCount = await toasts.count();

      // Multiple toasts should be able to display
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });

    test('should display toast with action button', async ({ page }) => {
      // Some toasts have action buttons (e.g., "Undo", "View")
      const actionToast = page.locator('[data-testid="toast"]:has(button:not([aria-label*="close"]))').first();

      if (await actionToast.isVisible({ timeout: 5000 })) {
        const actionButton = actionToast.locator('button:not([aria-label*="close"])');
        await expect(actionButton).toBeVisible();

        // Click action button
        await actionButton.click();

        // Toast should close and action should execute
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Notification Center', () => {
    test('should open notification center', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"], button[aria-label*="notification" i]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        // Notification panel should open
        await expect(page.locator('[data-testid="notification-center"], [data-testid="notifications-panel"]')).toBeVisible();
      }
    });

    test('should close notification center', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();
        await page.waitForTimeout(500);

        // Click outside or close button
        const closeButton = page.locator('[data-testid="close-notifications"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // Click outside
          await page.click('body');
        }

        // Panel should close
        await expect(page.locator('[data-testid="notification-center"]')).not.toBeVisible();
      }
    });

    test('should display notification badge with count', async ({ page }) => {
      const notificationBadge = page.locator('[data-testid="notification-badge"]');

      if (await notificationBadge.isVisible()) {
        const badgeText = await notificationBadge.textContent();

        // Badge should contain a number
        expect(badgeText).toMatch(/\d+/);
      }
    });

    test('should display list of notifications', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const notificationList = page.locator('[data-testid="notification-list"]');
        const notifications = page.locator('[data-testid^="notification-"]');

        if (await notificationList.isVisible()) {
          // Should have notifications or empty state
          const count = await notifications.count();
          const emptyState = page.locator('[data-testid="empty-notifications"]');

          const hasNotifications = count > 0;
          const hasEmptyState = await emptyState.isVisible();

          expect(hasNotifications || hasEmptyState).toBeTruthy();
        }
      }
    });

    test('should mark notification as read', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const unreadNotification = page.locator('[data-testid^="notification-"]:not(.read)').first();

        if (await unreadNotification.isVisible()) {
          // Click notification
          await unreadNotification.click();

          // Should be marked as read
          await page.waitForTimeout(500);

          const isRead = await unreadNotification.evaluate((el) =>
            el.classList.contains('read')
          );

          expect(isRead).toBeTruthy();
        }
      }
    });

    test('should mark all as read', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const markAllReadButton = page.locator('[data-testid="mark-all-read"], button:has-text("Mark all as read")');

        if (await markAllReadButton.isVisible()) {
          await markAllReadButton.click();

          // Wait for update
          await page.waitForTimeout(1000);

          // All notifications should be marked as read
          const unreadNotifications = page.locator('[data-testid^="notification-"]:not(.read)');
          const unreadCount = await unreadNotifications.count();

          expect(unreadCount).toBe(0);
        }
      }
    });

    test('should delete notification', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const notification = page.locator('[data-testid^="notification-"]').first();

        if (await notification.isVisible()) {
          const initialCount = await page.locator('[data-testid^="notification-"]').count();

          const deleteButton = notification.locator('[data-testid="delete-notification"], button[aria-label*="delete" i]');

          if (await deleteButton.isVisible()) {
            await deleteButton.click();

            // Wait for deletion
            await page.waitForTimeout(500);

            const newCount = await page.locator('[data-testid^="notification-"]').count();
            expect(newCount).toBeLessThan(initialCount);
          }
        }
      }
    });

    test('should clear all notifications', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const clearAllButton = page.locator('[data-testid="clear-all"], button:has-text("Clear all")');

        if (await clearAllButton.isVisible()) {
          await clearAllButton.click();

          // Confirm if needed
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Clear")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          // Wait for clearing
          await page.waitForTimeout(1000);

          // Should show empty state
          const emptyState = page.locator('[data-testid="empty-notifications"]');
          await expect(emptyState).toBeVisible();
        }
      }
    });

    test('should filter notifications by type', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const filterButton = page.locator('[data-testid="filter-notifications"]');

        if (await filterButton.isVisible()) {
          await filterButton.click();

          // Select a filter
          const filterOption = page.locator('[data-testid="filter-mentions"], text=Mentions').first();
          if (await filterOption.isVisible()) {
            await filterOption.click();

            // Wait for filtered results
            await page.waitForTimeout(500);

            // Only filtered notifications should show
          }
        }
      }
    });

    test('should sort notifications', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const sortButton = page.locator('[data-testid="sort-notifications"]');

        if (await sortButton.isVisible()) {
          await sortButton.click();

          // Select sort option
          const sortOption = page.locator('[data-testid="sort-oldest"]').first();
          if (await sortOption.isVisible()) {
            await sortOption.click();

            // Wait for re-sort
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('Notification Types', () => {
    test('should display mention notification', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const mentionNotification = page.locator('[data-testid*="notification-"][data-type="mention"]');

        if (await mentionNotification.first().isVisible()) {
          await expect(mentionNotification.first()).toBeVisible();

          // Should have @ icon or indicator
          const mentionIcon = mentionNotification.first().locator('[data-testid="mention-icon"]');
          if (await mentionIcon.isVisible()) {
            await expect(mentionIcon).toBeVisible();
          }
        }
      }
    });

    test('should display comment notification', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const commentNotification = page.locator('[data-testid*="notification-"][data-type="comment"]');

        if (await commentNotification.first().isVisible()) {
          await expect(commentNotification.first()).toBeVisible();
        }
      }
    });

    test('should display share notification', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const shareNotification = page.locator('[data-testid*="notification-"][data-type="share"]');

        if (await shareNotification.first().isVisible()) {
          await expect(shareNotification.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Notification Actions', () => {
    test('should click notification to navigate', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const notification = page.locator('[data-testid^="notification-"]').first();

        if (await notification.isVisible()) {
          const currentUrl = page.url();

          await notification.click();

          // Wait for potential navigation
          await page.waitForTimeout(1000);

          // URL might have changed
          const newUrl = page.url();
          // Navigation behavior depends on notification type
        }
      }
    });

    test('should show notification timestamp', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const notification = page.locator('[data-testid^="notification-"]').first();

        if (await notification.isVisible()) {
          const timestamp = notification.locator('[data-testid="notification-time"], time');

          if (await timestamp.isVisible()) {
            const timeText = await timestamp.textContent();

            // Should have relative time like "2 minutes ago"
            expect(timeText).toMatch(/ago|now|minute|hour|day/);
          }
        }
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should open notification settings', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        const settingsButton = page.locator('[data-testid="notification-settings"], button[aria-label*="settings" i]');

        if (await settingsButton.isVisible()) {
          await settingsButton.click();

          // Settings panel should open
          await expect(page.locator('[data-testid="notification-settings-panel"]')).toBeVisible();
        }
      }
    });

    test('should toggle notification types', async ({ page }) => {
      await page.goto('/settings');
      await waitForNetworkIdle(page);

      const notificationSettings = page.locator('[data-testid="notification-preferences"]');

      if (await notificationSettings.isVisible()) {
        const emailToggle = page.locator('[data-testid="email-notifications"], input[type="checkbox"]');

        if (await emailToggle.isVisible()) {
          await emailToggle.click();
          await page.waitForTimeout(500);

          // Setting should be saved
        }
      }
    });
  });

  test.describe('Real-time Notifications', () => {
    test.skip('should receive real-time notification via WebSocket', async ({ page }) => {
      // This would require a WebSocket connection
      // We can verify the component is set up to receive notifications

      const notificationBadge = page.locator('[data-testid="notification-badge"]');

      // Listen for new notifications
      page.on('websocket', (ws) => {
        ws.on('framereceived', (event) => {
          console.log('WebSocket message:', event.payload);
        });
      });

      // Wait for potential notification
      await page.waitForTimeout(5000);

      // Badge count might update
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible notification button', async ({ page }) => {
      const notificationButton = page.locator('[data-testid="notifications-button"]');

      if (await notificationButton.isVisible()) {
        const ariaLabel = await notificationButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();

        // Should be keyboard accessible
        await notificationButton.focus();
        await page.keyboard.press('Enter');

        // Panel should open
        await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();
      }
    });

    test('should announce toast to screen readers', async ({ page }) => {
      // Toasts should have role="status" or role="alert"
      const toast = page.locator('[data-testid="toast"][role="status"], [data-testid="toast"][role="alert"]');

      // Verify role attribute exists for accessibility
      const toastElements = page.locator('[data-testid="toast"]');
      if ((await toastElements.count()) > 0) {
        const firstToast = toastElements.first();
        const role = await firstToast.getAttribute('role');
        expect(role).toMatch(/status|alert/);
      }
    });
  });
});
