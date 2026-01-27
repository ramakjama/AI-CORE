/**
 * Tax Service
 * Servicio de impuestos con soporte para modelos AEAT y SII
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  TaxDeclaration,
  TaxDeclarationType,
  SIIRecord,
  SIIOperationType,
  SIIStatus,
  SIIVATDetail,
  Invoice,
  VATType,
  AccountingResult,
} from '../types';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface Model303Data {
  // Régimen general
  baseImponibleTipoGeneral: number;       // Casilla 01
  cuotaTipoGeneral: number;               // Casilla 02
  baseImponibleTipoReducido: number;      // Casilla 03
  cuotaTipoReducido: number;              // Casilla 04
  baseImponibleTipoSuperReducido: number; // Casilla 05
  cuotaTipoSuperReducido: number;         // Casilla 06

  // Total IVA devengado
  totalIVADevengado: number;              // Casilla 27

  // IVA deducible
  cuotaDeducibleOperacionesInteriores: number; // Casilla 28
  cuotaDeducibleImportaciones: number;         // Casilla 29
  cuotaDeducibleAdqIntracomunitarias: number;  // Casilla 30
  totalIVADeducible: number;                   // Casilla 45

  // Resultado
  diferencia: number;                     // Casilla 46
  cuotasCompensarPeriodosAnteriores: number; // Casilla 67
  resultado: number;                      // Casilla 71
}

interface Model347Partner {
  nif: string;
  nombre: string;
  provinciaCode: string;
  paisCode: string;
  totalOperaciones: number;
  operacionesPrimerTrimestre: number;
  operacionesSegundoTrimestre: number;
  operacionesTercerTrimestre: number;
  operacionesCuartoTrimestre: number;
}

interface Model349Operation {
  nif: string;
  nombre: string;
  paisCode: string;
  claveOperacion: 'A' | 'B' | 'C' | 'D' | 'E' | 'T'; // A=Entregas, B=Adquisiciones...
  baseImponible: number;
}

// ============================================================================
// ALMACENAMIENTO EN MEMORIA
// ============================================================================

const taxDeclarations: Map<string, TaxDeclaration> = new Map();
const siiRecords: Map<string, SIIRecord> = new Map();

// Simular facturas para cálculos (en producción vendría del invoicingService)
const mockInvoices: Map<string, Invoice> = new Map();

// ============================================================================
// CONFIGURACIÓN SII
// ============================================================================

const SII_CONFIG = {
  production: {
    url: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
    urlRecibidas: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
  },
  test: {
    url: 'https://www7.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
    urlRecibidas: 'https://www7.aeat.es/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
  },
};

// ============================================================================
// SERVICIO DE IMPUESTOS
// ============================================================================

export class TaxService {
  private isProduction = false;

  /**
   * Calcula el IVA de una factura
   */
  async calculateVAT(
    invoiceId: string
  ): Promise<AccountingResult<{ baseImponible: number; cuotaIVA: number; total: number; desglose: SIIVATDetail[] }>> {
    try {
      // En producción, obtendría la factura del servicio de facturación
      const invoice = mockInvoices.get(invoiceId);
      if (!invoice) {
        // Simular factura para demo
        return {
          success: true,
          data: {
            baseImponible: 1000,
            cuotaIVA: 210,
            total: 1210,
            desglose: [
              {
                vatType: 'IVA',
                vatRate: 21,
                taxableBase: 1000,
                taxAmount: 210,
              },
            ],
          },
        };
      }

      const desglose: SIIVATDetail[] = invoice.vatBreakdown.map(vat => ({
        vatType: vat.vatType.toString(),
        vatRate: vat.vatRate,
        taxableBase: vat.baseAmount,
        taxAmount: vat.vatAmount,
        surchargeRate: vat.surchargeRate,
        surchargeAmount: vat.surchargeAmount,
      }));

      return {
        success: true,
        data: {
          baseImponible: invoice.subtotal,
          cuotaIVA: invoice.totalTax,
          total: invoice.total,
          desglose,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al calcular IVA: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera el modelo 303 - IVA trimestral
   */
  async generateModel303(period: string): Promise<AccountingResult<TaxDeclaration>> {
    try {
      // Validar formato del período (ej: '2024-1T', '2024-2T', etc.)
      const periodMatch = period.match(/^(\d{4})-([1-4])T$/);
      if (!periodMatch) {
        return {
          success: false,
          error: 'Formato de período inválido. Use YYYY-NT (ej: 2024-1T)',
        };
      }

      const year = parseInt(periodMatch[1]);
      const quarter = periodMatch[2];

      // Calcular datos del modelo (en producción, agregaría facturas reales)
      const data: Model303Data = {
        // IVA repercutido (ventas)
        baseImponibleTipoGeneral: 50000,
        cuotaTipoGeneral: 10500,
        baseImponibleTipoReducido: 10000,
        cuotaTipoReducido: 1000,
        baseImponibleTipoSuperReducido: 2000,
        cuotaTipoSuperReducido: 80,

        totalIVADevengado: 11580,

        // IVA soportado (compras)
        cuotaDeducibleOperacionesInteriores: 5000,
        cuotaDeducibleImportaciones: 500,
        cuotaDeducibleAdqIntracomunitarias: 200,
        totalIVADeducible: 5700,

        // Resultado
        diferencia: 5880,
        cuotasCompensarPeriodosAnteriores: 0,
        resultado: 5880,
      };

      const declaration: TaxDeclaration = {
        id: uuidv4(),
        type: TaxDeclarationType.MODEL_303,
        fiscalYear: year,
        period: quarter + 'T',
        data: data as unknown as Record<string, number>,
        result: data.resultado,
        status: 'CALCULATED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generar XML del modelo 303
      declaration.xmlFile = this.generateModel303XML(data, year, quarter);

      taxDeclarations.set(declaration.id, declaration);

      return {
        success: true,
        data: declaration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar modelo 303: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera XML del modelo 303
   */
  private generateModel303XML(data: Model303Data, year: number, quarter: string): string {
    const formatAmount = (amount: number) => amount.toFixed(2);

    return `<?xml version="1.0" encoding="UTF-8"?>
<modelo303>
  <ejercicio>${year}</ejercicio>
  <periodo>${quarter}T</periodo>

  <!-- IVA Devengado -->
  <regimenGeneral>
    <baseImponible>${formatAmount(data.baseImponibleTipoGeneral)}</baseImponible>
    <tipo>21.00</tipo>
    <cuota>${formatAmount(data.cuotaTipoGeneral)}</cuota>
  </regimenGeneral>

  <regimenReducido>
    <baseImponible>${formatAmount(data.baseImponibleTipoReducido)}</baseImponible>
    <tipo>10.00</tipo>
    <cuota>${formatAmount(data.cuotaTipoReducido)}</cuota>
  </regimenReducido>

  <regimenSuperReducido>
    <baseImponible>${formatAmount(data.baseImponibleTipoSuperReducido)}</baseImponible>
    <tipo>4.00</tipo>
    <cuota>${formatAmount(data.cuotaTipoSuperReducido)}</cuota>
  </regimenSuperReducido>

  <totalIVADevengado>${formatAmount(data.totalIVADevengado)}</totalIVADevengado>

  <!-- IVA Deducible -->
  <ivaDeducible>
    <operacionesInteriores>${formatAmount(data.cuotaDeducibleOperacionesInteriores)}</operacionesInteriores>
    <importaciones>${formatAmount(data.cuotaDeducibleImportaciones)}</importaciones>
    <adquisicionesIntracomunitarias>${formatAmount(data.cuotaDeducibleAdqIntracomunitarias)}</adquisicionesIntracomunitarias>
    <total>${formatAmount(data.totalIVADeducible)}</total>
  </ivaDeducible>

  <!-- Resultado -->
  <diferencia>${formatAmount(data.diferencia)}</diferencia>
  <cuotasCompensarAnteriores>${formatAmount(data.cuotasCompensarPeriodosAnteriores)}</cuotasCompensarAnteriores>
  <resultado>${formatAmount(data.resultado)}</resultado>
</modelo303>`;
  }

  /**
   * Genera el modelo 390 - Resumen anual IVA
   */
  async generateModel390(year: number): Promise<AccountingResult<TaxDeclaration>> {
    try {
      // Obtener datos de los modelos 303 del año
      const quarterlyDeclarations = Array.from(taxDeclarations.values()).filter(
        d => d.type === TaxDeclarationType.MODEL_303 && d.fiscalYear === year
      );

      // Agregar datos anuales
      let totalBaseGeneral = new Decimal(0);
      let totalCuotaGeneral = new Decimal(0);
      let totalBaseReducido = new Decimal(0);
      let totalCuotaReducido = new Decimal(0);
      let totalBaseSuperReducido = new Decimal(0);
      let totalCuotaSuperReducido = new Decimal(0);
      let totalIVADevengado = new Decimal(0);
      let totalIVADeducible = new Decimal(0);

      for (const quarterly of quarterlyDeclarations) {
        const qData = quarterly.data as unknown as Model303Data;
        totalBaseGeneral = totalBaseGeneral.plus(qData.baseImponibleTipoGeneral || 0);
        totalCuotaGeneral = totalCuotaGeneral.plus(qData.cuotaTipoGeneral || 0);
        totalBaseReducido = totalBaseReducido.plus(qData.baseImponibleTipoReducido || 0);
        totalCuotaReducido = totalCuotaReducido.plus(qData.cuotaTipoReducido || 0);
        totalBaseSuperReducido = totalBaseSuperReducido.plus(qData.baseImponibleTipoSuperReducido || 0);
        totalCuotaSuperReducido = totalCuotaSuperReducido.plus(qData.cuotaTipoSuperReducido || 0);
        totalIVADevengado = totalIVADevengado.plus(qData.totalIVADevengado || 0);
        totalIVADeducible = totalIVADeducible.plus(qData.totalIVADeducible || 0);
      }

      const data = {
        // Totales anuales
        totalBaseImponibleGeneral: totalBaseGeneral.toNumber(),
        totalCuotaGeneral: totalCuotaGeneral.toNumber(),
        totalBaseImponibleReducido: totalBaseReducido.toNumber(),
        totalCuotaReducido: totalCuotaReducido.toNumber(),
        totalBaseImponibleSuperReducido: totalBaseSuperReducido.toNumber(),
        totalCuotaSuperReducido: totalCuotaSuperReducido.toNumber(),
        totalIVADevengadoAnual: totalIVADevengado.toNumber(),
        totalIVADeducibleAnual: totalIVADeducible.toNumber(),
        resultadoAnual: totalIVADevengado.minus(totalIVADeducible).toNumber(),

        // Datos adicionales para el 390
        volumenOperaciones: totalBaseGeneral.plus(totalBaseReducido).plus(totalBaseSuperReducido).toNumber(),
        operacionesExentas: 0,
        operacionesNoSujetas: 0,
      };

      const declaration: TaxDeclaration = {
        id: uuidv4(),
        type: TaxDeclarationType.MODEL_390,
        fiscalYear: year,
        period: '00', // Anual
        data,
        result: data.resultadoAnual,
        status: 'CALCULATED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taxDeclarations.set(declaration.id, declaration);

      return {
        success: true,
        data: declaration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar modelo 390: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera el modelo 347 - Operaciones con terceros
   */
  async generateModel347(year: number): Promise<AccountingResult<TaxDeclaration>> {
    try {
      // En producción, agruparía facturas por tercero y calcularía totales
      const partners: Model347Partner[] = [
        {
          nif: 'B12345678',
          nombre: 'Proveedor Ejemplo S.L.',
          provinciaCode: '28',
          paisCode: 'ES',
          totalOperaciones: 15000,
          operacionesPrimerTrimestre: 4000,
          operacionesSegundoTrimestre: 3500,
          operacionesTercerTrimestre: 4000,
          operacionesCuartoTrimestre: 3500,
        },
        {
          nif: 'A87654321',
          nombre: 'Cliente Grande S.A.',
          provinciaCode: '08',
          paisCode: 'ES',
          totalOperaciones: 25000,
          operacionesPrimerTrimestre: 6000,
          operacionesSegundoTrimestre: 6500,
          operacionesTercerTrimestre: 6000,
          operacionesCuartoTrimestre: 6500,
        },
      ];

      // Solo incluir operaciones > 3.005,06 euros
      const partnersOver3005 = partners.filter(p => p.totalOperaciones > 3005.06);

      const data = {
        numeroDeclaraciones: partnersOver3005.length,
        importeTotalOperaciones: partnersOver3005.reduce((sum, p) => sum + p.totalOperaciones, 0),
        declarados: partnersOver3005,
      };

      const declaration: TaxDeclaration = {
        id: uuidv4(),
        type: TaxDeclarationType.MODEL_347,
        fiscalYear: year,
        period: '00',
        data: data as unknown as Record<string, number>,
        result: data.importeTotalOperaciones,
        status: 'CALCULATED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generar XML
      declaration.xmlFile = this.generateModel347XML(partnersOver3005, year);

      taxDeclarations.set(declaration.id, declaration);

      return {
        success: true,
        data: declaration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar modelo 347: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera XML del modelo 347
   */
  private generateModel347XML(partners: Model347Partner[], year: number): string {
    const formatAmount = (amount: number) => amount.toFixed(2);

    const declarados = partners.map(p => `
    <declarado>
      <nif>${p.nif}</nif>
      <nombreRazonSocial>${this.escapeXml(p.nombre)}</nombreRazonSocial>
      <codigoProvincia>${p.provinciaCode}</codigoProvincia>
      <codigoPais>${p.paisCode}</codigoPais>
      <importeAnual>${formatAmount(p.totalOperaciones)}</importeAnual>
      <importePrimerTrimestre>${formatAmount(p.operacionesPrimerTrimestre)}</importePrimerTrimestre>
      <importeSegundoTrimestre>${formatAmount(p.operacionesSegundoTrimestre)}</importeSegundoTrimestre>
      <importeTercerTrimestre>${formatAmount(p.operacionesTercerTrimestre)}</importeTercerTrimestre>
      <importeCuartoTrimestre>${formatAmount(p.operacionesCuartoTrimestre)}</importeCuartoTrimestre>
    </declarado>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<modelo347>
  <ejercicio>${year}</ejercicio>
  <tipoDeclaracion>C</tipoDeclaracion>
  <declarados>${declarados}
  </declarados>
</modelo347>`;
  }

  /**
   * Genera el modelo 349 - Operaciones intracomunitarias
   */
  async generateModel349(period: string): Promise<AccountingResult<TaxDeclaration>> {
    try {
      const periodMatch = period.match(/^(\d{4})-([1-4])T$/);
      if (!periodMatch) {
        return {
          success: false,
          error: 'Formato de período inválido. Use YYYY-NT (ej: 2024-1T)',
        };
      }

      const year = parseInt(periodMatch[1]);
      const quarter = periodMatch[2];

      // En producción, filtrar facturas intracomunitarias
      const operations: Model349Operation[] = [
        {
          nif: 'FR12345678901',
          nombre: 'Société Française SARL',
          paisCode: 'FR',
          claveOperacion: 'A', // Entregas
          baseImponible: 8000,
        },
        {
          nif: 'DE123456789',
          nombre: 'German Company GmbH',
          paisCode: 'DE',
          claveOperacion: 'B', // Adquisiciones
          baseImponible: 5500,
        },
      ];

      const totalEntregas = operations
        .filter(o => o.claveOperacion === 'A')
        .reduce((sum, o) => sum + o.baseImponible, 0);

      const totalAdquisiciones = operations
        .filter(o => o.claveOperacion === 'B')
        .reduce((sum, o) => sum + o.baseImponible, 0);

      const data = {
        numeroOperadores: operations.length,
        totalEntregasIntracomunitarias: totalEntregas,
        totalAdquisicionesIntracomunitarias: totalAdquisiciones,
        operaciones: operations,
      };

      const declaration: TaxDeclaration = {
        id: uuidv4(),
        type: TaxDeclarationType.MODEL_349,
        fiscalYear: year,
        period: quarter + 'T',
        data: data as unknown as Record<string, number>,
        result: totalEntregas - totalAdquisiciones,
        status: 'CALCULATED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taxDeclarations.set(declaration.id, declaration);

      return {
        success: true,
        data: declaration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar modelo 349: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Envía una factura al SII (Suministro Inmediato de Información)
   */
  async submitToSII(invoiceId: string): Promise<AccountingResult<SIIRecord>> {
    try {
      // En producción, obtendría la factura real
      const invoice = mockInvoices.get(invoiceId);

      // Crear registro SII
      const siiRecord: SIIRecord = {
        id: uuidv4(),
        invoiceId,
        bookType: 'EMITIDAS',
        operationType: SIIOperationType.EMITIDA,
        invoiceNumber: invoice?.number || `DEMO-${Date.now()}`,
        invoiceDate: invoice?.issueDate || new Date(),
        counterpartyVAT: invoice?.partnerVAT || 'B12345678',
        counterpartyName: invoice?.partnerName || 'Cliente Demo S.L.',
        counterpartyCountry: 'ES',
        totalAmount: invoice?.total || 1210,
        taxableBase: invoice?.subtotal || 1000,
        taxAmount: invoice?.totalTax || 210,
        vatBreakdown: [
          {
            vatType: 'S1',
            vatRate: 21,
            taxableBase: invoice?.subtotal || 1000,
            taxAmount: invoice?.totalTax || 210,
          },
        ],
        status: SIIStatus.PENDING,
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generar XML de envío al SII
      siiRecord.requestXml = this.generateSIIXML(siiRecord);

      // Simular envío (en producción, usaría SOAP con certificado digital)
      const sendResult = await this.sendToSIIService(siiRecord);

      if (sendResult.success) {
        siiRecord.status = SIIStatus.SENT;
        siiRecord.sentAt = new Date();
        siiRecord.attempts = 1;

        // Simular respuesta positiva
        siiRecord.status = SIIStatus.ACCEPTED;
        siiRecord.responseCode = '0';
        siiRecord.responseMessage = 'Aceptada';
        siiRecord.csv = `CSV${Date.now()}`;
      } else {
        siiRecord.status = SIIStatus.REJECTED;
        siiRecord.responseCode = sendResult.errorCode || 'ERROR';
        siiRecord.responseMessage = sendResult.error || 'Error desconocido';
        siiRecord.nextRetryAt = new Date(Date.now() + 3600000); // Reintentar en 1 hora
      }

      siiRecord.lastAttemptAt = new Date();
      siiRecord.updatedAt = new Date();

      siiRecords.set(siiRecord.id, siiRecord);

      return {
        success: true,
        data: siiRecord,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar al SII: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera XML para envío al SII
   */
  private generateSIIXML(record: SIIRecord): string {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatAmount = (amount: number) => amount.toFixed(2);

    const desgloseFactura = record.vatBreakdown.map(vat => `
              <sii:DetalleIVA>
                <sii:TipoImpositivo>${formatAmount(vat.vatRate)}</sii:TipoImpositivo>
                <sii:BaseImponible>${formatAmount(vat.taxableBase)}</sii:BaseImponible>
                <sii:CuotaRepercutida>${formatAmount(vat.taxAmount)}</sii:CuotaRepercutida>
              </sii:DetalleIVA>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:SuministroLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>MI EMPRESA S.L.</sii:NombreRazon>
          <sii:NIF>B12345678</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <siiLR:RegistroLRFacturasEmitidas>
        <siiLR:PeriodoLiquidacion>
          <sii:Ejercicio>${record.invoiceDate.getFullYear()}</sii:Ejercicio>
          <sii:Periodo>${String(record.invoiceDate.getMonth() + 1).padStart(2, '0')}</sii:Periodo>
        </siiLR:PeriodoLiquidacion>
        <siiLR:IDFactura>
          <sii:IDEmisorFactura>
            <sii:NIF>B12345678</sii:NIF>
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${record.invoiceNumber}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${formatDate(record.invoiceDate)}</sii:FechaExpedicionFacturaEmisor>
        </siiLR:IDFactura>
        <siiLR:FacturaExpedida>
          <sii:TipoFactura>${record.operationType}</sii:TipoFactura>
          <sii:ClaveRegimenEspecialOTrascendencia>01</sii:ClaveRegimenEspecialOTrascendencia>
          <sii:ImporteTotal>${formatAmount(record.totalAmount)}</sii:ImporteTotal>
          <sii:DescripcionOperacion>Servicios profesionales</sii:DescripcionOperacion>
          <sii:Contraparte>
            <sii:NombreRazon>${this.escapeXml(record.counterpartyName)}</sii:NombreRazon>
            <sii:NIF>${record.counterpartyVAT}</sii:NIF>
          </sii:Contraparte>
          <sii:TipoDesglose>
            <sii:DesgloseFactura>
              <sii:Sujeta>
                <sii:NoExenta>
                  <sii:TipoNoExenta>S1</sii:TipoNoExenta>
                  <sii:DesgloseIVA>${desgloseFactura}
                  </sii:DesgloseIVA>
                </sii:NoExenta>
              </sii:Sujeta>
            </sii:DesgloseFactura>
          </sii:TipoDesglose>
        </siiLR:FacturaExpedida>
      </siiLR:RegistroLRFacturasEmitidas>
    </siiLR:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Simula envío al servicio SII (en producción usaría SOAP real)
   */
  private async sendToSIIService(
    _record: SIIRecord
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 100));

    // En producción, aquí iría la llamada SOAP con certificado digital
    // usando la librería soap o similar

    // Simular éxito en el 90% de los casos
    if (Math.random() > 0.1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Error de conexión con el servicio SII',
        errorCode: 'CONNECTION_ERROR',
      };
    }
  }

  /**
   * Obtiene el estado de un registro SII
   */
  async getSIIStatus(invoiceId: string): Promise<AccountingResult<SIIRecord>> {
    try {
      // Buscar registro SII por invoiceId
      const record = Array.from(siiRecords.values()).find(r => r.invoiceId === invoiceId);

      if (!record) {
        return {
          success: false,
          error: `No se encontró registro SII para la factura ${invoiceId}`,
        };
      }

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener estado SII: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene declaraciones fiscales
   */
  async getTaxDeclarations(
    type?: TaxDeclarationType,
    year?: number
  ): Promise<AccountingResult<TaxDeclaration[]>> {
    let declarations = Array.from(taxDeclarations.values());

    if (type) {
      declarations = declarations.filter(d => d.type === type);
    }
    if (year) {
      declarations = declarations.filter(d => d.fiscalYear === year);
    }

    declarations.sort((a, b) => {
      if (a.fiscalYear !== b.fiscalYear) {
        return b.fiscalYear - a.fiscalYear;
      }
      return b.period.localeCompare(a.period);
    });

    return {
      success: true,
      data: declarations,
    };
  }

  /**
   * Escapa caracteres XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Exportar instancia singleton
export const taxService = new TaxService();
