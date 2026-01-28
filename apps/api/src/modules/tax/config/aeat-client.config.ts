import * as https from 'https';

export interface AEATEndpoints {
  production: {
    model303: string;
    model111: string;
    model190: string;
    model347: string;
    siiIssuedInvoices: string;
    siiReceivedInvoices: string;
  };
  sandbox: {
    model303: string;
    model111: string;
    model190: string;
    model347: string;
    siiIssuedInvoices: string;
    siiReceivedInvoices: string;
  };
}

export const AEAT_ENDPOINTS: AEATEndpoints = {
  production: {
    model303: 'https://www1.agenciatributaria.gob.es/wlpl/BUCV-JDIT/SuministroLR',
    model111: 'https://www1.agenciatributaria.gob.es/wlpl/BUCV-JDIT/SuministroRetenciones',
    model190: 'https://www1.agenciatributaria.gob.es/wlpl/BUCV-JDIT/SuministroResumenAnual',
    model347: 'https://www1.agenciatributaria.gob.es/wlpl/BUCV-JDIT/SuministroOperacionesTerceros',
    siiIssuedInvoices: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
    siiReceivedInvoices: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
  },
  sandbox: {
    model303: 'https://prewww1.aeat.es/wlpl/BUCV-JDIT/SuministroLR',
    model111: 'https://prewww1.aeat.es/wlpl/BUCV-JDIT/SuministroRetenciones',
    model190: 'https://prewww1.aeat.es/wlpl/BUCV-JDIT/SuministroResumenAnual',
    model347: 'https://prewww1.aeat.es/wlpl/BUCV-JDIT/SuministroOperacionesTerceros',
    siiIssuedInvoices: 'https://prewww1.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
    siiReceivedInvoices: 'https://prewww1.aeat.es/wlpl/SSII-FACT/ws/fr/SiiFactFRV1SOAP',
  },
};

export interface AEATClientConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  environment: 'production' | 'sandbox';
}

export const DEFAULT_AEAT_CONFIG: AEATClientConfig = {
  timeout: 60000, // 60 segundos
  maxRetries: 3,
  retryDelay: 2000, // 2 segundos
  environment: process.env.AEAT_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
};

/**
 * Crea un agente HTTPS con certificado digital
 */
export function createAEATHttpsAgent(pfxBuffer: Buffer, password: string): https.Agent {
  return new https.Agent({
    pfx: pfxBuffer,
    passphrase: password,
    rejectUnauthorized: true, // Validar certificado del servidor
    minVersion: 'TLSv1.2', // AEAT requiere TLS 1.2+
    maxVersion: 'TLSv1.3',
    keepAlive: false, // No mantener conexiones persistentes
    timeout: DEFAULT_AEAT_CONFIG.timeout,
  });
}

/**
 * Headers comunes para peticiones a AEAT
 */
export const AEAT_SOAP_HEADERS = {
  'Content-Type': 'text/xml; charset=utf-8',
  'SOAPAction': '',
  'User-Agent': 'ERP-AEAT-Integration/1.0',
  'Accept': 'text/xml, application/xml',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'close',
};

/**
 * Códigos de error comunes de AEAT
 */
export const AEAT_ERROR_CODES = {
  // Errores de autenticación
  '0001': 'Certificado digital no válido o expirado',
  '0002': 'El certificado no está autorizado para esta operación',
  '0003': 'El NIF del certificado no coincide con el declarante',

  // Errores de formato
  '1001': 'XML mal formado',
  '1002': 'El XML no cumple con el esquema XSD',
  '1003': 'Falta un elemento obligatorio',
  '1004': 'Valor de elemento fuera de rango',

  // Errores de validación
  '2001': 'NIF/CIF incorrecto',
  '2002': 'El periodo no corresponde con el ejercicio',
  '2003': 'Ya existe una declaración para este periodo',
  '2004': 'Declaración fuera de plazo',
  '2005': 'Los cálculos no cuadran',

  // Errores de sistema
  '9001': 'Error interno del servidor',
  '9002': 'Servicio temporalmente no disponible',
  '9003': 'Timeout en la operación',
};

/**
 * Obtiene el endpoint según el modelo y entorno
 */
export function getAEATEndpoint(modelType: string, environment: 'production' | 'sandbox'): string {
  const endpoints = AEAT_ENDPOINTS[environment];

  switch (modelType) {
    case '303':
      return endpoints.model303;
    case '111':
      return endpoints.model111;
    case '190':
      return endpoints.model190;
    case '347':
      return endpoints.model347;
    case 'SII_ISSUED':
      return endpoints.siiIssuedInvoices;
    case 'SII_RECEIVED':
      return endpoints.siiReceivedInvoices;
    default:
      throw new Error(`Unknown model type: ${modelType}`);
  }
}

/**
 * Parsea respuesta de error de AEAT
 */
export function parseAEATError(errorXml: string): { code: string; message: string } {
  // Parsear XML de error
  // Formato típico:
  // <soapenv:Fault>
  //   <faultcode>CODIGO</faultcode>
  //   <faultstring>MENSAJE</faultstring>
  // </soapenv:Fault>

  const codeMatch = errorXml.match(/<faultcode>([^<]+)<\/faultcode>/);
  const messageMatch = errorXml.match(/<faultstring>([^<]+)<\/faultstring>/);

  const code = codeMatch ? codeMatch[1] : 'UNKNOWN';
  const message = messageMatch ? messageMatch[1] : errorXml;

  return { code, message };
}

/**
 * Reintento con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_AEAT_CONFIG.maxRetries,
  baseDelay: number = DEFAULT_AEAT_CONFIG.retryDelay,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // No reintentar en ciertos errores
      if (error.message.includes('Certificate') || error.message.includes('NIF')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
