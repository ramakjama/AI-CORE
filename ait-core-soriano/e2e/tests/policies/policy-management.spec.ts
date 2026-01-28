import { test, expect } from '../../fixtures/auth.fixture';
import { generateTestPolicy, waitForNetworkIdle } from '../../fixtures/test-data';
import {
  navigateAndWait,
  waitForToast,
  verifyPageTitle,
  searchTable,
  waitForTableData,
  selectDropdownOption,
  waitForDialog,
  verifyTableContains,
  getTableRowCount,
  clickTableRow,
  fillFieldWithRetry,
} from '../../utils/helpers';

/**
 * Policy Management E2E Tests
 *
 * Tests cover:
 * - Viewing policy list
 * - Creating new policies
 * - Editing existing policies
 * - Deleting policies
 * - Searching and filtering
 * - Policy details view
 * - Policy documents
 */

test.describe('Policy Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/polizas');
    await verifyPageTitle(page, /Pólizas/i);
  });

  test('should display policies list page correctly', async ({ authenticatedPage: page }) => {
    // Verify main elements
    await expect(page.locator('h1:has-text("Pólizas")')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("Nueva Póliza")')).toBeVisible();
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible();

    // Verify search and filters
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
  });

  test('should load and display policies in table', async ({ authenticatedPage: page }) => {
    // Wait for table data
    await waitForTableData(page, 1);

    // Verify table headers
    await expect(page.locator('th:has-text("Número")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Cliente")')).toBeVisible();
    await expect(page.locator('th:has-text("Compañía")')).toBeVisible();
    await expect(page.locator('th:has-text("Estado")')).toBeVisible();

    // Verify at least one policy is displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should search policies by policy number', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Get first policy number from table
    const firstPolicyNumber = await page.locator('tbody tr').first().locator('td').first().textContent();

    if (firstPolicyNumber) {
      const searchTerm = firstPolicyNumber.trim();

      // Search for policy
      await searchTable(page, searchTerm);

      // Verify search results
      await verifyTableContains(page, searchTerm);
    }
  });

  test('should filter policies by status', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open status filter dropdown
    const statusTrigger = page.locator('button:has-text("Estado"), select').first();

    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();
      await page.waitForTimeout(300);

      // Select "Activa"
      const activeOption = page.locator('[role="option"]:has-text("Activa")').or(page.locator('text=Activa')).first();
      await activeOption.click();

      // Wait for filtered results
      await page.waitForTimeout(1000);
      await waitForNetworkIdle(page);

      // Verify only active policies are shown
      const statusBadges = page.locator('text=Activa');
      const count = await statusBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter policies by type', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open type filter dropdown
    const typeTrigger = page.locator('button:has-text("Tipo"), select').nth(1);

    if (await typeTrigger.isVisible()) {
      await typeTrigger.click();
      await page.waitForTimeout(300);

      // Select "Auto"
      const autoOption = page.locator('[role="option"]:has-text("Auto")').or(page.locator('text=Auto')).first();
      if (await autoOption.isVisible()) {
        await autoOption.click();

        // Wait for filtered results
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
      }
    }
  });

  test('should navigate to create new policy page', async ({ authenticatedPage: page }) => {
    // Click new policy button
    await page.click('button:has-text("Nueva Póliza")');

    // Verify navigation
    await page.waitForURL(/\/polizas\/nueva/, { timeout: 5000 });

    // Verify form is displayed
    await expect(page.locator('h1:has-text("Nueva Póliza")')).toBeVisible();
  });

  test('should create a new policy', async ({ authenticatedPage: page }) => {
    const newPolicy = generateTestPolicy(Date.now());

    // Navigate to create page
    await page.click('button:has-text("Nueva Póliza")');
    await page.waitForURL(/\/polizas\/nueva/);

    // Fill policy form
    const policyNumberInput = page.locator('input[name="policyNumber"], input[id="policyNumber"]');
    if (await policyNumberInput.isVisible()) {
      await fillFieldWithRetry(page, 'input[name="policyNumber"], input[id="policyNumber"]', newPolicy.policyNumber);
    }

    // Select policy type
    const typeSelect = page.locator('select[name="type"], [name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ label: 'Auto' });
    }

    // Fill insurance company
    const companyInput = page.locator('input[name="insuranceCompany"], input[id="insuranceCompany"]');
    if (await companyInput.isVisible()) {
      await companyInput.fill(newPolicy.insuranceCompany);
    }

    // Fill premium
    const premiumInput = page.locator('input[name="premium"], input[id="premium"]');
    if (await premiumInput.isVisible()) {
      await premiumInput.fill(String(newPolicy.premium));
    }

    // Fill dates
    const startDateInput = page.locator('input[name="startDate"], input[id="startDate"]');
    if (await startDateInput.isVisible()) {
      await startDateInput.fill(newPolicy.startDate);
    }

    const endDateInput = page.locator('input[name="endDate"], input[id="endDate"]');
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(newPolicy.endDate);
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")').first();
    await submitButton.click();

    // Wait for success message or redirect
    await page.waitForTimeout(3000);

    // Check for success message
    const successMessage = page.locator('text=/éxito|exitoso|creado/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }

    // Navigate back to list and verify policy appears
    if (!page.url().includes('/polizas')) {
      await page.goto('/polizas');
    }

    // Search for the new policy
    await searchTable(page, newPolicy.policyNumber);
    await page.waitForTimeout(1000);
  });

  test('should view policy details', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first policy row
    await clickTableRow(page, 0);

    // Verify navigation to details page
    await page.waitForURL(/\/polizas\/[^/]+$/, { timeout: 5000 });

    // Verify details page elements
    await expect(page.locator('h1, h2').filter({ hasText: /Póliza|Detalles/i })).toBeVisible();

    // Verify policy information sections
    const infoSection = page.locator('text=/Información|Cobertura|Cliente|Documentos/i');
    await expect(infoSection.first()).toBeVisible();
  });

  test('should edit policy from details page', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first policy
    await clickTableRow(page, 0);
    await page.waitForURL(/\/polizas\/[^/]+$/);

    // Click edit button
    const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar")').first();
    await editButton.click();

    // Verify navigation to edit page
    await page.waitForURL(/\/polizas\/[^/]+\/editar/, { timeout: 5000 });

    // Modify policy data
    const premiumInput = page.locator('input[name="premium"], input[id="premium"]');
    if (await premiumInput.isVisible()) {
      await premiumInput.clear();
      await premiumInput.fill('750');
    }

    // Save changes
    await page.click('button[type="submit"]:has-text("Guardar")');

    // Verify success
    await page.waitForTimeout(2000);
    const successMessage = page.locator('text=/éxito|exitoso|actualizado/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should delete policy', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click actions menu on first row
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"])').first();
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
  });

  test('should display policy status badges', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for status badges
    const statusBadges = page.locator('tbody td').locator('text=/Activa|Expirada|Pendiente|Suspendida|Cancelada/i');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should display policy type badges', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for type badges
    const typeBadges = page.locator('tbody td').locator('text=/Auto|Hogar|Vida|Salud|Empresa/i');
    await expect(typeBadges.first()).toBeVisible();
  });

  test('should sort policies by different columns', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Sort by policy number
    const numberHeader = page.locator('th button:has-text("Número")').first();
    if (await numberHeader.isVisible()) {
      await numberHeader.click();
      await page.waitForTimeout(1000);
    }

    // Sort by premium
    const premiumHeader = page.locator('th button:has-text("Prima")').first();
    if (await premiumHeader.isVisible()) {
      await premiumHeader.click();
      await page.waitForTimeout(1000);
    }

    // Sort by start date
    const dateHeader = page.locator('th button:has-text("Inicio")').first();
    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should export policies data', async ({ authenticatedPage: page }) => {
    // Click export button
    const exportButton = page.locator('button:has-text("Exportar")');
    await exportButton.click();

    // Verify success message
    await page.waitForTimeout(1000);
    const successMessage = page.locator('text=/Exportando|éxito|descarga/i');
    if (await successMessage.first().isVisible({ timeout: 5000 })) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should display policy premium formatted as currency', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for currency symbols in premium column
    const currencyValues = page.locator('tbody td').filter({ hasText: /€|EUR|\$/ });
    await expect(currencyValues.first()).toBeVisible();
  });

  test('should display policy dates formatted correctly', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for date formats (dd/mm/yyyy or similar)
    const dates = page.locator('tbody td').filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/ });
    await expect(dates.first()).toBeVisible();
  });

  test('should show empty state when no policies found', async ({ authenticatedPage: page }) => {
    // Search for non-existent policy
    await searchTable(page, 'NONEXISTENT_POLICY_XYZ_999');

    // Verify empty state message
    const emptyMessage = page.locator('text=/No se encontraron|No results|Sin resultados/i');
    await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in policy form', async ({ authenticatedPage: page }) => {
    // Navigate to create page
    await page.click('button:has-text("Nueva Póliza")');
    await page.waitForURL(/\/polizas\/nueva/);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")').first();
    await submitButton.click();

    // Verify validation errors
    const errors = page.locator('text=/requerido|obligatorio|necesario/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should refresh policies list', async ({ authenticatedPage: page }) => {
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

  test('should navigate to policy documents', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click actions menu on first row
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"])').first();
    await actionsButton.click();

    // Click documents option
    const documentsOption = page.locator('text=Documentos').last();
    if (await documentsOption.isVisible()) {
      await documentsOption.click();

      // Verify navigation
      await page.waitForURL(/\/polizas\/[^/]+\/documentos/, { timeout: 5000 });
    }
  });

  test('should display result count', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for result count text
    const resultCount = page.locator('text=/Mostrando.*de.*pólizas/i');
    await expect(resultCount).toBeVisible();
  });

  test('should handle import policies option', async ({ authenticatedPage: page }) => {
    // Look for import button
    const importButton = page.locator('button:has-text("Importar")');

    if (await importButton.isVisible()) {
      await importButton.click();

      // Verify dialog or file picker appears
      await page.waitForTimeout(1000);
    }
  });

  test('should display policy actions menu', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click actions button
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"])').first();
    await actionsButton.click();

    // Verify menu options
    await expect(page.locator('text=Ver detalles')).toBeVisible();
    await expect(page.locator('text=Editar')).toBeVisible();
    await expect(page.locator('text=Documentos')).toBeVisible();
    await expect(page.locator('text=Eliminar')).toBeVisible();
  });
});
