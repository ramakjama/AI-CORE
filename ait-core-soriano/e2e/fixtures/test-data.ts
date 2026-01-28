/**
 * Test data generators and mock data for E2E tests
 */

export interface TestPolicy {
  policyNumber: string;
  type: 'auto' | 'home' | 'life' | 'health' | 'business';
  clientName: string;
  insuranceCompany: string;
  premium: number;
  startDate: string;
  endDate: string;
}

export interface TestClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  type: 'individual' | 'business';
}

export interface TestClaim {
  claimNumber: string;
  policyNumber: string;
  type: 'accident' | 'theft' | 'damage' | 'medical' | 'liability';
  description: string;
  incidentDate: string;
  estimatedAmount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Generate random test client
 */
export function generateTestClient(index: number = 1): TestClient {
  return {
    firstName: `TestClient${index}`,
    lastName: `Apellido${index}`,
    email: `testclient${index}@test.com`,
    phone: `+34 6${String(index).padStart(8, '0')}`,
    address: {
      street: `Calle Test ${index}`,
      city: 'Madrid',
      zipCode: '28001',
      country: 'España',
    },
    type: 'individual',
  };
}

/**
 * Generate random test policy
 */
export function generateTestPolicy(index: number = 1, clientName?: string): TestPolicy {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  return {
    policyNumber: `TEST-POL-${Date.now()}-${index}`,
    type: ['auto', 'home', 'life', 'health', 'business'][index % 5] as any,
    clientName: clientName || `TestClient${index} Apellido${index}`,
    insuranceCompany: ['Mapfre', 'Allianz', 'AXA', 'Zurich', 'Generali'][index % 5],
    premium: 500 + index * 100,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Generate random test claim
 */
export function generateTestClaim(index: number = 1, policyNumber?: string): TestClaim {
  const incidentDate = new Date();
  incidentDate.setDate(incidentDate.getDate() - 7);

  return {
    claimNumber: `TEST-CLM-${Date.now()}-${index}`,
    policyNumber: policyNumber || `POL-2024-${String(index).padStart(4, '0')}`,
    type: ['accident', 'theft', 'damage', 'medical', 'liability'][index % 5] as any,
    description: `Descripción del siniestro de prueba número ${index}. Este es un caso de prueba automatizado.`,
    incidentDate: incidentDate.toISOString().split('T')[0],
    estimatedAmount: 1000 + index * 500,
    priority: ['low', 'medium', 'high', 'urgent'][index % 4] as any,
  };
}

/**
 * Wait helper for network idle
 */
export async function waitForNetworkIdle(page: any, timeout = 2000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Fill form helper
 */
export async function fillForm(page: any, formData: Record<string, any>): Promise<void> {
  for (const [key, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`).first();

    if (await input.isVisible()) {
      const tagName = await input.evaluate((el: any) => el.tagName.toLowerCase());

      if (tagName === 'select') {
        await input.selectOption({ label: value });
      } else {
        await input.fill(String(value));
      }
    }
  }
}

/**
 * Generate timestamp for unique test data
 */
export function generateTimestamp(): string {
  return Date.now().toString();
}

/**
 * Cleanup test data pattern
 */
export function isTestData(identifier: string): boolean {
  return identifier.includes('TEST-') || identifier.includes('test@test.com');
}
