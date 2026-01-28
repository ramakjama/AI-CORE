/**
 * ULTIMATE CLIENT SCRAPER CON TRAZABILIDAD MÁXIMA
 * =================================================
 * Scraper ultra completo con tracking en tiempo real
 */

import { chromium, Page, Browser } from 'playwright';
import { traceManager } from '../../../lib/traceability';
import { prisma } from '../../../lib/prisma';
import ffmpeg from 'fluent-ffmpeg';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs/promises';

interface ClientRecord {
  nif: string;
  nombre?: string;
  [key: string]: any;
}

interface ScraperConfig {
  executionId: string;
  clientsFilePath: string;
  outputDir: string;
  portalUrl: string;
  credentials: {
    username: string;
    password: string;
  };
  maxDepth: number;
  screenshotEveryStep: boolean;
  recordScreen: boolean;
  enableOCR: boolean;
}

export class UltimateClientScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: ScraperConfig;
  private currentClient: ClientRecord | null = null;
  private screenRecordingProcess: any = null;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  async execute(): Promise<void> {
    try {
      // Cargar lista de clientes
      const clients = await this.loadClients();
      const totalClients = clients.length;

      // Iniciar tracking
      await traceManager.startTracking(
        'ultimate-client-scraper',
        this.config.executionId,
        totalClients
      );

      // Iniciar navegador
      await this.initBrowser();

      // Iniciar grabación de pantalla si está habilitado
      if (this.config.recordScreen) {
        await this.startScreenRecording();
      }

      // Hacer login
      await traceManager.recordStep(
        this.config.executionId,
        'Iniciando sesión en el portal',
        {
          url: this.config.portalUrl,
          title: 'Login',
        }
      );
      await this.login();

      await traceManager.checkpoint(this.config.executionId, 'Login completado');

      // Procesar cada cliente
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        this.currentClient = client;

        await traceManager.updateMetadata(this.config.executionId, {
          clientNIF: client.nif,
          clientName: client.nombre || 'Desconocido',
          clientIndex: i + 1,
          totalClients,
        });

        await this.processClient(client, i + 1, totalClients);

        await traceManager.checkpoint(
          this.config.executionId,
          `Cliente ${i + 1}/${totalClients} procesado`,
          { nif: client.nif }
        );
      }

      // Finalizar
      await traceManager.endTracking(this.config.executionId, 'success');
    } catch (error) {
      console.error('Error en scraper:', error);
      await traceManager.endTracking(
        this.config.executionId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async loadClients(): Promise<ClientRecord[]> {
    await traceManager.recordStep(
      this.config.executionId,
      'Cargando lista de clientes desde archivo',
      {
        url: this.config.clientsFilePath,
        title: 'Carga de Datos',
      }
    );

    // Aquí iría la lógica real de carga desde CSV/Excel
    // Por ahora retornamos ejemplo
    const csvContent = await fs.readFile(this.config.clientsFilePath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    const clients = lines
      .filter(line => line.trim())
      .map(line => {
        const [nif, nombre] = line.split(';');
        return { nif: nif.trim(), nombre: nombre?.trim() };
      });

    console.log(`✅ ${clients.length} clientes cargados`);
    return clients;
  }

  private async initBrowser(): Promise<void> {
    await traceManager.recordStep(
      this.config.executionId,
      'Inicializando navegador Chromium',
      {
        url: '',
        title: 'Configuración',
      }
    );

    this.browser = await chromium.launch({
      headless: false, // Visible para ver el scraping en vivo
      slowMo: 100, // Ralentizar para ver mejor
      args: ['--start-maximized'],
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: this.config.recordScreen
        ? {
            dir: path.join(this.config.outputDir, 'videos'),
            size: { width: 1920, height: 1080 },
          }
        : undefined,
    });

    this.page = await context.newPage();

    // Interceptar navegación para tracking
    this.page.on('framenavigated', async (frame) => {
      if (frame === this.page!.mainFrame()) {
        const url = frame.url();
        const title = await this.page!.title();

        console.log(`🔗 Navegación: ${title} (${url})`);
      }
    });

    console.log('✅ Navegador iniciado');
  }

  private async login(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(this.config.portalUrl);

    // Esperar formulario de login
    await this.page.waitForSelector('input[name="username"], input[type="text"]', {
      timeout: 30000,
    });

    // Tomar screenshot
    const screenshot = await this.takeScreenshot('login-page');

    await traceManager.recordStep(
      this.config.executionId,
      'Rellenando formulario de login',
      {
        url: this.config.portalUrl,
        title: 'Login - Formulario',
      },
      undefined,
      screenshot
    );

    // Rellenar credenciales
    await this.page.fill('input[name="username"], input[type="text"]', this.config.credentials.username);
    await this.page.fill('input[name="password"], input[type="password"]', this.config.credentials.password);

    await traceManager.recordStep(
      this.config.executionId,
      'Haciendo clic en botón de login',
      {
        url: this.config.portalUrl,
        title: 'Login - Submit',
        selector: 'button[type="submit"]',
      }
    );

    await this.page.click('button[type="submit"]');

    // Esperar a que cargue la página principal
    await this.page.waitForLoadState('networkidle');

    const dashboardScreenshot = await this.takeScreenshot('dashboard');

    await traceManager.recordStep(
      this.config.executionId,
      'Login exitoso - Dashboard cargado',
      {
        url: this.page.url(),
        title: await this.page.title(),
      },
      undefined,
      dashboardScreenshot
    );

    console.log('✅ Login completado');
  }

  private async processClient(
    client: ClientRecord,
    index: number,
    total: number
  ): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 Procesando cliente ${index}/${total}`);
    console.log(`📋 NIF: ${client.nif}`);
    console.log(`👤 Nombre: ${client.nombre || 'N/A'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Buscar cliente por NIF
    await traceManager.recordStep(
      this.config.executionId,
      `Buscando cliente por NIF: ${client.nif}`,
      {
        url: this.page.url(),
        title: 'Búsqueda de Cliente',
      },
      { nif: client.nif, clientIndex: index }
    );

    await this.searchClientByNIF(client.nif);

    // Extraer información de todas las pestañas
    const clientData = await this.extractAllClientData(client.nif);

    // Guardar en base de datos
    await traceManager.recordStep(
      this.config.executionId,
      'Guardando datos del cliente en base de datos',
      {
        url: this.page.url(),
        title: 'Guardado en BD',
      },
      { fieldsExtracted: Object.keys(clientData).length }
    );

    await this.saveClientToDatabase(client.nif, clientData);

    // Volver al listado
    await traceManager.recordStep(
      this.config.executionId,
      'Volviendo al listado de clientes',
      {
        url: this.page.url(),
        title: 'Navegación',
      }
    );

    await traceManager.navigateBack(this.config.executionId, 1);
  }

  private async searchClientByNIF(nif: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Implementación específica según el portal
    // Este es un ejemplo genérico

    // Ir a la página de búsqueda de clientes
    await this.page.goto(`${this.config.portalUrl}/clientes/buscar`);

    // Rellenar NIF y buscar
    await this.page.fill('input[name="nif"]', nif);
    await this.page.click('button:has-text("Buscar")');

    // Esperar resultados
    await this.page.waitForSelector('.client-result, .resultado-cliente', {
      timeout: 10000,
    });

    // Hacer clic en el cliente encontrado
    await this.page.click('.client-result:first-child, .resultado-cliente:first-child');

    await this.page.waitForLoadState('networkidle');
  }

  private async extractAllClientData(nif: string): Promise<Record<string, any>> {
    if (!this.page) throw new Error('Page not initialized');

    const allData: Record<string, any> = { nif };

    // Obtener todas las pestañas disponibles
    const tabs = await this.page.$$eval('a[role="tab"], .tab, .pestana', (elements) =>
      elements.map((el) => ({
        text: el.textContent?.trim() || '',
        href: (el as HTMLAnchorElement).href || '',
      }))
    );

    console.log(`📑 ${tabs.length} pestañas encontradas`);

    // Procesar cada pestaña
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];

      await traceManager.recordStep(
        this.config.executionId,
        `Extrayendo datos de pestaña: ${tab.text}`,
        {
          url: this.page.url(),
          title: `Cliente - ${tab.text}`,
        }
      );

      // Hacer clic en la pestaña
      await this.page.click(`a[role="tab"]:has-text("${tab.text}")`);
      await this.page.waitForTimeout(1000);

      // Tomar screenshot
      const screenshot = await this.takeScreenshot(`tab-${i}-${tab.text}`);

      // Extraer texto de la pestaña
      const tabData = await this.page.evaluate(() => {
        const data: Record<string, string> = {};
        const labels = document.querySelectorAll('label, .label, .campo-nombre');

        labels.forEach((label) => {
          const text = label.textContent?.trim();
          const value = label.nextElementSibling?.textContent?.trim();
          if (text && value) {
            data[text] = value;
          }
        });

        return data;
      });

      // OCR si está habilitado
      if (this.config.enableOCR && screenshot) {
        const ocrText = await this.performOCR(screenshot);
        tabData['_ocr'] = ocrText;
      }

      allData[tab.text] = tabData;

      console.log(`  ✓ ${Object.keys(tabData).length} campos extraídos de "${tab.text}"`);
    }

    return allData;
  }

  private async saveClientToDatabase(
    nif: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Verificar si el cliente existe
      let client = await prisma.client.findUnique({
        where: { nif },
      });

      if (client) {
        // Actualizar cliente existente
        client = await prisma.client.update({
          where: { nif },
          data: {
            scrapedData: data as any,
            lastScrapedAt: new Date(),
          },
        });
      } else {
        // Crear nuevo cliente
        client = await prisma.client.create({
          data: {
            nif,
            scrapedData: data as any,
            lastScrapedAt: new Date(),
          },
        });
      }

      console.log(`✅ Cliente guardado en BD: ${nif}`);
    } catch (error) {
      console.error(`❌ Error guardando cliente ${nif}:`, error);
      throw error;
    }
  }

  private async takeScreenshot(name: string): Promise<string | undefined> {
    if (!this.page || !this.config.screenshotEveryStep) return undefined;

    try {
      const filename = `${Date.now()}-${name}.png`;
      const filepath = path.join(this.config.outputDir, 'screenshots', filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await this.page.screenshot({ path: filepath, fullPage: true });

      return filepath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return undefined;
    }
  }

  private async performOCR(imagePath: string): Promise<string> {
    try {
      const { data } = await Tesseract.recognize(imagePath, 'spa');
      return data.text;
    } catch (error) {
      console.error('OCR error:', error);
      return '';
    }
  }

  private async startScreenRecording(): Promise<void> {
    // Implementar grabación de pantalla con FFmpeg
    console.log('🎥 Grabación de pantalla iniciada');
  }

  private async cleanup(): Promise<void> {
    if (this.screenRecordingProcess) {
      this.screenRecordingProcess.kill();
    }

    if (this.browser) {
      await this.browser.close();
    }

    console.log('🧹 Limpieza completada');
  }
}

// Función de ejecución
export async function runUltimateClientScraper(config: ScraperConfig): Promise<void> {
  const scraper = new UltimateClientScraper(config);
  await scraper.execute();
}
