import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { CreatePolicyDto, QuoteResultDto, PolicyQuoteDto } from '../dto';

interface InsurerConnector {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  active: boolean;
}

interface InsurerQuoteRequest {
  insurerId: string;
  quoteData: PolicyQuoteDto;
}

interface InsurerQuoteResponse {
  insurerId: string;
  insurerName: string;
  quote: QuoteResultDto;
  responseTime: number;
  available: boolean;
}

@Injectable()
export class InsurerIntegrationService {
  private readonly logger = new Logger(InsurerIntegrationService.name);
  private readonly kafkaProducer: Producer;
  private readonly connectors: Map<string, InsurerConnector>;

  constructor() {
    const kafka = new Kafka({
      clientId: 'ait-policy-manager-insurer-integration',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });

    this.kafkaProducer = kafka.producer();
    this.kafkaProducer.connect();

    // Inicializar conectores con aseguradoras
    this.connectors = new Map();
    this.initializeConnectors();
  }

  private initializeConnectors() {
    // Aquí se cargarían los 30 conectores implementados
    const insurers: InsurerConnector[] = [
      {
        id: 'mapfre',
        name: 'MAPFRE',
        apiUrl: process.env.MAPFRE_API_URL || 'https://api.mapfre.com',
        apiKey: process.env.MAPFRE_API_KEY || '',
        active: true
      },
      {
        id: 'axa',
        name: 'AXA',
        apiUrl: process.env.AXA_API_URL || 'https://api.axa.com',
        apiKey: process.env.AXA_API_KEY || '',
        active: true
      },
      {
        id: 'allianz',
        name: 'Allianz',
        apiUrl: process.env.ALLIANZ_API_URL || 'https://api.allianz.com',
        apiKey: process.env.ALLIANZ_API_KEY || '',
        active: true
      },
      {
        id: 'zurich',
        name: 'Zurich',
        apiUrl: process.env.ZURICH_API_URL || 'https://api.zurich.com',
        apiKey: process.env.ZURICH_API_KEY || '',
        active: true
      },
      {
        id: 'generali',
        name: 'Generali',
        apiUrl: process.env.GENERALI_API_URL || 'https://api.generali.com',
        apiKey: process.env.GENERALI_API_KEY || '',
        active: true
      },
      // ... Agregar los 25 conectores restantes
    ];

    insurers.forEach(insurer => {
      this.connectors.set(insurer.id, insurer);
    });

    this.logger.log(`Initialized ${this.connectors.size} insurer connectors`);
  }

  /**
   * Obtener cotización de una aseguradora específica
   */
  async getQuoteFromInsurer(insurerId: string, quoteData: PolicyQuoteDto): Promise<QuoteResultDto> {
    const connector = this.connectors.get(insurerId);
    if (!connector) {
      throw new Error(`Insurer ${insurerId} not found`);
    }

    if (!connector.active) {
      throw new Error(`Insurer ${insurerId} is not active`);
    }

    this.logger.log(`Requesting quote from ${connector.name}`);

    try {
      // Aquí iría la integración real con la API de la aseguradora
      const quote = await this.callInsurerAPI(connector, quoteData);

      // Publicar evento de cotización
      await this.publishEvent('insurer.quote.received', {
        insurerId,
        insurerName: connector.name,
        quoteId: quote.quoteId,
        totalPremium: quote.totalPremium,
        timestamp: new Date().toISOString()
      });

      return quote;
    } catch (error) {
      this.logger.error(`Error getting quote from ${connector.name}: ${error.message}`);

      await this.publishEvent('insurer.quote.failed', {
        insurerId,
        insurerName: connector.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Obtener cotizaciones de múltiples aseguradoras en paralelo
   */
  async getMultipleQuotes(insurerIds: string[], quoteData: PolicyQuoteDto): Promise<InsurerQuoteResponse[]> {
    this.logger.log(`Requesting quotes from ${insurerIds.length} insurers`);

    const startTime = Date.now();

    const quotePromises = insurerIds.map(async insurerId => {
      const requestStart = Date.now();
      try {
        const quote = await this.getQuoteFromInsurer(insurerId, quoteData);
        const responseTime = Date.now() - requestStart;

        return {
          insurerId,
          insurerName: this.connectors.get(insurerId)?.name || insurerId,
          quote,
          responseTime,
          available: true
        };
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        this.logger.warn(`Insurer ${insurerId} failed to respond: ${error.message}`);

        return {
          insurerId,
          insurerName: this.connectors.get(insurerId)?.name || insurerId,
          quote: null as any,
          responseTime,
          available: false
        };
      }
    });

    const results = await Promise.all(quotePromises);
    const totalTime = Date.now() - startTime;

    this.logger.log(`Received ${results.filter(r => r.available).length}/${insurerIds.length} quotes in ${totalTime}ms`);

    return results;
  }

  /**
   * Obtener las mejores cotizaciones (comparador)
   */
  async getBestQuotes(quoteData: PolicyQuoteDto, maxResults: number = 5): Promise<InsurerQuoteResponse[]> {
    // Obtener todos los conectores activos
    const activeInsurers = Array.from(this.connectors.values())
      .filter(c => c.active)
      .map(c => c.id);

    // Obtener cotizaciones de todos
    const allQuotes = await this.getMultipleQuotes(activeInsurers, quoteData);

    // Filtrar solo las disponibles y ordenar por precio
    const sortedQuotes = allQuotes
      .filter(q => q.available && q.quote)
      .sort((a, b) => a.quote.totalPremium - b.quote.totalPremium);

    // Retornar las mejores N cotizaciones
    return sortedQuotes.slice(0, maxResults);
  }

  /**
   * Emitir póliza con aseguradora
   */
  async issuePolicyWithInsurer(insurerId: string, policyData: CreatePolicyDto): Promise<any> {
    const connector = this.connectors.get(insurerId);
    if (!connector) {
      throw new Error(`Insurer ${insurerId} not found`);
    }

    this.logger.log(`Issuing policy with ${connector.name}`);

    try {
      // Llamada a API de emisión
      const result = await this.callInsurerIssuanceAPI(connector, policyData);

      await this.publishEvent('insurer.policy.issued', {
        insurerId,
        insurerName: connector.name,
        policyNumber: result.policyNumber,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      this.logger.error(`Error issuing policy with ${connector.name}: ${error.message}`);

      await this.publishEvent('insurer.policy.issuance.failed', {
        insurerId,
        insurerName: connector.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Notificar endoso a aseguradora
   */
  async notifyEndorsement(insurerId: string, policyId: string, endorsementData: any): Promise<any> {
    const connector = this.connectors.get(insurerId);
    if (!connector) {
      throw new Error(`Insurer ${insurerId} not found`);
    }

    this.logger.log(`Notifying endorsement to ${connector.name}`);

    try {
      const result = await this.callInsurerEndorsementAPI(connector, policyId, endorsementData);

      await this.publishEvent('insurer.endorsement.notified', {
        insurerId,
        policyId,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      this.logger.error(`Error notifying endorsement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificar cancelación a aseguradora
   */
  async notifyCancellation(insurerId: string, policyId: string, cancellationData: any): Promise<any> {
    const connector = this.connectors.get(insurerId);
    if (!connector) {
      throw new Error(`Insurer ${insurerId} not found`);
    }

    this.logger.log(`Notifying cancellation to ${connector.name}`);

    try {
      const result = await this.callInsurerCancellationAPI(connector, policyId, cancellationData);

      await this.publishEvent('insurer.cancellation.notified', {
        insurerId,
        policyId,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      this.logger.error(`Error notifying cancellation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sincronizar estado de póliza con aseguradora
   */
  async syncPolicyStatus(insurerId: string, policyId: string): Promise<any> {
    const connector = this.connectors.get(insurerId);
    if (!connector) {
      throw new Error(`Insurer ${insurerId} not found`);
    }

    this.logger.log(`Syncing policy status with ${connector.name}`);

    try {
      return await this.callInsurerStatusAPI(connector, policyId);
    } catch (error) {
      this.logger.error(`Error syncing policy status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener lista de aseguradoras activas
   */
  getActiveInsurers(): InsurerConnector[] {
    return Array.from(this.connectors.values()).filter(c => c.active);
  }

  /**
   * Verificar disponibilidad de aseguradora
   */
  async checkInsurerAvailability(insurerId: string): Promise<boolean> {
    const connector = this.connectors.get(insurerId);
    if (!connector || !connector.active) {
      return false;
    }

    try {
      // Ping a la API de la aseguradora
      await this.pingInsurerAPI(connector);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== MÉTODOS PRIVADOS DE INTEGRACIÓN ====================

  private async callInsurerAPI(connector: InsurerConnector, quoteData: PolicyQuoteDto): Promise<QuoteResultDto> {
    // Simulación de llamada a API externa
    // En producción, aquí iría la integración real con axios/fetch

    this.logger.debug(`Calling ${connector.name} API for quote`);

    // Simular delay de red
    await this.delay(Math.random() * 1000 + 500);

    // Calcular prima basada en datos
    const basePremium = quoteData.coverages.reduce((sum, cov) => sum + (cov.premium || 0), 0);
    const adjustedPremium = basePremium * (0.9 + Math.random() * 0.2); // ±10% variación

    return {
      quoteId: `${connector.id}-${Date.now()}`,
      totalPremium: parseFloat(adjustedPremium.toFixed(2)),
      basePremium,
      coverageBreakdown: quoteData.coverages.map(cov => ({
        coverageCode: cov.code,
        name: cov.name,
        premium: cov.premium || 0,
        sumInsured: cov.sumInsured
      })),
      discounts: [],
      totalDiscounts: 0,
      surcharges: [],
      validityDays: 30,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: `Quote from ${connector.name}`
    };
  }

  private async callInsurerIssuanceAPI(connector: InsurerConnector, policyData: CreatePolicyDto): Promise<any> {
    this.logger.debug(`Calling ${connector.name} API for policy issuance`);

    await this.delay(1000);

    return {
      success: true,
      policyNumber: `${connector.id.toUpperCase()}-${Date.now()}`,
      insurerReference: `REF-${Math.random().toString(36).substr(2, 9)}`,
      issuedAt: new Date()
    };
  }

  private async callInsurerEndorsementAPI(connector: InsurerConnector, policyId: string, data: any): Promise<any> {
    this.logger.debug(`Calling ${connector.name} API for endorsement`);

    await this.delay(500);

    return {
      success: true,
      endorsementReference: `END-${Math.random().toString(36).substr(2, 9)}`,
      confirmedAt: new Date()
    };
  }

  private async callInsurerCancellationAPI(connector: InsurerConnector, policyId: string, data: any): Promise<any> {
    this.logger.debug(`Calling ${connector.name} API for cancellation`);

    await this.delay(500);

    return {
      success: true,
      cancellationReference: `CAN-${Math.random().toString(36).substr(2, 9)}`,
      refundAmount: data.refundAmount || 0,
      confirmedAt: new Date()
    };
  }

  private async callInsurerStatusAPI(connector: InsurerConnector, policyId: string): Promise<any> {
    this.logger.debug(`Calling ${connector.name} API for status sync`);

    await this.delay(300);

    return {
      status: 'active',
      lastUpdated: new Date(),
      insurerStatus: 'VIGENTE'
    };
  }

  private async pingInsurerAPI(connector: InsurerConnector): Promise<void> {
    this.logger.debug(`Pinging ${connector.name} API`);
    await this.delay(100);
  }

  private async publishEvent(topic: string, payload: any) {
    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{
          key: payload.insurerId || payload.quoteId,
          value: JSON.stringify(payload)
        }]
      });
    } catch (error) {
      this.logger.error(`Error publishing event to Kafka: ${error.message}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    await this.kafkaProducer.disconnect();
  }
}
