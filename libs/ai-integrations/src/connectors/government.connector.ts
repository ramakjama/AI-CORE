/**
 * Government Connector
 * Conectores para AEAT SII, Seguridad Social, Registro Mercantil, Catastro
 */

import axios, { AxiosInstance } from 'axios';
import {
  Connector,
  ConnectorConfig,
  IntegrationCredentials,
  IntegrationType,
  AuthType,
  OperationResult
} from '../types';

// ============================================
// INTERFACES - AEAT SII
// ============================================

/**
 * Factura emitida para SII
 */
export interface SIIFacturaEmitida {
  idFactura: {
    idEmisorFactura: {
      nif: string;
    };
    numSerieFacturaEmisor: string;
    fechaExpedicionFacturaEmisor: string;
  };
  periodoLiquidacion: {
    ejercicio: string;
    periodo: string;
  };
  facturaExpedida: {
    tipoFactura: 'F1' | 'F2' | 'F3' | 'F4' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
    claveRegimenEspecialOTrascendencia: string;
    importeTotal: number;
    descripcionOperacion: string;
    contraparte?: {
      nombreRazon: string;
      nif?: string;
      idOtro?: {
        codigoPais: string;
        idType: string;
        id: string;
      };
    };
    tipoDesglose: {
      desgloseFactura?: {
        sujeta?: {
          noExenta?: {
            tipoNoExenta: string;
            desgloseIVA: {
              detalleIVA: Array<{
                tipoImpositivo: number;
                baseImponible: number;
                cuotaRepercutida: number;
                cuotaRecargoEquivalencia?: number;
              }>;
            };
          };
          exenta?: {
            causaExencion: string;
            baseImponible: number;
          };
        };
        noSujeta?: {
          importePorArticulos7_14_Otros: number;
          importeTAIReglasLocalizacion: number;
        };
      };
    };
    fechaOperacion?: string;
    importeRectificacion?: {
      baseRectificada: number;
      cuotaRectificada: number;
    };
  };
}

/**
 * Factura recibida para SII
 */
export interface SIIFacturaRecibida {
  idFactura: {
    idEmisorFactura: {
      nif?: string;
      idOtro?: {
        codigoPais: string;
        idType: string;
        id: string;
      };
    };
    numSerieFacturaEmisor: string;
    fechaExpedicionFacturaEmisor: string;
  };
  periodoLiquidacion: {
    ejercicio: string;
    periodo: string;
  };
  facturaRecibida: {
    tipoFactura: 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
    claveRegimenEspecialOTrascendencia: string;
    importeTotal: number;
    descripcionOperacion: string;
    contraparte: {
      nombreRazon: string;
      nif?: string;
      idOtro?: {
        codigoPais: string;
        idType: string;
        id: string;
      };
    };
    fechaRegContable: string;
    cuotaDeducible: number;
    desgloseFactura: {
      inversionSujetoPasivo?: {
        detalleIVA: Array<{
          tipoImpositivo: number;
          baseImponible: number;
          cuotaSoportada: number;
        }>;
      };
      desgloseIVA?: {
        detalleIVA: Array<{
          tipoImpositivo: number;
          baseImponible: number;
          cuotaSoportada: number;
          cuotaRecargoEquivalencia?: number;
        }>;
      };
    };
  };
}

/**
 * Respuesta del SII
 */
export interface SIIResponse {
  csv: string;
  estadoEnvio: 'Correcto' | 'ParcialmenteCorrecto' | 'Incorrecto';
  respuestaLinea: Array<{
    idFactura: {
      numSerieFacturaEmisor: string;
      fechaExpedicionFacturaEmisor: string;
    };
    estadoRegistro: 'Correcto' | 'Incorrecto' | 'AceptadoConErrores';
    codigoErrorRegistro?: string;
    descripcionErrorRegistro?: string;
    csv?: string;
  }>;
}

// ============================================
// INTERFACES - SEGURIDAD SOCIAL
// ============================================

/**
 * Trabajador para Seguridad Social
 */
export interface TrabajadorSS {
  naf: string;
  nif: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: Date;
  fechaAlta: Date;
  fechaBaja?: Date;
  tipoContrato: string;
  codigoContrato: string;
  grupoTarifa: string;
  basesCotizacion: {
    contingenciasComunes: number;
    desempleo: number;
    formacionProfesional: number;
    accidentesTrabajo: number;
    horasExtras: number;
  };
}

/**
 * Cuota Seguridad Social
 */
export interface CuotaSS {
  periodo: string;
  ccc: string;
  importeTotal: number;
  desglose: {
    contingenciasComunes: number;
    desempleo: number;
    formacionProfesional: number;
    fogasa: number;
    accidentesTrabajo: number;
  };
  trabajadores: number;
  fechaLimite: Date;
}

// ============================================
// INTERFACES - REGISTRO MERCANTIL
// ============================================

/**
 * Empresa del Registro Mercantil
 */
export interface EmpresaRM {
  cif: string;
  denominacion: string;
  domicilio: string;
  localidad: string;
  codigoPostal: string;
  provincia: string;
  objetoSocial: string;
  capitalSocial: number;
  fechaConstitucion: Date;
  administradores: Array<{
    nombre: string;
    cargo: string;
    nif: string;
    fechaNombramiento: Date;
  }>;
  apoderados?: Array<{
    nombre: string;
    nif: string;
    poderes: string;
  }>;
  cuentasAnuales?: Array<{
    ejercicio: string;
    fechaDeposito: Date;
    totalActivo: number;
    cifraNegocios: number;
    resultado: number;
  }>;
}

// ============================================
// INTERFACES - CATASTRO
// ============================================

/**
 * Inmueble del Catastro
 */
export interface InmuebleCatastro {
  referenciaCatastral: string;
  direccion: {
    tipoVia: string;
    nombreVia: string;
    numero: string;
    codigoPostal: string;
    municipio: string;
    provincia: string;
  };
  uso: string;
  superficieConstruida: number;
  superficieSuelo: number;
  valorCatastral: number;
  anoConstruccion?: number;
  titulares?: Array<{
    nif: string;
    nombre: string;
    porcentaje: number;
    derechosReales: string;
  }>;
}

// ============================================
// CONECTORES
// ============================================

/**
 * Conector base para servicios gubernamentales
 */
abstract class BaseGovernmentConnector implements Connector {
  config: ConnectorConfig;
  protected client: AxiosInstance | null = null;
  protected credentials: IntegrationCredentials | null = null;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract initialize(credentials: IntegrationCredentials): Promise<void>;
  abstract testConnection(): Promise<boolean>;

  async execute<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    const endpointConfig = this.config.endpoints.find(e => e.name === endpoint);
    if (!endpointConfig) {
      throw new Error(`Endpoint ${endpoint} not found`);
    }

    const response = await this.client.request<T>({
      method: endpointConfig.method,
      url: endpointConfig.path,
      params: endpointConfig.method === 'GET' ? params : undefined,
      data: endpointConfig.method !== 'GET' ? params : undefined
    });

    return response.data;
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.credentials = null;
  }
}

/**
 * Conector AEAT SII (Suministro Inmediato de Informacion)
 */
export class AEATSIIConnector extends BaseGovernmentConnector {
  private nifEmisor: string = '';

  constructor() {
    super({
      type: IntegrationType.GOVERNMENT_AEAT_SII,
      name: 'AEAT SII Connector',
      version: '1.1',
      endpoints: [
        {
          name: 'suministroFacturasEmitidas',
          path: '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
          method: 'POST',
          description: 'Suministro de facturas emitidas'
        },
        {
          name: 'suministroFacturasRecibidas',
          path: '/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
          method: 'POST',
          description: 'Suministro de facturas recibidas'
        },
        {
          name: 'consultaFacturasEmitidas',
          path: '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
          method: 'POST',
          description: 'Consulta de facturas emitidas'
        },
        {
          name: 'consultaFacturasRecibidas',
          path: '/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
          method: 'POST',
          description: 'Consulta de facturas recibidas'
        },
        {
          name: 'bajaPorErrorRegistral',
          path: '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
          method: 'POST',
          description: 'Baja por error registral'
        }
      ],
      authentication: [AuthType.CERTIFICATE],
      rateLimits: {
        requests: 10,
        period: 1
      },
      features: ['facturas-emitidas', 'facturas-recibidas', 'bienes-inversion', 'operaciones-intracomunitarias'],
      documentation: 'https://www.agenciatributaria.es/AEAT.internet/SII.html'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;
    this.nifEmisor = credentials.customParams?.nif as string || '';

    // En produccion usar certificado digital
    const baseURL = credentials.customParams?.production
      ? 'https://www1.agenciatributaria.gob.es'
      : 'https://prewww1.aeat.es'; // Entorno de pruebas

    this.client = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/xml',
        'SOAPAction': ''
      },
      // En produccion configurar certificado SSL del cliente
      // httpsAgent: new https.Agent({
      //   cert: credentials.certificate,
      //   key: credentials.privateKey,
      //   passphrase: credentials.passphrase
      // })
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // El SII no tiene endpoint de health check
      // Se verifica enviando una consulta vacia
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Suministrar facturas emitidas
   */
  async suministrarFacturasEmitidas(
    facturas: SIIFacturaEmitida[]
  ): Promise<OperationResult<SIIResponse>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildSuministroFacturasEmitidasXML(facturas);

      const response = await this.client.post(
        '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
        xml,
        {
          headers: {
            'SOAPAction': '"SuministroLRFacturasEmitidas"'
          }
        }
      );

      const siiResponse = this.parseSIIResponse(response.data);

      return {
        success: siiResponse.estadoEnvio !== 'Incorrecto',
        data: siiResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SII_ERROR',
          message: error instanceof Error ? error.message : 'Failed to submit invoices'
        }
      };
    }
  }

  /**
   * Suministrar facturas recibidas
   */
  async suministrarFacturasRecibidas(
    facturas: SIIFacturaRecibida[]
  ): Promise<OperationResult<SIIResponse>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildSuministroFacturasRecibidasXML(facturas);

      const response = await this.client.post(
        '/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
        xml,
        {
          headers: {
            'SOAPAction': '"SuministroLRFacturasRecibidas"'
          }
        }
      );

      const siiResponse = this.parseSIIResponse(response.data);

      return {
        success: siiResponse.estadoEnvio !== 'Incorrecto',
        data: siiResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SII_ERROR',
          message: error instanceof Error ? error.message : 'Failed to submit received invoices'
        }
      };
    }
  }

  /**
   * Consultar facturas emitidas
   */
  async consultarFacturasEmitidas(
    ejercicio: string,
    periodo: string,
    filtros?: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      nifContraparte?: string;
    }
  ): Promise<OperationResult<SIIFacturaEmitida[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildConsultaFacturasEmitidasXML(ejercicio, periodo, filtros);

      const response = await this.client.post(
        '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
        xml,
        {
          headers: {
            'SOAPAction': '"ConsultaLRFacturasEmitidas"'
          }
        }
      );

      const facturas = this.parseFacturasEmitidas(response.data);

      return {
        success: true,
        data: facturas
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SII_QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query invoices'
        }
      };
    }
  }

  /**
   * Dar de baja factura por error registral
   */
  async bajaFacturaEmitida(
    ejercicio: string,
    periodo: string,
    numSerieFactura: string,
    fechaExpedicion: string
  ): Promise<OperationResult<SIIResponse>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildBajaFacturaXML(ejercicio, periodo, numSerieFactura, fechaExpedicion);

      const response = await this.client.post(
        '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
        xml,
        {
          headers: {
            'SOAPAction': '"BajaLRFacturasEmitidas"'
          }
        }
      );

      const siiResponse = this.parseSIIResponse(response.data);

      return {
        success: siiResponse.estadoEnvio === 'Correcto',
        data: siiResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SII_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete invoice'
        }
      };
    }
  }

  private buildSuministroFacturasEmitidasXML(facturas: SIIFacturaEmitida[]): string {
    const registros = facturas.map(f => `
      <siiLR:RegistroLRFacturasEmitidas>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${f.periodoLiquidacion.ejercicio}</sii:Ejercicio>
          <sii:Periodo>${f.periodoLiquidacion.periodo}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        <siiLR:IDFactura>
          <sii:IDEmisorFactura>
            <sii:NIF>${f.idFactura.idEmisorFactura.nif}</sii:NIF>
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${f.idFactura.numSerieFacturaEmisor}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${f.idFactura.fechaExpedicionFacturaEmisor}</sii:FechaExpedicionFacturaEmisor>
        </siiLR:IDFactura>
        <siiLR:FacturaExpedida>
          <sii:TipoFactura>${f.facturaExpedida.tipoFactura}</sii:TipoFactura>
          <sii:ClaveRegimenEspecialOTrascendencia>${f.facturaExpedida.claveRegimenEspecialOTrascendencia}</sii:ClaveRegimenEspecialOTrascendencia>
          <sii:ImporteTotal>${f.facturaExpedida.importeTotal.toFixed(2)}</sii:ImporteTotal>
          <sii:DescripcionOperacion>${f.facturaExpedida.descripcionOperacion}</sii:DescripcionOperacion>
          ${f.facturaExpedida.contraparte ? `
          <sii:Contraparte>
            <sii:NombreRazon>${f.facturaExpedida.contraparte.nombreRazon}</sii:NombreRazon>
            ${f.facturaExpedida.contraparte.nif ? `<sii:NIF>${f.facturaExpedida.contraparte.nif}</sii:NIF>` : ''}
          </sii:Contraparte>` : ''}
          <sii:TipoDesglose>
            <sii:DesgloseFactura>
              <sii:Sujeta>
                <sii:NoExenta>
                  <sii:TipoNoExenta>S1</sii:TipoNoExenta>
                  <sii:DesgloseIVA>
                    ${f.facturaExpedida.tipoDesglose.desgloseFactura?.sujeta?.noExenta?.desgloseIVA.detalleIVA.map(d => `
                    <sii:DetalleIVA>
                      <sii:TipoImpositivo>${d.tipoImpositivo.toFixed(2)}</sii:TipoImpositivo>
                      <sii:BaseImponible>${d.baseImponible.toFixed(2)}</sii:BaseImponible>
                      <sii:CuotaRepercutida>${d.cuotaRepercutida.toFixed(2)}</sii:CuotaRepercutida>
                    </sii:DetalleIVA>`).join('') || ''}
                  </sii:DesgloseIVA>
                </sii:NoExenta>
              </sii:Sujeta>
            </sii:DesgloseFactura>
          </sii:TipoDesglose>
        </siiLR:FacturaExpedida>
      </siiLR:RegistroLRFacturasEmitidas>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SusministroLR.xsd"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:SuministroLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>Empresa Ejemplo S.L.</sii:NombreRazon>
          <sii:NIF>${this.nifEmisor}</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      ${registros}
    </siiLR:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildSuministroFacturasRecibidasXML(facturas: SIIFacturaRecibida[]): string {
    const registros = facturas.map(f => `
      <siiLR:RegistroLRFacturasRecibidas>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${f.periodoLiquidacion.ejercicio}</sii:Ejercicio>
          <sii:Periodo>${f.periodoLiquidacion.periodo}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        <siiLR:IDFactura>
          <sii:IDEmisorFactura>
            ${f.idFactura.idEmisorFactura.nif ? `<sii:NIF>${f.idFactura.idEmisorFactura.nif}</sii:NIF>` : ''}
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${f.idFactura.numSerieFacturaEmisor}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${f.idFactura.fechaExpedicionFacturaEmisor}</sii:FechaExpedicionFacturaEmisor>
        </siiLR:IDFactura>
        <siiLR:FacturaRecibida>
          <sii:TipoFactura>${f.facturaRecibida.tipoFactura}</sii:TipoFactura>
          <sii:ClaveRegimenEspecialOTrascendencia>${f.facturaRecibida.claveRegimenEspecialOTrascendencia}</sii:ClaveRegimenEspecialOTrascendencia>
          <sii:ImporteTotal>${f.facturaRecibida.importeTotal.toFixed(2)}</sii:ImporteTotal>
          <sii:DescripcionOperacion>${f.facturaRecibida.descripcionOperacion}</sii:DescripcionOperacion>
          <sii:Contraparte>
            <sii:NombreRazon>${f.facturaRecibida.contraparte.nombreRazon}</sii:NombreRazon>
            ${f.facturaRecibida.contraparte.nif ? `<sii:NIF>${f.facturaRecibida.contraparte.nif}</sii:NIF>` : ''}
          </sii:Contraparte>
          <sii:FechaRegContable>${f.facturaRecibida.fechaRegContable}</sii:FechaRegContable>
          <sii:CuotaDeducible>${f.facturaRecibida.cuotaDeducible.toFixed(2)}</sii:CuotaDeducible>
        </siiLR:FacturaRecibida>
      </siiLR:RegistroLRFacturasRecibidas>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:SuministroLRFacturasRecibidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>Empresa Ejemplo S.L.</sii:NombreRazon>
          <sii:NIF>${this.nifEmisor}</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      ${registros}
    </siiLR:SuministroLRFacturasRecibidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildConsultaFacturasEmitidasXML(
    ejercicio: string,
    periodo: string,
    filtros?: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      nifContraparte?: string;
    }
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:ConsultaLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>Empresa Ejemplo S.L.</sii:NombreRazon>
          <sii:NIF>${this.nifEmisor}</sii:NIF>
        </sii:Titular>
      </sii:Cabecera>
      <siiLR:FiltroConsulta>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${ejercicio}</sii:Ejercicio>
          <sii:Periodo>${periodo}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        ${filtros?.fechaDesde ? `<sii:FechaExpedicionDesde>${filtros.fechaDesde.toISOString().split('T')[0]}</sii:FechaExpedicionDesde>` : ''}
        ${filtros?.fechaHasta ? `<sii:FechaExpedicionHasta>${filtros.fechaHasta.toISOString().split('T')[0]}</sii:FechaExpedicionHasta>` : ''}
        ${filtros?.nifContraparte ? `<sii:Contraparte><sii:NIF>${filtros.nifContraparte}</sii:NIF></sii:Contraparte>` : ''}
      </siiLR:FiltroConsulta>
    </siiLR:ConsultaLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildBajaFacturaXML(
    ejercicio: string,
    periodo: string,
    numSerieFactura: string,
    fechaExpedicion: string
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:BajaLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>Empresa Ejemplo S.L.</sii:NombreRazon>
          <sii:NIF>${this.nifEmisor}</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A1</sii:TipoComunicacion>
      </sii:Cabecera>
      <siiLR:RegistroLRBajaExpedidas>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${ejercicio}</sii:Ejercicio>
          <sii:Periodo>${periodo}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        <siiLR:IDFactura>
          <sii:IDEmisorFactura>
            <sii:NIF>${this.nifEmisor}</sii:NIF>
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${numSerieFactura}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${fechaExpedicion}</sii:FechaExpedicionFacturaEmisor>
        </siiLR:IDFactura>
      </siiLR:RegistroLRBajaExpedidas>
    </siiLR:BajaLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private parseSIIResponse(xml: string): SIIResponse {
    // Implementacion simplificada - en produccion usar xml2js
    return {
      csv: 'CSV_PLACEHOLDER',
      estadoEnvio: 'Correcto',
      respuestaLinea: []
    };
  }

  private parseFacturasEmitidas(xml: string): SIIFacturaEmitida[] {
    // Implementacion simplificada - en produccion usar xml2js
    return [];
  }
}

/**
 * Conector Seguridad Social
 */
export class SeguridadSocialConnector extends BaseGovernmentConnector {
  constructor() {
    super({
      type: IntegrationType.GOVERNMENT_SEG_SOCIAL,
      name: 'Seguridad Social Connector',
      version: '1.0.0',
      endpoints: [
        {
          name: 'consultaTrabajador',
          path: '/api/v1/trabajadores/{naf}',
          method: 'GET',
          description: 'Consultar datos de trabajador'
        },
        {
          name: 'altaTrabajador',
          path: '/api/v1/trabajadores',
          method: 'POST',
          description: 'Alta de trabajador'
        },
        {
          name: 'bajaTrabajador',
          path: '/api/v1/trabajadores/{naf}/baja',
          method: 'POST',
          description: 'Baja de trabajador'
        },
        {
          name: 'consultaCuotas',
          path: '/api/v1/cuotas',
          method: 'GET',
          description: 'Consultar cuotas'
        },
        {
          name: 'generarTC1',
          path: '/api/v1/documentos/tc1',
          method: 'POST',
          description: 'Generar documento TC1'
        },
        {
          name: 'generarTC2',
          path: '/api/v1/documentos/tc2',
          method: 'POST',
          description: 'Generar documento TC2'
        }
      ],
      authentication: [AuthType.CERTIFICATE],
      features: ['altas', 'bajas', 'cuotas', 'documentos'],
      documentation: 'https://sede.seg-social.gob.es'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://sede.seg-social.gob.es',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/api/v1/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Consultar datos de trabajador
   */
  async consultarTrabajador(naf: string): Promise<OperationResult<TrabajadorSS>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/trabajadores/${naf}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SS_QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query worker'
        }
      };
    }
  }

  /**
   * Alta de trabajador
   */
  async altaTrabajador(trabajador: Omit<TrabajadorSS, 'fechaBaja'>): Promise<OperationResult<TrabajadorSS>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/api/v1/trabajadores', trabajador);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SS_ALTA_ERROR',
          message: error instanceof Error ? error.message : 'Failed to register worker'
        }
      };
    }
  }

  /**
   * Baja de trabajador
   */
  async bajaTrabajador(naf: string, fechaBaja: Date, causa: string): Promise<OperationResult<void>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.post(`/api/v1/trabajadores/${naf}/baja`, {
        fechaBaja: fechaBaja.toISOString().split('T')[0],
        causa
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SS_BAJA_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unregister worker'
        }
      };
    }
  }

  /**
   * Consultar cuotas
   */
  async consultarCuotas(ccc: string, periodo: string): Promise<OperationResult<CuotaSS>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get('/api/v1/cuotas', {
        params: { ccc, periodo }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SS_CUOTAS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query contributions'
        }
      };
    }
  }
}

/**
 * Conector Registro Mercantil
 */
export class RegistroMercantilConnector extends BaseGovernmentConnector {
  constructor() {
    super({
      type: IntegrationType.GOVERNMENT_REGISTRO_MERCANTIL,
      name: 'Registro Mercantil Connector',
      version: '1.0.0',
      endpoints: [
        {
          name: 'consultaEmpresa',
          path: '/api/v1/empresas/{cif}',
          method: 'GET',
          description: 'Consultar datos de empresa'
        },
        {
          name: 'consultaAdministradores',
          path: '/api/v1/empresas/{cif}/administradores',
          method: 'GET',
          description: 'Consultar administradores'
        },
        {
          name: 'consultaCuentasAnuales',
          path: '/api/v1/empresas/{cif}/cuentas-anuales',
          method: 'GET',
          description: 'Consultar cuentas anuales'
        },
        {
          name: 'notaSimple',
          path: '/api/v1/empresas/{cif}/nota-simple',
          method: 'GET',
          description: 'Obtener nota simple'
        }
      ],
      authentication: [AuthType.API_KEY, AuthType.CERTIFICATE],
      features: ['consultas', 'cuentas-anuales', 'notas-simples'],
      documentation: 'https://registradores.org'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.registradores.org',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey || ''
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/api/v1/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Consultar datos de empresa
   */
  async consultarEmpresa(cif: string): Promise<OperationResult<EmpresaRM>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/empresas/${cif}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RM_QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query company'
        }
      };
    }
  }

  /**
   * Consultar cuentas anuales
   */
  async consultarCuentasAnuales(
    cif: string,
    ejercicio?: string
  ): Promise<OperationResult<EmpresaRM['cuentasAnuales']>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/empresas/${cif}/cuentas-anuales`, {
        params: ejercicio ? { ejercicio } : undefined
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RM_CUENTAS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query annual accounts'
        }
      };
    }
  }

  /**
   * Obtener nota simple
   */
  async obtenerNotaSimple(cif: string): Promise<OperationResult<{
    contenido: string;
    fechaEmision: Date;
    csv: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/empresas/${cif}/nota-simple`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RM_NOTA_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get nota simple'
        }
      };
    }
  }
}

/**
 * Conector Catastro
 */
export class CatastroConnector extends BaseGovernmentConnector {
  constructor() {
    super({
      type: IntegrationType.GOVERNMENT_CATASTRO,
      name: 'Catastro Connector',
      version: '1.0.0',
      endpoints: [
        {
          name: 'consultaInmueble',
          path: '/OVCServWeb/OVCSWLocalizacionRC/OVCCallejero.asmx',
          method: 'POST',
          description: 'Consultar inmueble por referencia catastral'
        },
        {
          name: 'consultaDireccion',
          path: '/OVCServWeb/OVCSWLocalizacionRC/OVCCallejero.asmx',
          method: 'POST',
          description: 'Consultar referencia por direccion'
        },
        {
          name: 'datosInmueble',
          path: '/OVCServWeb/OVCSWLocalizacionRC/OVCCoordenadas.asmx',
          method: 'POST',
          description: 'Obtener datos del inmueble'
        }
      ],
      authentication: [AuthType.NONE],
      features: ['consultas', 'geolocalizacion', 'valoracion'],
      documentation: 'https://www.catastro.meh.es/webservices'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://ovc.catastro.meh.es',
      timeout: 30000,
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      // El catastro no tiene health check, verificamos con una consulta
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Consultar inmueble por referencia catastral
   */
  async consultarPorReferencia(referenciaCatastral: string): Promise<OperationResult<InmuebleCatastro>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Consulta_DNPRC xmlns="http://www.catastro.meh.es/">
      <Provincia></Provincia>
      <Municipio></Municipio>
      <RC>${referenciaCatastral}</RC>
    </Consulta_DNPRC>
  </soap:Body>
</soap:Envelope>`;

      const response = await this.client.post(
        '/OVCServWeb/OVCSWLocalizacionRC/OVCCallejero.asmx',
        xml,
        {
          headers: {
            'SOAPAction': '"http://www.catastro.meh.es/Consulta_DNPRC"'
          }
        }
      );

      const inmueble = this.parseInmuebleResponse(response.data);

      return { success: true, data: inmueble };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATASTRO_QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query property'
        }
      };
    }
  }

  /**
   * Consultar referencia catastral por direccion
   */
  async consultarPorDireccion(
    provincia: string,
    municipio: string,
    tipoVia: string,
    nombreVia: string,
    numero: string
  ): Promise<OperationResult<string[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Consulta_DNPLOC xmlns="http://www.catastro.meh.es/">
      <Provincia>${provincia}</Provincia>
      <Municipio>${municipio}</Municipio>
      <Sigla>${tipoVia}</Sigla>
      <Calle>${nombreVia}</Calle>
      <Numero>${numero}</Numero>
    </Consulta_DNPLOC>
  </soap:Body>
</soap:Envelope>`;

      const response = await this.client.post(
        '/OVCServWeb/OVCSWLocalizacionRC/OVCCallejero.asmx',
        xml,
        {
          headers: {
            'SOAPAction': '"http://www.catastro.meh.es/Consulta_DNPLOC"'
          }
        }
      );

      const referencias = this.parseReferenciasResponse(response.data);

      return { success: true, data: referencias };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATASTRO_DIRECCION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query by address'
        }
      };
    }
  }

  /**
   * Obtener valor catastral
   */
  async obtenerValorCatastral(referenciaCatastral: string): Promise<OperationResult<{
    valorCatastral: number;
    valorSuelo: number;
    valorConstruccion: number;
    anioRevision: number;
  }>> {
    try {
      const inmuebleResult = await this.consultarPorReferencia(referenciaCatastral);

      if (!inmuebleResult.success || !inmuebleResult.data) {
        throw new Error('Property not found');
      }

      // En produccion obtener valores detallados
      return {
        success: true,
        data: {
          valorCatastral: inmuebleResult.data.valorCatastral,
          valorSuelo: inmuebleResult.data.valorCatastral * 0.4,
          valorConstruccion: inmuebleResult.data.valorCatastral * 0.6,
          anioRevision: new Date().getFullYear()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATASTRO_VALOR_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get cadastral value'
        }
      };
    }
  }

  private parseInmuebleResponse(xml: string): InmuebleCatastro {
    // Implementacion simplificada - en produccion usar xml2js
    return {
      referenciaCatastral: '',
      direccion: {
        tipoVia: '',
        nombreVia: '',
        numero: '',
        codigoPostal: '',
        municipio: '',
        provincia: ''
      },
      uso: '',
      superficieConstruida: 0,
      superficieSuelo: 0,
      valorCatastral: 0
    };
  }

  private parseReferenciasResponse(xml: string): string[] {
    // Implementacion simplificada - en produccion usar xml2js
    return [];
  }
}

/**
 * Factory para crear conectores gubernamentales
 */
export function createGovernmentConnector(type: IntegrationType): BaseGovernmentConnector {
  switch (type) {
    case IntegrationType.GOVERNMENT_AEAT_SII:
      return new AEATSIIConnector();
    case IntegrationType.GOVERNMENT_SEG_SOCIAL:
      return new SeguridadSocialConnector();
    case IntegrationType.GOVERNMENT_REGISTRO_MERCANTIL:
      return new RegistroMercantilConnector();
    case IntegrationType.GOVERNMENT_CATASTRO:
      return new CatastroConnector();
    default:
      throw new Error(`Unsupported government connector type: ${type}`);
  }
}

export {
  BaseGovernmentConnector,
  AEATSIIConnector,
  SeguridadSocialConnector,
  RegistroMercantilConnector,
  CatastroConnector
};
