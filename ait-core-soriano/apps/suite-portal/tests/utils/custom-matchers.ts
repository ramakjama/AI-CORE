import { expect, Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Custom matcher to check if element is in viewport
 */
export async function toBeInViewport(locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = await locator.page().viewportSize();

  if (!box || !viewport) {
    return {
      pass: false,
      message: () => 'Element or viewport not found',
    };
  }

  const isInViewport =
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height;

  return {
    pass: isInViewport,
    message: () =>
      isInViewport
        ? 'Expected element not to be in viewport'
        : 'Expected element to be in viewport',
  };
}

/**
 * Custom matcher to check for accessibility violations
 */
export async function toHaveNoAccessibilityViolations(page: Page, options?: any) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(options?.tags || ['wcag2a', 'wcag2aa'])
    .analyze();

  const violations = accessibilityScanResults.violations;

  return {
    pass: violations.length === 0,
    message: () => {
      if (violations.length === 0) {
        return 'Expected page to have accessibility violations';
      }

      const violationMessages = violations.map((violation) => {
        return `
          Rule: ${violation.id}
          Impact: ${violation.impact}
          Description: ${violation.description}
          Help: ${violation.help}
          Elements affected: ${violation.nodes.length}
          ${violation.nodes.map((node) => `    - ${node.html}`).join('\n')}
        `;
      });

      return `Expected page to have no accessibility violations but found ${violations.length}:\n${violationMessages.join('\n')}`;
    },
  };
}

/**
 * Custom matcher to check loading state
 */
export async function toBeLoading(locator: Locator) {
  const isLoading = await locator.evaluate((el) => {
    const hasAriaLabel = el.getAttribute('aria-busy') === 'true';
    const hasLoadingClass = el.classList.contains('loading');
    const hasSpinner = el.querySelector('[class*="spinner"]') !== null;

    return hasAriaLabel || hasLoadingClass || hasSpinner;
  });

  return {
    pass: isLoading,
    message: () =>
      isLoading ? 'Expected element not to be loading' : 'Expected element to be loading',
  };
}

/**
 * Custom matcher to check if element has focus
 */
export async function toHaveFocus(locator: Locator) {
  const hasFocus = await locator.evaluate((el) => el === document.activeElement);

  return {
    pass: hasFocus,
    message: () => (hasFocus ? 'Expected element not to have focus' : 'Expected element to have focus'),
  };
}

/**
 * Custom matcher to check toast notification
 */
export async function toShowToast(
  page: Page,
  options: { message?: string; type?: 'success' | 'error' | 'warning' | 'info' }
) {
  const toast = page.locator('[data-testid="toast"]').first();

  try {
    await toast.waitFor({ state: 'visible', timeout: 5000 });

    if (options.message) {
      const toastMessage = await toast.textContent();
      const hasMessage = toastMessage?.includes(options.message);

      if (!hasMessage) {
        return {
          pass: false,
          message: () => `Expected toast to contain message "${options.message}" but got "${toastMessage}"`,
        };
      }
    }

    if (options.type) {
      const hasType = await toast.evaluate(
        (el, type) => el.classList.contains(`toast-${type}`) || el.getAttribute('data-type') === type,
        options.type
      );

      if (!hasType) {
        return {
          pass: false,
          message: () => `Expected toast to have type "${options.type}"`,
        };
      }
    }

    return {
      pass: true,
      message: () => 'Toast notification found',
    };
  } catch (error) {
    return {
      pass: false,
      message: () => 'Expected toast notification to be visible',
    };
  }
}

/**
 * Custom matcher to check API response
 */
export async function toMatchAPIResponse(
  page: Page,
  url: string,
  expectedStatus: number,
  timeout: number = 10000
) {
  let response = null;

  try {
    response = await page.waitForResponse(
      (res) => res.url().includes(url) && res.status() === expectedStatus,
      { timeout }
    );

    return {
      pass: true,
      message: () => `API response matched: ${url} with status ${expectedStatus}`,
    };
  } catch (error) {
    return {
      pass: false,
      message: () => `Expected API response from ${url} with status ${expectedStatus} but got ${response?.status() || 'no response'}`,
    };
  }
}

/**
 * Custom matcher to check local storage
 */
export async function toHaveLocalStorageItem(page: Page, key: string, value?: string) {
  const actualValue = await page.evaluate((k) => localStorage.getItem(k), key);

  if (value) {
    return {
      pass: actualValue === value,
      message: () =>
        actualValue === value
          ? `Expected localStorage "${key}" not to be "${value}"`
          : `Expected localStorage "${key}" to be "${value}" but got "${actualValue}"`,
    };
  }

  return {
    pass: actualValue !== null,
    message: () =>
      actualValue !== null
        ? `Expected localStorage "${key}" not to exist`
        : `Expected localStorage "${key}" to exist`,
  };
}

/**
 * Custom matcher to check console errors
 */
export async function toHaveNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForLoadState('networkidle');

  return {
    pass: errors.length === 0,
    message: () =>
      errors.length === 0
        ? 'Expected console errors'
        : `Found ${errors.length} console errors:\n${errors.join('\n')}`,
  };
}

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for element to be stable (no animations)
 */
export async function waitForElementStable(locator: Locator, timeout: number = 3000) {
  let previousBox = await locator.boundingBox();
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    await locator.page().waitForTimeout(100);
    const currentBox = await locator.boundingBox();

    if (
      previousBox &&
      currentBox &&
      previousBox.x === currentBox.x &&
      previousBox.y === currentBox.y &&
      previousBox.width === currentBox.width &&
      previousBox.height === currentBox.height
    ) {
      return;
    }

    previousBox = currentBox;
  }
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if element is visible in DOM but hidden via CSS
 */
export async function isVisuallyHidden(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      el.offsetParent === null
    );
  });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await locator.page().waitForTimeout(500); // Wait for scroll animation
}

/**
 * Type text with human-like delays
 */
export async function typeWithDelay(locator: Locator, text: string, delay: number = 100) {
  for (const char of text) {
    await locator.type(char, { delay });
  }
}

/**
 * Check if route is protected (requires auth)
 */
export async function isProtectedRoute(page: Page, route: string): Promise<boolean> {
  await page.goto(route);
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  return currentUrl.includes('/auth/login');
}
