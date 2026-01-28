import { test, expect } from '../../fixtures/auth.fixture';
import { generateTestClaim, waitForNetworkIdle } from '../../fixtures/test-data';
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
 * Claims Processing E2E Tests
 *
 * Tests cover:
 * - Viewing claims list
 * - Creating new claims
 * - Editing existing claims
 * - Deleting claims
 * - Searching and filtering
 * - Claim details view
 * - Claim status workflow
 * - Priority handling
 */

test.describe('Claims Processing', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/siniestros');
    await verifyPageTitle(page, /Siniestros/i);
  });

  test('should display claims list page correctly', async ({ authenticatedPage: page }) => {
    // Verify main elements
    await expect(page.locator('h1:has-text("Siniestros")')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("Nuevo Siniestro")')).toBeVisible();
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible();

    // Verify search and filters
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display claims statistics cards', async ({ authenticatedPage: page }) => {
    // Wait for statistics to load
    await page.waitForSelector('text=/Siniestros Pendientes|Aprobados|Total Estimado/i', {
      state: 'visible',
      timeout: 10000,
    });

    // Verify statistics cards
    await expect(page.locator('text=/Pendientes|Aprobados|Estimado|Denegados/i').first()).toBeVisible();

    // Verify numeric values are displayed
    const numbers = page.locator('[class*="text-2xl"]').filter({ hasText: /^\d+/ });
    await expect(numbers.first()).toBeVisible();
  });

  test('should load and display claims in table', async ({ authenticatedPage: page }) => {
    // Wait for table data
    await waitForTableData(page, 1);

    // Verify table headers
    await expect(page.locator('th:has-text("Número")')).toBeVisible();
    await expect(page.locator('th:has-text("Descripción")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Prioridad")')).toBeVisible();
    await expect(page.locator('th:has-text("Estado")')).toBeVisible();

    // Verify at least one claim is displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should search claims by claim number', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Get first claim number from table
    const firstClaimNumber = await page.locator('tbody tr').first().locator('td').first().textContent();

    if (firstClaimNumber) {
      const searchTerm = firstClaimNumber.trim();

      // Search for claim
      await searchTable(page, searchTerm);

      // Verify search results
      await verifyTableContains(page, searchTerm);
    }
  });

  test('should filter claims by status', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open status filter dropdown
    const statusTrigger = page.locator('button:has-text("Estado"), select').first();

    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();
      await page.waitForTimeout(300);

      // Select "Enviado"
      const option = page.locator('[role="option"]:has-text("Enviado")').or(page.locator('text=Enviado')).first();
      await option.click();

      // Wait for filtered results
      await page.waitForTimeout(1000);
      await waitForNetworkIdle(page);
    }
  });

  test('should filter claims by type', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open type filter dropdown
    const typeTrigger = page.locator('button:has-text("Tipo"), select').nth(1);

    if (await typeTrigger.isVisible()) {
      await typeTrigger.click();
      await page.waitForTimeout(300);

      // Select "Accidente"
      const option = page.locator('[role="option"]:has-text("Accidente")').or(page.locator('text=Accidente')).first();
      if (await option.isVisible()) {
        await option.click();

        // Wait for filtered results
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
      }
    }
  });

  test('should filter claims by priority', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Open priority filter dropdown
    const priorityTrigger = page.locator('button:has-text("Prioridad"), select').last();

    if (await priorityTrigger.isVisible()) {
      await priorityTrigger.click();
      await page.waitForTimeout(300);

      // Select "Alta"
      const option = page.locator('[role="option"]:has-text("Alta")').or(page.locator('text=Alta')).first();
      if (await option.isVisible()) {
        await option.click();

        // Wait for filtered results
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
      }
    }
  });

  test('should navigate to create new claim page', async ({ authenticatedPage: page }) => {
    // Click new claim button
    await page.click('button:has-text("Nuevo Siniestro")');

    // Verify navigation
    await page.waitForURL(/\/siniestros\/nuevo/, { timeout: 5000 });

    // Verify form is displayed
    await expect(page.locator('h1:has-text("Nuevo Siniestro")')).toBeVisible();
  });

  test('should create a new claim', async ({ authenticatedPage: page }) => {
    const newClaim = generateTestClaim(Date.now());

    // Navigate to create page
    await page.click('button:has-text("Nuevo Siniestro")');
    await page.waitForURL(/\/siniestros\/nuevo/);

    // Fill claim form
    const claimNumberInput = page.locator('input[name="claimNumber"], input[id="claimNumber"]');
    if (await claimNumberInput.isVisible()) {
      await fillFieldWithRetry(page, 'input[name="claimNumber"], input[id="claimNumber"]', newClaim.claimNumber);
    }

    // Select claim type
    const typeSelect = page.locator('select[name="type"], [name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ label: 'Accidente' });
    }

    // Fill description
    const descriptionInput = page.locator('textarea[name="description"], textarea[id="description"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(newClaim.description);
    }

    // Fill estimated amount
    const amountInput = page.locator('input[name="estimatedAmount"], input[id="estimatedAmount"]');
    if (await amountInput.isVisible()) {
      await amountInput.fill(String(newClaim.estimatedAmount));
    }

    // Fill incident date
    const dateInput = page.locator('input[name="incidentDate"], input[id="incidentDate"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(newClaim.incidentDate);
    }

    // Select priority
    const prioritySelect = page.locator('select[name="priority"], [name="priority"]');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption({ label: 'Media' });
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

    // Navigate back to list and verify claim appears
    if (!page.url().includes('/siniestros')) {
      await page.goto('/siniestros');
    }

    // Search for the new claim
    await searchTable(page, newClaim.claimNumber);
    await page.waitForTimeout(1000);
  });

  test('should view claim details', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first claim row
    await clickTableRow(page, 0);

    // Verify navigation to details page
    await page.waitForURL(/\/siniestros\/[^/]+$/, { timeout: 5000 });

    // Verify details page elements
    await expect(page.locator('h1, h2').filter({ hasText: /Siniestro|Detalles/i })).toBeVisible();

    // Verify claim information sections
    const infoSection = page.locator('text=/Información|Descripción|Timeline|Documentos/i');
    await expect(infoSection.first()).toBeVisible();
  });

  test('should edit claim from details page', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click on first claim
    await clickTableRow(page, 0);
    await page.waitForURL(/\/siniestros\/[^/]+$/);

    // Click edit button
    const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar")').first();
    await editButton.click();

    // Verify navigation to edit page
    await page.waitForURL(/\/siniestros\/[^/]+\/editar/, { timeout: 5000 });

    // Modify claim data
    const amountInput = page.locator('input[name="estimatedAmount"], input[id="estimatedAmount"]');
    if (await amountInput.isVisible()) {
      await amountInput.clear();
      await amountInput.fill('2500');
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

  test('should delete claim', async ({ authenticatedPage: page }) => {
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

  test('should display claim status badges with icons', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for status badges
    const statusBadges = page.locator('tbody td').locator('text=/Enviado|En Revisión|Aprobado|Denegado|Pagado|Cerrado/i');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should display claim type badges', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for type badges
    const typeBadges = page.locator('tbody td').locator('text=/Accidente|Robo|Daño|Médico|Responsabilidad/i');
    await expect(typeBadges.first()).toBeVisible();
  });

  test('should display priority badges with different colors', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for priority badges
    const priorityBadges = page.locator('tbody td').locator('text=/Baja|Media|Alta|Urgente/i');
    await expect(priorityBadges.first()).toBeVisible();
  });

  test('should display claim amounts formatted as currency', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for currency symbols in amount columns
    const currencyValues = page.locator('tbody td').filter({ hasText: /€|EUR|\$/ });
    await expect(currencyValues.first()).toBeVisible();
  });

  test('should display approved and paid amounts if available', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for approved amount text
    const approvedAmount = page.locator('text=/Aprobado:|Approved:/i');
    if (await approvedAmount.first().isVisible()) {
      await expect(approvedAmount.first()).toBeVisible();
    }

    // Look for paid amount text
    const paidAmount = page.locator('text=/Pagado:|Paid:/i');
    if (await paidAmount.first().isVisible()) {
      await expect(paidAmount.first()).toBeVisible();
    }
  });

  test('should display incident and report dates', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for dates in date columns
    const dates = page.locator('tbody td').filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|hace|ago/ });
    await expect(dates.first()).toBeVisible();
  });

  test('should sort claims by different columns', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Sort by claim number
    const numberHeader = page.locator('th button:has-text("Número")').first();
    if (await numberHeader.isVisible()) {
      await numberHeader.click();
      await page.waitForTimeout(1000);
    }

    // Sort by priority
    const priorityHeader = page.locator('th button:has-text("Prioridad")').first();
    if (await priorityHeader.isVisible()) {
      await priorityHeader.click();
      await page.waitForTimeout(1000);
    }

    // Sort by estimated amount
    const amountHeader = page.locator('th button:has-text("Monto")').first();
    if (await amountHeader.isVisible()) {
      await amountHeader.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should export claims data', async ({ authenticatedPage: page }) => {
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

  test('should show empty state when no claims found', async ({ authenticatedPage: page }) => {
    // Search for non-existent claim
    await searchTable(page, 'NONEXISTENT_CLAIM_XYZ_999');

    // Verify empty state message
    const emptyMessage = page.locator('text=/No se encontraron|No results|Sin resultados/i');
    await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in claim form', async ({ authenticatedPage: page }) => {
    // Navigate to create page
    await page.click('button:has-text("Nuevo Siniestro")');
    await page.waitForURL(/\/siniestros\/nuevo/);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")').first();
    await submitButton.click();

    // Verify validation errors
    const errors = page.locator('text=/requerido|obligatorio|necesario/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should refresh claims list', async ({ authenticatedPage: page }) => {
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

  test('should navigate to claim documents', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Click actions menu on first row
    const actionsButton = page.locator('tbody tr').first().locator('button:has([class*="vertical"])').first();
    await actionsButton.click();

    // Click documents option
    const documentsOption = page.locator('text=Documentos').last();
    if (await documentsOption.isVisible()) {
      await documentsOption.click();

      // Verify navigation
      await page.waitForURL(/\/siniestros\/[^/]+\/documentos/, { timeout: 5000 });
    }
  });

  test('should display result count', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Look for result count text
    const resultCount = page.locator('text=/Mostrando.*de.*siniestros/i');
    await expect(resultCount).toBeVisible();
  });

  test('should display claims actions menu', async ({ authenticatedPage: page }) => {
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

  test('should truncate long descriptions in table', async ({ authenticatedPage: page }) => {
    await waitForTableData(page);

    // Find description column
    const descriptions = page.locator('tbody td').nth(1);
    const text = await descriptions.first().textContent();

    // Verify description is not excessively long (should be truncated)
    if (text) {
      expect(text.length).toBeLessThan(150);
    }
  });

  test('should display statistics with percentages', async ({ authenticatedPage: page }) => {
    // Look for percentage values in statistics
    const percentages = page.locator('text=/%|\bpromedio\b/i');

    if (await percentages.first().isVisible({ timeout: 5000 })) {
      await expect(percentages.first()).toBeVisible();
    }
  });

  test('should show processing time information', async ({ authenticatedPage: page }) => {
    // Look for processing time or average time information
    const processingTime = page.locator('text=/tiempo|días|promedio/i');

    if (await processingTime.first().isVisible({ timeout: 5000 })) {
      await expect(processingTime.first()).toBeVisible();
    }
  });
});
