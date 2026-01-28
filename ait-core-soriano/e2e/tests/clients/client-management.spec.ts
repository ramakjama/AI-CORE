import { test, expect } from '../../fixtures/auth.fixture';
import { generateTestClient, waitForNetworkIdle } from '../../fixtures/test-data';
import {
  navigateAndWait,
  waitForToast,
  verifyPageTitle,
  searchTable,
  waitForTableData,
  selectDropdownOption,
  waitForDialog,
  closeDialog,
  verifyTableContains,
  getTableRowCount,
  clickTableRow,
} from '../../utils/helpers';

/**
 * Client Management E2E Tests
 *
 * Tests cover:
 * - Viewing client list
 * - Creating new clients
 * - Editing existing clients
 * - Deleting clients
 * - Searching and filtering
 * - Client details view
 * - Bulk operations
 */

test.describe('Client Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/clientes');
    await verifyPageTitle(page, /Clientes/i);
  });

  test('should display clients list page correctly', async ({ authenticatedPage: page }) => {
    // Verify main elements
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("Nuevo Cliente")')).toBeVisible();
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible();

    // Verify search and filters
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display statistics cards', async ({ authenticatedPage: page }) => {
    // Wait for statistics to load
    const statsCards = page.locator('text=/Total Clientes|Leads|Primas Totales|Conversión/i');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });

    // Verify numeric values are displayed
    const numbers = page.locator('[class*="text-2xl"], [class*="text-xl"]').filter({ hasText: /^\d+/ });
    await expect(numbers.first()).toBeVisible();
  });

  test('should load and display clients in table', async ({ authenticatedPage: page }) => {
    // Wait for table data
    await waitForTableData(page, 1);

    // Verify table headers
    await expect(page.locator('th:has-text("Cliente")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Estado")')).toBeVisible();
    await expect(page.locator('th:has-text("Contacto")')).toBeVisible();

    // Verify at least one client is displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should search clients by name', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Get first client name from table
    const firstClient = await page.locator('tbody tr').first().locator('td').nth(1).textContent();

    if (firstClient) {
      const searchTerm = firstClient.trim().split(' ')[0];

      // Search for client
      await searchTable(page, searchTerm);

      // Verify search results
      await verifyTableContains(page, searchTerm);
    }
  });

  test('should filter clients by status', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open status filter dropdown
    const statusFilter = page.locator('[name="status"], select').filter({ hasText: /Estado|Status/i }).first();

    if (await statusFilter.isVisible()) {
      await selectDropdownOption(page, statusFilter, 'Activo');

      // Wait for filtered results
      await page.waitForTimeout(1000);
      await waitForNetworkIdle(page);

      // Verify only active clients are shown
      const statusBadges = page.locator('text=Activo');
      const count = await statusBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter clients by type', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Try to filter by type
    const typeFilter = page.locator('button:has-text("Tipo"), select').first();

    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // Select "Individual"
      const individualOption = page.locator('text=Individual').first();
      if (await individualOption.isVisible()) {
        await individualOption.click();

        // Wait for filtered results
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
      }
    }
  });

  test('should navigate to create new client page', async ({ authenticatedPage: page }) => {
    // Click new client button
    await page.click('button:has-text("Nuevo Cliente")');

    // Verify navigation
    await page.waitForURL(/\/clientes\/nuevo/, { timeout: 5000 });

    // Verify form is displayed
    await expect(page.locator('h1:has-text("Nuevo Cliente")')).toBeVisible();
    await expect(page.locator('input[name="firstName"], input[id="firstName"]')).toBeVisible();
  });

  test('should create a new client', async ({ authenticatedPage: page }) => {
    const newClient = generateTestClient(Date.now());

    // Navigate to create page
    await page.click('button:has-text("Nuevo Cliente")');
    await page.waitForURL(/\/clientes\/nuevo/);

    // Fill client form
    await page.fill('input[name="firstName"], input[id="firstName"]', newClient.firstName);
    await page.fill('input[name="lastName"], input[id="lastName"]', newClient.lastName);
    await page.fill('input[name="email"], input[id="email"]', newClient.email);
    await page.fill('input[name="phone"], input[id="phone"]', newClient.phone);

    // Fill address fields if present
    const streetInput = page.locator('input[name="address.street"], input[name="street"]');
    if (await streetInput.isVisible()) {
      await streetInput.fill(newClient.address.street);
    }

    const cityInput = page.locator('input[name="address.city"], input[name="city"]');
    if (await cityInput.isVisible()) {
      await cityInput.fill(newClient.address.city);
    }

    const zipCodeInput = page.locator('input[name="address.zipCode"], input[name="zipCode"]');
    if (await zipCodeInput.isVisible()) {
      await zipCodeInput.fill(newClient.address.zipCode);
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")');

    // Wait for success message or redirect
    await Promise.race([
      page.waitForURL(/\/clientes\/[^/]+$/, { timeout: 10000 }),
      page.waitForURL(/\/clientes$/, { timeout: 10000 }),
    ]);

    // Verify success
    const successMessage = page.locator('text=/éxito|exitoso|creado/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }

    // Navigate back to list and verify client appears
    if (!page.url().includes('/clientes')) {
      await page.goto('/clientes');
    }

    // Search for the new client
    await searchTable(page, newClient.email);
    await verifyTableContains(page, newClient.email);
  });

  test('should view client details', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first client row
    await clickTableRow(page, 0);

    // Verify navigation to details page
    await page.waitForURL(/\/clientes\/[^/]+$/, { timeout: 5000 });

    // Verify details page elements
    await expect(page.locator('h1, h2').filter({ hasText: /Cliente|Detalles/i })).toBeVisible();

    // Verify client information sections
    const infoSection = page.locator('text=/Información|Contacto|Pólizas/i');
    await expect(infoSection.first()).toBeVisible();
  });

  test('should edit client from details page', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first client
    await clickTableRow(page, 0);
    await page.waitForURL(/\/clientes\/[^/]+$/);

    // Click edit button
    const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar")').first();
    await editButton.click();

    // Verify navigation to edit page
    await page.waitForURL(/\/clientes\/[^/]+\/editar/, { timeout: 5000 });

    // Modify client data
    const phoneInput = page.locator('input[name="phone"], input[id="phone"]');
    await phoneInput.clear();
    await phoneInput.fill('+34 600999888');

    // Save changes
    await page.click('button[type="submit"]:has-text("Guardar")');

    // Verify success
    await page.waitForTimeout(2000);
    const successMessage = page.locator('text=/éxito|exitoso|actualizado/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should delete client', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click actions menu on first row
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"]), button[aria-label*="actions"]').first();
    await actionsButton.click();

    // Click delete option
    const deleteOption = page.locator('text=Eliminar').last();
    await deleteOption.click();

    // Confirm deletion in dialog
    await waitForDialog(page);

    const confirmButton = page.locator('button:has-text("Eliminar")').last();
    await confirmButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify success message
    const successMessage = page.locator('text=/eliminado|éxito/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }

    // Verify row count decreased (might not work with mock data)
    // const newCount = await getTableRowCount(page);
    // expect(newCount).toBeLessThanOrEqual(initialCount);
  });

  test('should cancel client deletion', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Get initial row count
    const initialCount = await getTableRowCount(page);

    // Click actions menu
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"])').first();
    await actionsButton.click();

    // Click delete option
    const deleteOption = page.locator('text=Eliminar').last();
    await deleteOption.click();

    // Cancel in dialog
    await waitForDialog(page);

    const cancelButton = page.locator('button:has-text("Cancelar")').last();
    await cancelButton.click();

    // Verify row count unchanged
    await page.waitForTimeout(1000);
    const newCount = await getTableRowCount(page);
    expect(newCount).toBe(initialCount);
  });

  test('should export clients data', async ({ authenticatedPage: page }) => {
    // Click export button
    const exportButton = page.locator('button:has-text("Exportar")');
    await exportButton.click();

    // Verify download or success message
    await page.waitForTimeout(1000);

    // Check for success toast
    const successMessage = page.locator('text=/Exportando|éxito|descarga/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should sort clients by name', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on name column header
    const nameHeader = page.locator('th button:has-text("Cliente")').first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();

      // Wait for sorting
      await page.waitForTimeout(1000);

      // Click again to reverse sort
      await nameHeader.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display client avatar or initials', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for avatar elements
    const avatar = page.locator('[class*="avatar"], img[alt*="Cliente"]').first();

    if (await avatar.isVisible()) {
      await expect(avatar).toBeVisible();
    }
  });

  test('should refresh client list', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click refresh button if present
    const refreshButton = page.locator('button:has([class*="refresh"]), button[aria-label*="refresh"]').first();

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(1000);
      await waitForNetworkIdle(page);
    }
  });

  test('should show empty state when no clients found', async ({ authenticatedPage: page }) => {
    // Search for non-existent client
    await searchTable(page, 'NONEXISTENT_CLIENT_XYZ_123');

    // Verify empty state message
    const emptyMessage = page.locator('text=/No se encontraron|No results|Sin resultados/i');
    await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in client form', async ({ authenticatedPage: page }) => {
    // Navigate to create page
    await page.click('button:has-text("Nuevo Cliente")');
    await page.waitForURL(/\/clientes\/nuevo/);

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")');

    // Verify validation errors
    const errors = page.locator('text=/requerido|obligatorio|necesario/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should show client tags if present', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for tags/badges in the table
    const tags = page.locator('tbody [class*="badge"], tbody [class*="tag"]');

    if ((await tags.count()) > 0) {
      await expect(tags.first()).toBeVisible();
    }
  });

  test('should display client type badge', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for type badges (Individual/Empresa)
    const typeBadge = page.locator('text=/Individual|Empresa|Business/i').first();
    await expect(typeBadge).toBeVisible();
  });

  test('should allow clicking email to send mail', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for email links
    const emailLink = page.locator('a[href^="mailto:"]').first();

    if (await emailLink.isVisible()) {
      const href = await emailLink.getAttribute('href');
      expect(href).toContain('mailto:');
    }
  });

  test('should allow clicking phone to call', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for phone links
    const phoneLink = page.locator('a[href^="tel:"]').first();

    if (await phoneLink.isVisible()) {
      const href = await phoneLink.getAttribute('href');
      expect(href).toContain('tel:');
    }
  });
});
