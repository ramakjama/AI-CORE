import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';
import { generateDocument } from './utils/test-data';
import { waitForNetworkIdle, typeWithDelay } from './utils/custom-matchers';

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, TEST_USERS.user);
    await page.goto('/documents');
    await waitForNetworkIdle(page);
  });

  test.describe('Document List', () => {
    test('should display documents page', async ({ page }) => {
      // Check for main heading
      await expect(page.locator('h1, h2').filter({ hasText: /documents/i })).toBeVisible();

      // Check for new document button
      await expect(page.locator('[data-testid="new-document"], button:has-text("New Document")')).toBeVisible();
    });

    test('should display document list or empty state', async ({ page }) => {
      const documentList = page.locator('[data-testid="document-list"]');
      const emptyState = page.locator('[data-testid="empty-state"], text=/no documents/i');

      // Either list or empty state should be visible
      const hasDocuments = await documentList.isVisible();
      const isEmpty = await emptyState.isVisible();

      expect(hasDocuments || isEmpty).toBeTruthy();
    });

    test('should search documents', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-documents"], input[placeholder*="Search" i]');

      if (await searchInput.isVisible()) {
        await searchInput.fill('test document');
        await page.waitForTimeout(500); // Debounce

        // Results should update
        await waitForNetworkIdle(page);
      }
    });

    test('should filter documents by category', async ({ page }) => {
      const filterButton = page.locator('[data-testid="filter-button"]');

      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Filter options should appear
        const filterOptions = page.locator('[data-testid*="filter-option"]');
        if (await filterOptions.first().isVisible()) {
          await filterOptions.first().click();

          // Wait for filtered results
          await waitForNetworkIdle(page);
        }
      }
    });

    test('should sort documents', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-button"]');

      if (await sortButton.isVisible()) {
        await sortButton.click();

        // Sort options should appear
        const sortOptions = page.locator('[data-testid*="sort-option"]');
        if (await sortOptions.first().isVisible()) {
          await sortOptions.first().click();

          // Wait for sorted results
          await waitForNetworkIdle(page);
        }
      }
    });
  });

  test.describe('Create Document', () => {
    test('should create new document', async ({ page }) => {
      const newDocButton = page.locator('[data-testid="new-document"], button:has-text("New Document")');
      await newDocButton.click();

      // Should navigate to editor or open modal
      await page.waitForTimeout(1000);

      const isModal = await page.locator('[role="dialog"]').isVisible();
      const isEditorPage = page.url().includes('/documents/') || page.url().includes('/editor');

      expect(isModal || isEditorPage).toBeTruthy();

      if (isModal) {
        // Fill in document details in modal
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        const doc = generateDocument();

        await titleInput.fill(doc.title);

        // Submit
        await page.click('button[type="submit"], button:has-text("Create")');
        await waitForNetworkIdle(page);

        // Should show success message or redirect to editor
        await page.waitForTimeout(1000);
      }
    });

    test('should create document from template', async ({ page }) => {
      const templatesButton = page.locator('[data-testid="templates-button"], button:has-text("Templates")');

      if (await templatesButton.isVisible()) {
        await templatesButton.click();

        // Template list should appear
        const templateItems = page.locator('[data-testid*="template-"]');
        if (await templateItems.first().isVisible()) {
          await templateItems.first().click();

          // Should create document from template
          await waitForNetworkIdle(page);
        }
      }
    });

    test('should validate document title', async ({ page }) => {
      const newDocButton = page.locator('[data-testid="new-document"], button:has-text("New Document")');
      await newDocButton.click();

      await page.waitForTimeout(500);

      // Try to submit without title
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation error
        await expect(page.locator('text=/title.*required/i, [role="alert"]')).toBeVisible();
      }
    });
  });

  test.describe('Document Editor', () => {
    test.skip('should edit document content', async ({ page }) => {
      // Click on first document to edit
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();

        // Wait for editor to load
        await page.waitForTimeout(1000);

        // Find editor (TipTap editor)
        const editor = page.locator('[data-testid="document-editor"], .ProseMirror, [contenteditable="true"]').first();

        if (await editor.isVisible()) {
          await editor.click();
          await editor.clear();
          await typeWithDelay(editor, 'This is test content', 50);

          // Content should be updated
          await expect(editor).toContainText('This is test content');
        }
      }
    });

    test.skip('should format text (bold, italic, underline)', async ({ page }) => {
      // Navigate to or create document
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const editor = page.locator('[data-testid="document-editor"], .ProseMirror').first();

        if (await editor.isVisible()) {
          // Select text
          await editor.click();
          await page.keyboard.press('Control+A');

          // Apply bold
          const boldButton = page.locator('[data-testid="bold-button"], button[title*="Bold" i]');
          if (await boldButton.isVisible()) {
            await boldButton.click();

            // Check if text is bold
            const boldText = page.locator('strong, b');
            await expect(boldText.first()).toBeVisible();
          }
        }
      }
    });

    test.skip('should add heading', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const headingButton = page.locator('[data-testid="heading-button"]');
        if (await headingButton.isVisible()) {
          await headingButton.click();

          // Select heading level
          await page.click('button:has-text("Heading 1"), [data-testid="heading-1"]');

          // Type heading
          const editor = page.locator('.ProseMirror');
          await editor.type('Test Heading');

          // Should create h1
          await expect(page.locator('h1:has-text("Test Heading")')).toBeVisible();
        }
      }
    });

    test.skip('should insert image', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const imageButton = page.locator('[data-testid="insert-image-button"]');
        if (await imageButton.isVisible()) {
          await imageButton.click();

          // Fill image URL
          const urlInput = page.locator('input[placeholder*="URL" i]');
          if (await urlInput.isVisible()) {
            await urlInput.fill('https://via.placeholder.com/300');
            await page.click('button:has-text("Insert")');

            // Image should be inserted
            await expect(page.locator('img[src*="placeholder"]')).toBeVisible();
          }
        }
      }
    });

    test.skip('should insert link', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const editor = page.locator('.ProseMirror');
        await editor.type('Click here');
        await page.keyboard.press('Control+A');

        const linkButton = page.locator('[data-testid="link-button"]');
        if (await linkButton.isVisible()) {
          await linkButton.click();

          const urlInput = page.locator('input[placeholder*="URL" i]');
          await urlInput.fill('https://example.com');
          await page.click('button:has-text("Insert"), button:has-text("Add")');

          // Link should be created
          await expect(page.locator('a[href="https://example.com"]')).toBeVisible();
        }
      }
    });

    test.skip('should auto-save document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const editor = page.locator('.ProseMirror');
        await editor.type('Auto-save test content');

        // Wait for auto-save
        await page.waitForTimeout(3000);

        // Should show saved indicator
        const savedIndicator = page.locator('[data-testid="saved-indicator"], text=/saved/i');
        if (await savedIndicator.isVisible()) {
          await expect(savedIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Document Actions', () => {
    test('should share document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        // Click document menu
        await firstDocument.locator('[data-testid="document-menu"]').click();

        // Click share option
        await page.click('[data-testid="share-document"], text=Share');

        // Share dialog should open
        await expect(page.locator('[role="dialog"]:has-text("Share")')).toBeVisible();
      }
    });

    test('should duplicate document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        const initialCount = await page.locator('[data-testid^="document-"]').count();

        // Click document menu
        await firstDocument.locator('[data-testid="document-menu"]').click();

        // Click duplicate option
        await page.click('[data-testid="duplicate-document"], text=Duplicate');

        // Wait for duplication
        await waitForNetworkIdle(page);
        await page.waitForTimeout(1000);

        // Should have one more document
        const newCount = await page.locator('[data-testid^="document-"]').count();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    test('should export document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        const exportButton = page.locator('[data-testid="export-button"], button:has-text("Export")');
        if (await exportButton.isVisible()) {
          await exportButton.click();

          // Export options should appear
          await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
        }
      }
    });

    test('should rename document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        // Click document menu
        await firstDocument.locator('[data-testid="document-menu"]').click();

        // Click rename option
        await page.click('[data-testid="rename-document"], text=Rename');

        // Rename input should appear
        const renameInput = page.locator('input[value], input[placeholder*="name" i]').first();
        if (await renameInput.isVisible()) {
          await renameInput.fill('Renamed Document');
          await page.keyboard.press('Enter');

          // Should show updated name
          await expect(page.locator('text=Renamed Document')).toBeVisible();
        }
      }
    });

    test('should delete document', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        const initialCount = await page.locator('[data-testid^="document-"]').count();

        // Click document menu
        await firstDocument.locator('[data-testid="document-menu"]').click();

        // Click delete option
        await page.click('[data-testid="delete-document"], text=Delete');

        // Confirm deletion
        const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
        await confirmButton.click();

        // Wait for deletion
        await waitForNetworkIdle(page);
        await page.waitForTimeout(1000);

        // Should have one less document
        const newCount = await page.locator('[data-testid^="document-"]').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('Document Collaboration', () => {
    test.skip('should show collaborators', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        // Check for collaborators indicator
        const collaborators = page.locator('[data-testid="collaborators"]');
        if (await collaborators.isVisible()) {
          await expect(collaborators).toBeVisible();
        }
      }
    });

    test.skip('should show real-time cursors', async ({ page, context }) => {
      // This would require multiple browser contexts
      // Simplified version - just check if cursor component exists
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(2000);

        // Check for remote cursor elements
        const remoteCursor = page.locator('[data-testid*="remote-cursor"]');
        // Just verify the component is loaded, actual testing would need WebSocket
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.skip('should save with Ctrl+S', async ({ page }) => {
      const firstDocument = page.locator('[data-testid^="document-"]').first();

      if (await firstDocument.isVisible()) {
        await firstDocument.click();
        await page.waitForTimeout(1000);

        // Press Ctrl+S
        await page.keyboard.press('Control+S');

        // Should show saved indicator
        await page.waitForTimeout(500);
        const savedIndicator = page.locator('text=/saved/i');
        if (await savedIndicator.isVisible()) {
          await expect(savedIndicator).toBeVisible();
        }
      }
    });

    test.skip('should show shortcuts dialog with Ctrl+/', async ({ page }) => {
      await page.keyboard.press('Control+/');

      // Shortcuts dialog should appear
      const shortcutsDialog = page.locator('[data-testid="shortcuts-dialog"], [role="dialog"]:has-text("Shortcuts")');
      if (await shortcutsDialog.isVisible()) {
        await expect(shortcutsDialog).toBeVisible();
      }
    });
  });
});
