import { Page, expect } from '@playwright/test';

/**
 * Common helper functions for E2E tests
 */

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  type: 'success' | 'error' | 'info' = 'success'
): Promise<void> {
  const toastSelector = '[data-sonner-toast], [role="status"], .toast';
  await page.waitForSelector(toastSelector, { state: 'visible', timeout: 10000 });

  const toast = page.locator(toastSelector).last();
  await expect(toast).toContainText(message);
}

/**
 * Navigate to a specific page and wait for it to load
 */
export async function navigateAndWait(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for table to load with data
 */
export async function waitForTableData(page: Page, minRows: number = 1): Promise<void> {
  // Wait for table to be visible
  await page.waitForSelector('table', { state: 'visible' });

  // Wait for at least one data row (excluding header)
  await page.waitForFunction(
    (min) => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length >= min;
    },
    minRows,
    { timeout: 10000 }
  );
}

/**
 * Click and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string,
  urlPattern?: string | RegExp
): Promise<void> {
  await Promise.all([
    urlPattern ? page.waitForURL(urlPattern) : page.waitForNavigation(),
    page.click(selector),
  ]);
}

/**
 * Fill a form field with retry logic
 */
export async function fillFieldWithRetry(
  page: Page,
  selector: string,
  value: string,
  maxRetries: number = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.fill(selector, value);
      const actualValue = await page.inputValue(selector);
      if (actualValue === value) return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Search in a table or list
 */
export async function searchTable(page: Page, searchTerm: string): Promise<void> {
  const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
  await searchInput.fill(searchTerm);

  // Wait for search to complete
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle');
}

/**
 * Select option from dropdown
 */
export async function selectDropdownOption(
  page: Page,
  triggerSelector: string,
  optionText: string
): Promise<void> {
  await page.click(triggerSelector);
  await page.waitForTimeout(300);

  const option = page.locator(`[role="option"]:has-text("${optionText}")`).or(
    page.locator(`text=${optionText}`)
  );
  await option.click();
}

/**
 * Verify table contains text
 */
export async function verifyTableContains(page: Page, text: string): Promise<void> {
  const table = page.locator('table');
  await expect(table).toContainText(text);
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  return await page.locator('tbody tr').count();
}

/**
 * Click table row by index
 */
export async function clickTableRow(page: Page, index: number): Promise<void> {
  await page.locator(`tbody tr`).nth(index).click();
}

/**
 * Verify page title
 */
export async function verifyPageTitle(page: Page, title: string | RegExp): Promise<void> {
  const heading = page.locator('h1').first();
  await expect(heading).toContainText(title);
}

/**
 * Wait for dialog to appear
 */
export async function waitForDialog(page: Page): Promise<void> {
  await page.waitForSelector('[role="dialog"], [data-radix-dialog-content]', {
    state: 'visible',
    timeout: 5000,
  });
}

/**
 * Close dialog
 */
export async function closeDialog(page: Page): Promise<void> {
  const closeButton = page.locator('[role="dialog"] button:has-text("Cerrar"), [role="dialog"] button:has-text("Cancelar")').first();
  await closeButton.click();
  await page.waitForTimeout(300);
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `screenshots/${name}-${timestamp}.png`, fullPage: true });
}

/**
 * Verify no loading indicators
 */
export async function verifyNoLoadingIndicators(page: Page): Promise<void> {
  await expect(page.locator('[data-loading="true"], .loading, .spinner')).toHaveCount(0);
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesPattern = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesPattern && response.request().method() === method;
    },
    { timeout: 15000 }
  );
  return response;
}

/**
 * Intercept and mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any,
  status: number = 200
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}
