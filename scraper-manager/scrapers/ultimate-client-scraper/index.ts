import { chromium, Page, Browser, BrowserContext } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

interface ScraperConfig {
  portalUrl: string;
  username: string;
  password: string;
  outputDir: string;
  recordingEnabled: boolean;
  deepScan: boolean;
  maxDepth: number;
}

export class UltimateClientScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: ScraperConfig;
  private recording: any = null;
  private screenshots: string[] = [];

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Initialize the scraper
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Ultimate Client Scraper...');

    // Launch browser with recording capabilities
    this.browser = await chromium.launch({
      headless: false, // Visible for debugging
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: this.config.recordingEnabled
        ? {
            dir: path.join(this.config.outputDir, 'recordings'),
            size: { width: 1920, height: 1080 },
          }
        : undefined,
      recordHar: {
        path: path.join(this.config.outputDir, 'network.har'),
        mode: 'full',
      },
    });

    this.page = await this.context.newPage();

    // Track mouse movements
    await this.page.addInitScript(() => {
      // Add cursor tracking
      document.addEventListener('mousemove', (e) => {
        (window as any).lastMousePosition = { x: e.clientX, y: e.clientY };
      });
    });

    console.log('✅ Scraper initialized');
  }

  /**
   * Login to the portal
   */
  async login(): Promise<void> {
    if (!this.page) throw new Error('Scraper not initialized');

    console.log('🔐 Logging in to portal...');

    await this.page.goto(this.config.portalUrl);
    await this.takeScreenshot('login-page');

    // Fill credentials
    await this.page.fill('input[name="username"]', this.config.username);
    await this.page.fill('input[name="password"]', this.config.password);

    await this.takeScreenshot('credentials-filled');

    // Submit login
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');

    await this.takeScreenshot('logged-in');

    console.log('✅ Logged in successfully');
  }

  /**
   * Get list of all clients from database view
   */
  async getClientList(): Promise<string[]> {
    if (!this.page) throw new Error('Scraper not initialized');

    console.log('📋 Fetching client list...');

    // Navigate to clients page
    await this.page.goto(`${this.config.portalUrl}/clients`);
    await this.page.waitForLoadState('networkidle');

    // Extract all client NIFs
    const nifs = await this.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map((row) => {
        const nifCell = row.querySelector('[data-column="nif"]');
        return nifCell?.textContent?.trim() || '';
      }).filter(Boolean);
    });

    console.log(`✅ Found ${nifs.length} clients`);

    return nifs;
  }

  /**
   * Scrape complete data for a single client
   */
  async scrapeClient(nif: string): Promise<any> {
    if (!this.page) throw new Error('Scraper not initialized');

    console.log(`🔍 Scraping client: ${nif}`);

    const clientData: any = {
      nif,
      scrapedAt: new Date().toISOString(),
      source: 'ultimate-client-scraper',
      data: {},
      variants: [],
      documents: [],
      screenshots: [],
    };

    try {
      // Search for client
      await this.searchClient(nif);

      // Extract basic info
      clientData.data.basic = await this.extractBasicInfo();

      // Navigate through all tabs
      const tabs = await this.page.$$('[role="tab"]');

      for (const tab of tabs) {
        const tabName = await tab.textContent();
        console.log(`  📑 Processing tab: ${tabName}`);

        await tab.click();
        await this.page.waitForLoadState('networkidle');
        await this.takeScreenshot(`client-${nif}-tab-${tabName}`);

        // Extract data from this tab
        const tabData = await this.extractTabData();
        clientData.data[tabName || 'unknown'] = tabData;

        // Look for sub-tabs
        const subTabs = await this.page.$$('[role="tab"][data-level="2"]');
        for (const subTab of subTabs) {
          const subTabName = await subTab.textContent();
          console.log(`    📄 Processing sub-tab: ${subTabName}`);

          await subTab.click();
          await this.page.waitForLoadState('networkidle');

          const subTabData = await this.extractTabData();
          clientData.data[`${tabName}-${subTabName}`] = subTabData;
        }
      }

      // Extract documents
      clientData.documents = await this.extractDocuments();

      // OCR processing for images
      for (const screenshot of this.screenshots) {
        const ocrText = await this.performOCR(screenshot);
        clientData.data.ocr = clientData.data.ocr || [];
        clientData.data.ocr.push({
          screenshot,
          text: ocrText,
        });
      }

      console.log(`✅ Client ${nif} scraped successfully`);

      return clientData;
    } catch (error) {
      console.error(`❌ Error scraping client ${nif}:`, error);
      throw error;
    }
  }

  /**
   * Search for a specific client
   */
  private async searchClient(nif: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.fill('input[name="search"]', nif);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');

    // Click on the client row
    await this.page.click(`tr[data-nif="${nif}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Extract basic client information
   */
  private async extractBasicInfo(): Promise<any> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      const extractFieldValue = (label: string): string | null => {
        const labelEl = Array.from(document.querySelectorAll('label, .label, .field-label'))
          .find((el) => el.textContent?.toLowerCase().includes(label.toLowerCase()));

        if (labelEl) {
          const parent = labelEl.parentElement;
          const valueEl = parent?.querySelector('input, select, textarea, .value, .field-value');
          return valueEl?.textContent?.trim() || (valueEl as HTMLInputElement)?.value || null;
        }

        return null;
      };

      return {
        firstName: extractFieldValue('nombre'),
        lastName: extractFieldValue('apellidos'),
        email: extractFieldValue('email') || extractFieldValue('correo'),
        phone: extractFieldValue('teléfono') || extractFieldValue('telefono'),
        mobile: extractFieldValue('móvil') || extractFieldValue('movil'),
        address: extractFieldValue('dirección') || extractFieldValue('direccion'),
        city: extractFieldValue('ciudad') || extractFieldValue('localidad'),
        postalCode: extractFieldValue('código postal') || extractFieldValue('cp'),
        province: extractFieldValue('provincia'),
        birthDate: extractFieldValue('fecha de nacimiento') || extractFieldValue('nacimiento'),
      };
    });
  }

  /**
   * Extract all data from current tab
   */
  private async extractTabData(): Promise<any> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      const data: any = {};

      // Extract all form fields
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input: any) => {
        const name = input.name || input.id;
        if (name) {
          data[name] = input.value;
        }
      });

      // Extract all labeled fields
      const labels = document.querySelectorAll('label');
      labels.forEach((label) => {
        const labelText = label.textContent?.trim();
        const parent = label.parentElement;
        const valueEl = parent?.querySelector('.value, .field-value');

        if (labelText && valueEl) {
          data[labelText] = valueEl.textContent?.trim();
        }
      });

      // Extract tables
      const tables = document.querySelectorAll('table');
      const tableData: any[] = [];

      tables.forEach((table, idx) => {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const headers = Array.from(table.querySelectorAll('thead th')).map(
          (th) => th.textContent?.trim() || ''
        );

        const rowData = rows.map((row) => {
          const cells = Array.from(row.querySelectorAll('td'));
          const rowObj: any = {};

          cells.forEach((cell, cellIdx) => {
            const header = headers[cellIdx] || `column_${cellIdx}`;
            rowObj[header] = cell.textContent?.trim();
          });

          return rowObj;
        });

        tableData.push({
          table: idx,
          data: rowData,
        });
      });

      if (tableData.length > 0) {
        data.tables = tableData;
      }

      return data;
    });
  }

  /**
   * Extract document links and metadata
   */
  private async extractDocuments(): Promise<any[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('📄 Extracting documents...');

    const documents = await this.page.evaluate(() => {
      const docLinks = Array.from(
        document.querySelectorAll('a[href*="documento"], a[href*="document"], .document-link')
      );

      return docLinks.map((link: any) => ({
        name: link.textContent?.trim() || 'Unknown',
        url: link.href,
        type: link.dataset.type || 'unknown',
      }));
    });

    console.log(`✅ Found ${documents.length} documents`);

    return documents;
  }

  /**
   * Take a screenshot
   */
  private async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshotPath = path.join(
      this.config.outputDir,
      'screenshots',
      `${name}-${Date.now()}.png`
    );

    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    this.screenshots.push(screenshotPath);

    return screenshotPath;
  }

  /**
   * Perform OCR on a screenshot
   */
  private async performOCR(imagePath: string): Promise<string> {
    console.log(`🔍 Performing OCR on ${imagePath}...`);

    try {
      const { data: { text } } = await Tesseract.recognize(imagePath, 'spa', {
        logger: (m) => console.log(m),
      });

      return text;
    } catch (error) {
      console.error('❌ OCR failed:', error);
      return '';
    }
  }

  /**
   * Save client data to JSON
   */
  async saveClientData(clientData: any): Promise<void> {
    const outputPath = path.join(
      this.config.outputDir,
      'clients',
      `${clientData.nif}.json`
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(clientData, null, 2));

    console.log(`💾 Client data saved to ${outputPath}`);
  }

  /**
   * Close the scraper
   */
  async close(): Promise<void> {
    console.log('🔒 Closing scraper...');

    if (this.page) {
      await this.page.close();
    }

    if (this.context) {
      await this.context.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    console.log('✅ Scraper closed');
  }

  /**
   * Run the complete scraping process
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.login();

      const clients = await this.getClientList();

      for (const nif of clients) {
        try {
          const clientData = await this.scrapeClient(nif);
          await this.saveClientData(clientData);

          // Optional: Send to DataHub
          // await dataHubConnector.insertClient(clientData);
        } catch (error) {
          console.error(`❌ Failed to scrape client ${nif}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Scraper failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Export for use in main application
export default UltimateClientScraper;
