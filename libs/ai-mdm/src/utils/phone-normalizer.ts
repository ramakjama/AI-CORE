/**
 * AI-MDM Phone Normalizer - Normalizacion y validacion de telefonos
 *
 * Usa libphonenumber-js para validacion internacional con enfoque en Espana
 */

import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  CountryCode,
  PhoneNumber,
  ParseError,
} from 'libphonenumber-js';

// =============================================================================
// TYPES
// =============================================================================

export interface PhoneValidationResult {
  isValid: boolean;
  originalValue: string;
  normalizedValue: string;          // E.164 format: +34612345678
  nationalFormat: string;           // 612 345 678
  internationalFormat: string;      // +34 612 345 678
  countryCode: string;              // ES
  countryCallingCode: string;       // 34
  nationalNumber: string;           // 612345678
  type: PhoneType;
  errors: string[];
}

export type PhoneType =
  | 'MOBILE'
  | 'FIXED_LINE'
  | 'FIXED_LINE_OR_MOBILE'
  | 'TOLL_FREE'
  | 'PREMIUM_RATE'
  | 'SHARED_COST'
  | 'VOIP'
  | 'PERSONAL_NUMBER'
  | 'PAGER'
  | 'UAN'
  | 'VOICEMAIL'
  | 'UNKNOWN';

// =============================================================================
// SPANISH PHONE PATTERNS
// =============================================================================

/** Prefijos de movil en Espana */
const SPANISH_MOBILE_PREFIXES = ['6', '7'];

/** Prefijos de fijo en Espana por provincia/zona */
const SPANISH_LANDLINE_PREFIXES: Record<string, string> = {
  '91': 'Madrid',
  '93': 'Barcelona',
  '94': 'Bizkaia',
  '95': 'Sevilla/Malaga/Cadiz',
  '96': 'Valencia/Alicante/Castellon',
  '97': 'Lleida/Girona/Tarragona',
  '98': 'Asturias/Cantabria/Navarra',
  '81': 'A Coruna',
  '82': 'Lugo/Ourense',
  '83': 'Pontevedra',
  '84': 'Araba/Gipuzkoa',
  '85': 'Huelva/Cordoba/Jaen/Granada/Almeria',
  '86': 'Murcia',
  '87': 'Huesca/Zaragoza/Teruel',
  '88': 'Leon/Palencia/Burgos/Soria/La Rioja',
  '92': 'Albacete/Ciudad Real/Toledo/Cuenca/Guadalajara',
  '80': 'Otros (numeros especiales)',
};

/** Numeros especiales espanoles */
const SPANISH_SPECIAL_NUMBERS: Record<string, string> = {
  '900': 'Numero gratuito',
  '901': 'Numero de coste compartido bajo',
  '902': 'Numero de coste compartido',
  '905': 'Numero de tarificacion adicional (televoto)',
  '803': 'Numero de tarificacion adicional para adultos',
  '806': 'Numero de tarificacion adicional para juegos',
  '807': 'Numero de tarificacion adicional profesional',
  '112': 'Emergencias',
  '016': 'Violencia de genero',
  '091': 'Policia Nacional',
  '092': 'Policia Local',
  '062': 'Guardia Civil',
  '061': 'Urgencias sanitarias',
  '080': 'Bomberos',
  '024': 'Atencion conducta suicida',
};

// =============================================================================
// NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Limpia un numero de telefono de caracteres no deseados
 */
export function cleanPhoneNumber(value: string): string {
  // Eliminar todo excepto digitos y el signo +
  return value.replace(/[^\d+]/g, '');
}

/**
 * Normaliza un numero de telefono espanol
 * Acepta formatos: 612345678, 34612345678, +34612345678, 0034612345678
 */
export function normalizeSpanishPhone(value: string): string {
  let cleaned = cleanPhoneNumber(value);

  // Si empieza con 00, reemplazar por +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // Si empieza con + ya esta bien
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Si empieza con 34 y tiene 11 digitos, agregar +
  if (cleaned.startsWith('34') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  // Si tiene 9 digitos (formato nacional espanol), agregar +34
  if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    return '+34' + cleaned;
  }

  return cleaned;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Valida un numero de telefono con libphonenumber-js
 */
export function validatePhone(
  value: string,
  defaultCountry: CountryCode = 'ES'
): PhoneValidationResult {
  const result: PhoneValidationResult = {
    isValid: false,
    originalValue: value,
    normalizedValue: '',
    nationalFormat: '',
    internationalFormat: '',
    countryCode: '',
    countryCallingCode: '',
    nationalNumber: '',
    type: 'UNKNOWN',
    errors: [],
  };

  const cleaned = cleanPhoneNumber(value);

  if (!cleaned) {
    result.errors.push('Numero de telefono vacio');
    return result;
  }

  try {
    // Intentar normalizar como espanol primero
    const normalized = normalizeSpanishPhone(cleaned);

    // Parsear con libphonenumber
    const phoneNumber = parsePhoneNumber(normalized, defaultCountry);

    if (!phoneNumber) {
      result.errors.push('No se pudo parsear el numero de telefono');
      return result;
    }

    if (!phoneNumber.isValid()) {
      result.errors.push('Numero de telefono invalido');
      result.normalizedValue = normalized;
      return result;
    }

    // Extraer informacion
    result.isValid = true;
    result.normalizedValue = phoneNumber.format('E.164');
    result.nationalFormat = phoneNumber.formatNational();
    result.internationalFormat = phoneNumber.formatInternational();
    result.countryCode = phoneNumber.country || defaultCountry;
    result.countryCallingCode = phoneNumber.countryCallingCode;
    result.nationalNumber = phoneNumber.nationalNumber;
    result.type = mapPhoneType(phoneNumber.getType());

  } catch (error: unknown) {
    if (error instanceof ParseError) {
      result.errors.push(`Error de parseo: ${error.message}`);
    } else if (error instanceof Error) {
      result.errors.push(`Error al validar telefono: ${error.message}`);
    } else {
      result.errors.push('Error desconocido al validar telefono');
    }
    result.normalizedValue = cleaned;
  }

  return result;
}

/**
 * Valida especificamente un telefono espanol
 */
export function validateSpanishPhone(value: string): PhoneValidationResult {
  const result = validatePhone(value, 'ES');

  // Validaciones adicionales para Espana
  if (result.isValid && result.countryCode !== 'ES') {
    // No es un numero espanol
    result.errors.push('El numero no corresponde a Espana');
    // Pero lo consideramos valido si es un numero internacional valido
  }

  // Detectar tipo de numero espanol
  if (result.isValid && result.countryCode === 'ES') {
    const national = result.nationalNumber;

    // Detectar si es numero especial
    for (const [prefix, description] of Object.entries(SPANISH_SPECIAL_NUMBERS)) {
      if (national.startsWith(prefix)) {
        result.type = 'PREMIUM_RATE';
        break;
      }
    }

    // Detectar movil vs fijo
    if (SPANISH_MOBILE_PREFIXES.includes(national.charAt(0))) {
      result.type = 'MOBILE';
    } else if (national.startsWith('8') || national.startsWith('9')) {
      result.type = 'FIXED_LINE';
    }
  }

  return result;
}

/**
 * Mapea el tipo de telefono de libphonenumber a nuestro enum
 */
function mapPhoneType(type: string | undefined): PhoneType {
  if (!type) return 'UNKNOWN';

  const typeMap: Record<string, PhoneType> = {
    'MOBILE': 'MOBILE',
    'FIXED_LINE': 'FIXED_LINE',
    'FIXED_LINE_OR_MOBILE': 'FIXED_LINE_OR_MOBILE',
    'TOLL_FREE': 'TOLL_FREE',
    'PREMIUM_RATE': 'PREMIUM_RATE',
    'SHARED_COST': 'SHARED_COST',
    'VOIP': 'VOIP',
    'PERSONAL_NUMBER': 'PERSONAL_NUMBER',
    'PAGER': 'PAGER',
    'UAN': 'UAN',
    'VOICEMAIL': 'VOICEMAIL',
  };

  return typeMap[type] || 'UNKNOWN';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Compara dos numeros de telefono (normalizados)
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const norm1 = normalizeSpanishPhone(phone1);
  const norm2 = normalizeSpanishPhone(phone2);

  // Comparar en formato E.164
  try {
    const p1 = parsePhoneNumber(norm1, 'ES');
    const p2 = parsePhoneNumber(norm2, 'ES');

    if (p1 && p2) {
      return p1.format('E.164') === p2.format('E.164');
    }
  } catch {
    // Si falla el parseo, comparar strings normalizados
  }

  return cleanPhoneNumber(norm1) === cleanPhoneNumber(norm2);
}

/**
 * Determina si un telefono es movil
 */
export function isMobilePhone(value: string): boolean {
  const result = validateSpanishPhone(value);
  return result.isValid && (result.type === 'MOBILE' || result.type === 'FIXED_LINE_OR_MOBILE');
}

/**
 * Determina si un telefono es fijo
 */
export function isLandlinePhone(value: string): boolean {
  const result = validateSpanishPhone(value);
  return result.isValid && result.type === 'FIXED_LINE';
}

/**
 * Obtiene la provincia/zona de un fijo espanol
 */
export function getSpanishPhoneZone(value: string): string | undefined {
  const result = validateSpanishPhone(value);

  if (!result.isValid || result.countryCode !== 'ES') {
    return undefined;
  }

  const prefix = result.nationalNumber.substring(0, 2);
  return SPANISH_LANDLINE_PREFIXES[prefix];
}

/**
 * Formatea un telefono para mostrar
 */
export function formatPhoneForDisplay(value: string): string {
  const result = validatePhone(value, 'ES');

  if (result.isValid) {
    // Para telefonos espanoles, usar formato nacional
    if (result.countryCode === 'ES') {
      return result.nationalFormat;
    }
    // Para internacionales, usar formato internacional
    return result.internationalFormat;
  }

  // Si no es valido, devolver limpiado
  return cleanPhoneNumber(value);
}

/**
 * Genera un telefono movil espanol aleatorio (para testing)
 */
export function generateRandomSpanishMobile(): string {
  const prefix = SPANISH_MOBILE_PREFIXES[Math.floor(Math.random() * SPANISH_MOBILE_PREFIXES.length)]!;
  const rest = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+34${prefix}${rest}`;
}

/**
 * Genera un telefono fijo espanol aleatorio (para testing)
 */
export function generateRandomSpanishLandline(): string {
  const prefixes = Object.keys(SPANISH_LANDLINE_PREFIXES);
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]!;
  const rest = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+34${prefix}${rest}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const phoneNormalizer = {
  cleanPhoneNumber,
  normalizeSpanishPhone,
  validatePhone,
  validateSpanishPhone,
  phonesMatch,
  isMobilePhone,
  isLandlinePhone,
  getSpanishPhoneZone,
  formatPhoneForDisplay,
  generateRandomSpanishMobile,
  generateRandomSpanishLandline,
};

export default phoneNormalizer;
