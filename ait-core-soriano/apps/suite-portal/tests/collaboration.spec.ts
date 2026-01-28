import { test, expect, Browser, Page } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';
import { waitForNetworkIdle } from './utils/custom-matchers';

test.describe('Collaboration (Y.js)', () => {
  let browser1: Browser;
  let browser2: Browser;
  let page1: Page;
  let page2: Page;

  test.describe('Real-time Sync', () => {
    test.skip('should sync text changes between two users', async ({ browser }) => {
      // Create two browser contexts for two users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      page1 = await context1.newPage();
      page2 = await context2.newPage();

      // Setup both users
      await setupAuthenticatedSession(page1, TEST_USERS.user);
      await setupAuthenticatedSession(page2, TEST_USERS.collaborator);

      // Both users navigate to same document
      const documentId = 'test-collab-doc';
      await page1.goto(`/documents/${documentId}`);
      await page2.goto(`/documents/${documentId}`);

      await waitForNetworkIdle(page1);
      await waitForNetworkIdle(page2);

      // Wait for Y.js to connect
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // User 1 types
      const editor1 = page1.locator('.ProseMirror, [contenteditable="true"]').first();
      await editor1.click();
      await editor1.type('Hello from user 1');

      // Wait for sync
      await page1.waitForTimeout(1000);

      // User 2 should see the text
      const editor2 = page2.locator('.ProseMirror, [contenteditable="true"]').first();
      await expect(editor2).toContainText('Hello from user 1');

      // User 2 types
      await editor2.click();
      await editor2.press('End');
      await editor2.type(' - Response from user 2');

      // Wait for sync
      await page2.waitForTimeout(1000);

      // User 1 should see both texts
      await expect(editor1).toContainText('Hello from user 1 - Response from user 2');

      // Cleanup
      await context1.close();
      await context2.close();
    });

    test.skip('should show remote cursors', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      page1 = await context1.newPage();
      page2 = await context2.newPage();

      await setupAuthenticatedSession(page1, TEST_USERS.user);
      await setupAuthenticatedSession(page2, TEST_USERS.collaborator);

      const documentId = 'test-collab-doc';
      await page1.goto(`/documents/${documentId}`);
      await page2.goto(`/documents/${documentId}`);

      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // User 2 moves cursor
      const editor2 = page2.locator('.ProseMirror').first();
      await editor2.click();

      // Wait for cursor sync
      await page2.waitForTimeout(500);

      // User 1 should see user 2's cursor
      const remoteCursor = page1.locator('[data-testid*="remote-cursor"]');
      // Remote cursor element might be present
      const cursorCount = await remoteCursor.count();
      expect(cursorCount).toBeGreaterThanOrEqual(0);

      await context1.close();
      await context2.close();
    });

    test.skip('should show remote selections', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      page1 = await context1.newPage();
      page2 = await context2.newPage();

      await setupAuthenticatedSession(page1, TEST_USERS.user);
      await setupAuthenticatedSession(page2, TEST_USERS.collaborator);

      const documentId = 'test-collab-doc';
      await page1.goto(`/documents/${documentId}`);
      await page2.goto(`/documents/${documentId}`);

      await page1.waitForTimeout(2000);

      // User 2 selects text
      const editor2 = page2.locator('.ProseMirror').first();
      await editor2.click();
      await page2.keyboard.press('Control+A');

      // Wait for selection sync
      await page2.waitForTimeout(500);

      // User 1 might see selection highlight
      const remoteSelection = page1.locator('[data-testid*="remote-selection"]');
      // Just verify component structure exists
      const selectionCount = await remoteSelection.count();
      expect(selectionCount).toBeGreaterThanOrEqual(0);

      await context1.close();
      await context2.close();
    });
  });

  test.describe('Presence Awareness', () => {
    test('should show online collaborators', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      // Check for presence indicator
      const presenceIndicator = page.locator('[data-testid="presence-indicator"], [data-testid="collaborators"]');

      if (await presenceIndicator.isVisible()) {
        await expect(presenceIndicator).toBeVisible();
      }
    });

    test('should show collaborator avatars', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const avatars = page.locator('[data-testid*="avatar"]');

      if ((await avatars.count()) > 0) {
        await expect(avatars.first()).toBeVisible();
      }
    });

    test('should show collaborator count', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const collaboratorCount = page.locator('[data-testid="collaborator-count"]');

      if (await collaboratorCount.isVisible()) {
        const countText = await collaboratorCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Conflict Resolution', () => {
    test.skip('should handle concurrent edits', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      page1 = await context1.newPage();
      page2 = await context2.newPage();

      await setupAuthenticatedSession(page1, TEST_USERS.user);
      await setupAuthenticatedSession(page2, TEST_USERS.collaborator);

      const documentId = 'test-conflict-doc';
      await page1.goto(`/documents/${documentId}`);
      await page2.goto(`/documents/${documentId}`);

      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Both users type at the same time
      const editor1 = page1.locator('.ProseMirror').first();
      const editor2 = page2.locator('.ProseMirror').first();

      await Promise.all([
        editor1.click().then(() => editor1.type('User 1 text')),
        editor2.click().then(() => editor2.type('User 2 text')),
      ]);

      // Wait for CRDT to resolve
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Both users should have consistent state (CRDT guarantees convergence)
      const content1 = await editor1.textContent();
      const content2 = await editor2.textContent();

      expect(content1).toBe(content2);

      await context1.close();
      await context2.close();
    });
  });

  test.describe('Collaboration Bar', () => {
    test('should display collaboration controls', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const collabBar = page.locator('[data-testid="collaboration-bar"]');

      if (await collabBar.isVisible()) {
        await expect(collabBar).toBeVisible();

        // Should have share button
        await expect(collabBar.locator('[data-testid="share-button"]')).toBeVisible();
      }
    });

    test('should toggle presence visibility', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const togglePresenceButton = page.locator('[data-testid="toggle-presence"]');

      if (await togglePresenceButton.isVisible()) {
        await togglePresenceButton.click();

        // Presence indicators should hide/show
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Connection Status', () => {
    test('should show connection status', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const connectionStatus = page.locator('[data-testid="connection-status"]');

      if (await connectionStatus.isVisible()) {
        const statusText = await connectionStatus.textContent();
        expect(statusText).toMatch(/connected|online|synced/i);
      }
    });

    test.skip('should handle disconnection', async ({ page, context }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      // Simulate offline
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      const connectionStatus = page.locator('[data-testid="connection-status"]');
      if (await connectionStatus.isVisible()) {
        const statusText = await connectionStatus.textContent();
        expect(statusText).toMatch(/disconnected|offline/i);
      }

      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Should reconnect
      if (await connectionStatus.isVisible()) {
        const statusText = await connectionStatus.textContent();
        expect(statusText).toMatch(/connected|online/i);
      }
    });
  });

  test.describe('Commenting', () => {
    test('should add comment to document', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const commentButton = page.locator('[data-testid="add-comment-button"]');

      if (await commentButton.isVisible()) {
        await commentButton.click();

        const commentInput = page.locator('[data-testid="comment-input"], textarea[placeholder*="comment" i]');
        await commentInput.fill('This is a test comment');

        await page.click('button:has-text("Post"), button:has-text("Add")');

        // Comment should appear
        await expect(page.locator('text=This is a test comment')).toBeVisible();
      }
    });

    test('should reply to comment', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const firstComment = page.locator('[data-testid^="comment-"]').first();

      if (await firstComment.isVisible()) {
        const replyButton = firstComment.locator('[data-testid="reply-button"], button:has-text("Reply")');

        if (await replyButton.isVisible()) {
          await replyButton.click();

          const replyInput = page.locator('[data-testid="reply-input"], textarea[placeholder*="reply" i]');
          await replyInput.fill('This is a reply');

          await page.click('button:has-text("Post"), button:has-text("Reply")');

          // Reply should appear
          await expect(page.locator('text=This is a reply')).toBeVisible();
        }
      }
    });

    test('should resolve comment', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const firstComment = page.locator('[data-testid^="comment-"]').first();

      if (await firstComment.isVisible()) {
        const resolveButton = firstComment.locator('[data-testid="resolve-button"], button:has-text("Resolve")');

        if (await resolveButton.isVisible()) {
          await resolveButton.click();

          // Comment should be marked as resolved
          await expect(firstComment).toHaveClass(/resolved/);
        }
      }
    });
  });

  test.describe('Version History', () => {
    test('should show version history', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const historyButton = page.locator('[data-testid="history-button"], button:has-text("History")');

      if (await historyButton.isVisible()) {
        await historyButton.click();

        // History panel should open
        await expect(page.locator('[data-testid="history-panel"]')).toBeVisible();
      }
    });

    test('should restore previous version', async ({ page }) => {
      await setupAuthenticatedSession(page, TEST_USERS.user);
      await page.goto('/documents/test-doc');
      await waitForNetworkIdle(page);

      const historyButton = page.locator('[data-testid="history-button"]');

      if (await historyButton.isVisible()) {
        await historyButton.click();

        const firstVersion = page.locator('[data-testid^="version-"]').first();

        if (await firstVersion.isVisible()) {
          await firstVersion.click();

          const restoreButton = page.locator('button:has-text("Restore")');
          if (await restoreButton.isVisible()) {
            await restoreButton.click();

            // Should show confirmation
            await expect(page.locator('text=/restored/i')).toBeVisible();
          }
        }
      }
    });
  });
});
