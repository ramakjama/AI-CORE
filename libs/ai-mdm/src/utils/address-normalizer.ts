/**
 * AI-MDM Address Normalizer - Normalizacion y validacion de direcciones
 *
 * Enfocado en direcciones espanolas con soporte para:
 * - Normalizacion de tipos de via
 * - Extraccion de componentes estructurados
 * - Generacion de hash para deduplicacion
 * - Validacion de codigos postales
 */

import { SPANISH_PROVINCES, SPANISH_REGIONS, STREET_TYPES } from '../types/contact';
import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface AddressComponents {
  streetType?: string;
  streetName?: string;
  streetNumber?: string;
  floor?: string;
  door?: string;
  building?: string;
  staircase?: string;
  block?: string;
  urbanization?: string;
  postalCode?: string;
  city?: string;
  municipality?: string;
  province?: string;
  region?: string;
  countryIso: string;
}

export interface NormalizedAddress {
  original: string;
  normalized: string;
  components: AddressComponents;
  line1: string;
  line2?: string;
  fullAddress: string;
  hash: string;
  confidence: number;
  warnings: string[];
}

export interface PostalCodeInfo {
  isValid: boolean;
  postalCode: string;
  provinceCode: string;
  provinceName: string;
  region: string;
  errors: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Abreviaturas comunes de tipos de via */
const STREET_TYPE_ABBREVIATIONS: Record<string, string> = {
  'c/': 'CALLE',
  'c.': 'CALLE',
  'cl': 'CALLE',
  'cl.': 'CALLE',
  'cll': 'CALLE',
  'calle': 'CALLE',
  'av': 'AVENIDA',
  'av.': 'AVENIDA',
  'avd': 'AVENIDA',
  'avd.': 'AVENIDA',
  'avda': 'AVENIDA',
  'avda.': 'AVENIDA',
  'avenida': 'AVENIDA',
  'pl': 'PLAZA',
  'pl.': 'PLAZA',
  'pza': 'PLAZA',
  'pza.': 'PLAZA',
  'plaza': 'PLAZA',
  'ps': 'PASEO',
  'ps.': 'PASEO',
  'pso': 'PASEO',
  'pso.': 'PASEO',
  'paseo': 'PASEO',
  'ctra': 'CARRETERA',
  'ctra.': 'CARRETERA',
  'crta': 'CARRETERA',
  'carretera': 'CARRETERA',
  'cam': 'CAMINO',
  'cam.': 'CAMINO',
  'camino': 'CAMINO',
  'rda': 'RONDA',
  'rda.': 'RONDA',
  'ronda': 'RONDA',
  'trv': 'TRAVESIA',
  'trv.': 'TRAVESIA',
  'travesia': 'TRAVESIA',
  'urb': 'URBANIZACION',
  'urb.': 'URBANIZACION',
  'urbanizacion': 'URBANIZACION',
  'pol': 'POLIGONO',
  'pol.': 'POLIGONO',
  'poligono': 'POLIGONO',
  'pq': 'PARQUE',
  'pq.': 'PARQUE',
  'parque': 'PARQUE',
  'glta': 'GLORIETA',
  'glta.': 'GLORIETA',
  'glorieta': 'GLORIETA',
  // Catalan
  'carrer': 'CARRER',
  'placa': 'PLACA',
  'pg': 'PASSEIG',
  'pg.': 'PASSEIG',
  'passeig': 'PASSEIG',
  'avgda': 'AVINGUDA',
  'avinguda': 'AVINGUDA',
  // Galician
  'rua': 'RUA',
  'praza': 'PRAZA',
  // Basque
  'kalea': 'KALEA',
  'etorbidea': 'ETORBIDEA',
};

/** Abreviaturas de piso/planta */
const FLOOR_PATTERNS = [
  /(\d+)[ºª°]?\s*(piso|pl\.?|planta)/i,
  /(piso|pl\.?|planta)\s*(\d+)/i,
  /(\d+)[ºª°]/,
  /(bajo|bj\.?|entresuelo|ent\.?|principal|pral\.?|primero|1[ºª°]|segundo|2[ºª°]|tercero|3[ºª°])/i,
];

/** Abreviaturas de puerta */
const DOOR_PATTERNS = [
  /puerta\s*([a-z0-9]+)/i,
  /pta\.?\s*([a-z0-9]+)/i,
  /\s([a-z])$/i,
  /(\d+)[ºª°]?\s*([a-z])$/i,
];

/** Palabras a eliminar/normalizar */
const NOISE_WORDS = [
  'de la', 'del', 'de los', 'de las', 'de', 'la', 'el', 'los', 'las',
];

// =============================================================================
// NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Normaliza un string para comparacion
 */
export function normalizeString(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^A-Z0-9\s]/g, ' ')    // Solo alfanumerico
    .replace(/\s+/g, ' ')            // Espacios multiples
    .trim();
}

/**
 * Normaliza un tipo de via
 */
export function normalizeStreetType(value: string): string {
  const lower = value.toLowerCase().trim();

  // Buscar en abreviaturas
  if (STREET_TYPE_ABBREVIATIONS[lower]) {
    return STREET_TYPE_ABBREVIATIONS[lower];
  }

  // Normalizar directamente
  return normalizeString(value);
}

/**
 * Extrae el numero de calle de un string
 */
export function extractStreetNumber(value: string): { number?: string; rest: string } {
  // Patrones comunes: "123", "123-125", "123 bis", "s/n"
  const patterns = [
    /,?\s*n[ºª°]?\s*(\d+(?:\s*-\s*\d+)?(?:\s*bis)?)/i,
    /,?\s*(\d+(?:\s*-\s*\d+)?(?:\s*bis)?)\s*$/,
    /,?\s*(s\/n|sin\s*numero)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return {
        number: match[1]?.toUpperCase().replace(/\s+/g, ''),
        rest: value.replace(match[0], '').trim(),
      };
    }
  }

  return { rest: value };
}

/**
 * Extrae el piso de un string
 */
export function extractFloor(value: string): { floor?: string; rest: string } {
  const floorMap: Record<string, string> = {
    'bajo': 'BAJO',
    'bj': 'BAJO',
    'entresuelo': 'ENT',
    'ent': 'ENT',
    'principal': 'PRAL',
    'pral': 'PRAL',
    'primero': '1',
    'segundo': '2',
    'tercero': '3',
    'cuarto': '4',
    'quinto': '5',
    'sexto': '6',
    'septimo': '7',
    'octavo': '8',
    'noveno': '9',
    'decimo': '10',
  };

  for (const pattern of FLOOR_PATTERNS) {
    const match = value.match(pattern);
    if (match) {
      let floor = match[1] || match[2];
      if (floor) {
        floor = floor.toLowerCase();
        const mappedFloor = floorMap[floor];
        if (mappedFloor) {
          floor = mappedFloor;
        }
        return {
          floor: floor.toUpperCase(),
          rest: value.replace(match[0], '').trim(),
        };
      }
    }
  }

  return { rest: value };
}

/**
 * Extrae la puerta de un string
 */
export function extractDoor(value: string): { door?: string; rest: string } {
  for (const pattern of DOOR_PATTERNS) {
    const match = value.match(pattern);
    if (match) {
      const door = match[1] || match[2];
      if (door && door.length <= 3) {
        return {
          door: door.toUpperCase(),
          rest: value.replace(match[0], '').trim(),
        };
      }
    }
  }

  return { rest: value };
}

// =============================================================================
// POSTAL CODE VALIDATION
// =============================================================================

/**
 * Valida y extrae informacion de un codigo postal espanol
 */
export function validatePostalCode(postalCode: string): PostalCodeInfo {
  const result: PostalCodeInfo = {
    isValid: false,
    postalCode: postalCode,
    provinceCode: '',
    provinceName: '',
    region: '',
    errors: [],
  };

  // Limpiar
  const cleaned = postalCode.replace(/\D/g, '');

  if (cleaned.length !== 5) {
    result.errors.push('El codigo postal debe tener 5 digitos');
    return result;
  }

  // Validar rango
  const numericValue = parseInt(cleaned, 10);
  if (numericValue < 1000 || numericValue > 52999) {
    result.errors.push('Codigo postal fuera de rango valido (01000-52999)');
    return result;
  }

  // Extraer provincia (primeros 2 digitos)
  const provinceCode = cleaned.substring(0, 2);
  result.provinceCode = provinceCode;
  result.postalCode = cleaned;

  // Buscar provincia
  const provinceName = SPANISH_PROVINCES[provinceCode];
  if (!provinceName) {
    result.errors.push(`Codigo de provincia invalido: ${provinceCode}`);
    return result;
  }

  result.provinceName = provinceName;

  // Buscar region (Comunidad Autonoma)
  for (const [region, provinces] of Object.entries(SPANISH_REGIONS)) {
    if (provinces.includes(provinceCode)) {
      result.region = region;
      break;
    }
  }

  result.isValid = true;
  return result;
}

/**
 * Obtiene la provincia de un codigo postal
 */
export function getProvinceFromPostalCode(postalCode: string): string | undefined {
  const info = validatePostalCode(postalCode);
  return info.isValid ? info.provinceName : undefined;
}

/**
 * Obtiene la region de un codigo postal
 */
export function getRegionFromPostalCode(postalCode: string): string | undefined {
  const info = validatePostalCode(postalCode);
  return info.isValid ? info.region : undefined;
}

// =============================================================================
// MAIN NORMALIZER
// =============================================================================

/**
 * Normaliza una direccion completa
 */
export function normalizeAddress(
  address: string | Partial<AddressComponents>,
  options: { extractComponents?: boolean; generateHash?: boolean } = {}
): NormalizedAddress {
  const { extractComponents = true, generateHash = true } = options;

  const result: NormalizedAddress = {
    original: typeof address === 'string' ? address : JSON.stringify(address),
    normalized: '',
    components: { countryIso: 'ES' },
    line1: '',
    fullAddress: '',
    hash: '',
    confidence: 0,
    warnings: [],
  };

  // Si ya viene estructurado
  if (typeof address === 'object') {
    result.components = { ...result.components, ...address };
    result.normalized = buildAddressString(result.components);
    result.line1 = buildLine1(result.components);
    result.fullAddress = buildFullAddress(result.components);
    result.confidence = calculateConfidence(result.components);

    if (generateHash) {
      result.hash = generateAddressHash(result.components);
    }

    return result;
  }

  // Parsear string
  let remaining = address.trim();

  if (extractComponents) {
    // Extraer componentes en orden
    const extracted = extractAddressComponents(remaining);
    result.components = { ...result.components, ...extracted.components };
    result.warnings = extracted.warnings;
    result.confidence = extracted.confidence;
  }

  // Normalizar string
  result.normalized = normalizeString(remaining);
  result.line1 = buildLine1(result.components);
  result.fullAddress = buildFullAddress(result.components);

  if (generateHash) {
    result.hash = generateAddressHash(result.components);
  }

  return result;
}

/**
 * Extrae componentes de una direccion en texto libre
 */
function extractAddressComponents(address: string): {
  components: AddressComponents;
  confidence: number;
  warnings: string[];
} {
  const components: AddressComponents = { countryIso: 'ES' };
  const warnings: string[] = [];
  let confidence = 0;
  let remaining = address;

  // 1. Extraer codigo postal (facil de identificar)
  const cpMatch = remaining.match(/\b(\d{5})\b/);
  if (cpMatch) {
    const cpInfo = validatePostalCode(cpMatch[1]!);
    if (cpInfo.isValid) {
      components.postalCode = cpInfo.postalCode;
      components.province = cpInfo.provinceName;
      components.region = cpInfo.region;
      remaining = remaining.replace(cpMatch[0], '').trim();
      confidence += 20;
    }
  }

  // 2. Extraer tipo de via
  const streetTypeRegex = new RegExp(
    `^(${Object.keys(STREET_TYPE_ABBREVIATIONS).map(k => k.replace('.', '\\.')).join('|')})\\s+`,
    'i'
  );
  const stMatch = remaining.match(streetTypeRegex);
  if (stMatch) {
    components.streetType = normalizeStreetType(stMatch[1]!);
    remaining = remaining.substring(stMatch[0].length).trim();
    confidence += 15;
  }

  // 3. Extraer numero
  const numResult = extractStreetNumber(remaining);
  if (numResult.number) {
    components.streetNumber = numResult.number;
    remaining = numResult.rest;
    confidence += 15;
  }

  // 4. Extraer piso
  const floorResult = extractFloor(remaining);
  if (floorResult.floor) {
    components.floor = floorResult.floor;
    remaining = floorResult.rest;
    confidence += 10;
  }

  // 5. Extraer puerta
  const doorResult = extractDoor(remaining);
  if (doorResult.door) {
    components.door = doorResult.door;
    remaining = doorResult.rest;
    confidence += 10;
  }

  // 6. Lo que queda es el nombre de la calle y/o ciudad
  const parts = remaining.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length >= 2) {
    components.streetName = normalizeString(parts[0]!);
    components.city = normalizeString(parts[parts.length - 1]!);
    if (parts.length >= 3) {
      components.municipality = normalizeString(parts[1]!);
    }
    confidence += 20;
  } else if (parts.length === 1) {
    components.streetName = normalizeString(parts[0]!);
    confidence += 10;
    warnings.push('No se pudo extraer la ciudad');
  }

  return { components, confidence: Math.min(confidence, 100), warnings };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Construye la linea 1 de la direccion
 */
function buildLine1(components: AddressComponents): string {
  const parts: string[] = [];

  if (components.streetType) {
    parts.push(components.streetType);
  }
  if (components.streetName) {
    parts.push(components.streetName);
  }
  if (components.streetNumber) {
    parts.push(components.streetNumber);
  }

  return parts.join(' ');
}

/**
 * Construye el string completo de direccion
 */
function buildAddressString(components: AddressComponents): string {
  return buildFullAddress(components);
}

/**
 * Construye la direccion completa
 */
function buildFullAddress(components: AddressComponents): string {
  const parts: string[] = [];

  // Linea 1
  const line1 = buildLine1(components);
  if (line1) parts.push(line1);

  // Piso y puerta
  const floorDoor: string[] = [];
  if (components.floor) floorDoor.push(`${components.floor}`);
  if (components.door) floorDoor.push(`${components.door}`);
  if (floorDoor.length) parts.push(floorDoor.join(' '));

  // Urbanizacion
  if (components.urbanization) parts.push(components.urbanization);

  // Ciudad y CP
  const cityParts: string[] = [];
  if (components.postalCode) cityParts.push(components.postalCode);
  if (components.city) cityParts.push(components.city);
  if (cityParts.length) parts.push(cityParts.join(' '));

  // Provincia
  if (components.province && components.province !== components.city) {
    parts.push(components.province);
  }

  return parts.join(', ');
}

/**
 * Calcula la confianza de los componentes extraidos
 */
function calculateConfidence(components: AddressComponents): number {
  let score = 0;

  if (components.streetType) score += 15;
  if (components.streetName) score += 20;
  if (components.streetNumber) score += 15;
  if (components.floor) score += 10;
  if (components.door) score += 10;
  if (components.postalCode) score += 15;
  if (components.city) score += 10;
  if (components.province) score += 5;

  return Math.min(score, 100);
}

/**
 * Genera un hash unico para la direccion (para deduplicacion)
 */
export function generateAddressHash(components: AddressComponents): string {
  // Usar solo campos significativos para el hash
  const hashParts = [
    normalizeString(components.streetName || ''),
    components.streetNumber?.toUpperCase() || '',
    components.floor?.toUpperCase() || '',
    components.door?.toUpperCase() || '',
    components.postalCode || '',
  ];

  const normalized = hashParts.filter(p => p).join('|');

  return createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Compara dos direcciones para determinar si son iguales
 */
export function addressesMatch(addr1: string | AddressComponents, addr2: string | AddressComponents): boolean {
  const norm1 = normalizeAddress(addr1);
  const norm2 = normalizeAddress(addr2);

  // Comparar hashes
  if (norm1.hash && norm2.hash) {
    return norm1.hash === norm2.hash;
  }

  // Fallback a comparacion de string normalizado
  return norm1.normalized === norm2.normalized;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const addressNormalizer = {
  normalizeString,
  normalizeStreetType,
  normalizeAddress,
  extractStreetNumber,
  extractFloor,
  extractDoor,
  validatePostalCode,
  getProvinceFromPostalCode,
  getRegionFromPostalCode,
  generateAddressHash,
  addressesMatch,
};

export default addressNormalizer;
