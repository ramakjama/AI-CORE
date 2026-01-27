/**
 * AI-MDM Contact Types - Interfaces para ContactPoint y Address
 */

import { ContactType, AddressType } from './enums';

// =============================================================================
// CONTACT POINT INTERFACE
// =============================================================================

export interface ContactPoint {
  id: string;
  partyId: string;
  type: ContactType;
  value: string;
  valueNorm: string;       // Normalizado
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date | null;
  allowContact: boolean;
  label?: string | null;   // "Personal", "Trabajo", etc.
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ADDRESS INTERFACE
// =============================================================================

export interface Address {
  id: string;
  type: AddressType;

  // Direccion estructurada
  streetType?: string | null;     // "Calle", "Avenida", "Carrer", etc.
  streetName?: string | null;
  streetNumber?: string | null;
  floor?: string | null;
  door?: string | null;
  building?: string | null;
  urbanization?: string | null;

  // Datos completos
  line1: string;                  // Direccion linea 1
  line2?: string | null;          // Direccion linea 2
  city?: string | null;
  municipality?: string | null;
  province?: string | null;
  region?: string | null;         // Comunidad Autonoma
  postalCode?: string | null;
  countryIso?: string | null;     // ISO-3166-1 alpha-2

  // Geocodificacion
  latitude?: number | null;
  longitude?: number | null;

  // Hash normalizado para dedup
  normHash?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface PartyAddress {
  id: string;
  partyId: string;
  addressId: string;
  isPrimary: boolean;
  isCurrent: boolean;
  validFrom?: Date | null;
  validTo?: Date | null;
  createdAt: Date;

  address?: Address;
}

// =============================================================================
// CREATE / UPDATE DTOs
// =============================================================================

export interface CreateContactInput {
  partyId: string;
  type: ContactType;
  value: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  allowContact?: boolean;
  label?: string;
  notes?: string;
}

export interface UpdateContactInput {
  value?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  allowContact?: boolean;
  label?: string;
  notes?: string;
}

export interface CreateAddressInput {
  type?: AddressType;

  // Direccion estructurada
  streetType?: string;
  streetName?: string;
  streetNumber?: string;
  floor?: string;
  door?: string;
  building?: string;
  urbanization?: string;

  // Datos completos
  line1: string;
  line2?: string;
  city?: string;
  municipality?: string;
  province?: string;
  region?: string;
  postalCode?: string;
  countryIso?: string;

  // Geocodificacion
  latitude?: number;
  longitude?: number;
}

export interface CreatePartyAddressInput {
  partyId: string;
  address: CreateAddressInput;
  isPrimary?: boolean;
  isCurrent?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface UpdatePartyAddressInput {
  isPrimary?: boolean;
  isCurrent?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

// =============================================================================
// VERIFICATION TYPES
// =============================================================================

export interface ContactVerificationRequest {
  contactId: string;
  method: 'email_otp' | 'sms_otp' | 'phone_call' | 'manual';
  requestedBy?: string;
}

export interface ContactVerificationResult {
  contactId: string;
  isVerified: boolean;
  verifiedAt?: Date;
  method: string;
  attempts: number;
  error?: string;
}

export interface AddressVerificationRequest {
  addressId: string;
  method: 'postal_verification' | 'geocoding' | 'manual' | 'external_api';
  requestedBy?: string;
}

export interface AddressVerificationResult {
  addressId: string;
  isVerified: boolean;
  verifiedAt?: Date;
  method: string;
  normalizedAddress?: NormalizedAddress;
  geocodeResult?: GeocodeResult;
  error?: string;
}

export interface NormalizedAddress {
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  countryIso: string;
  normHash: string;
  confidence: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  accuracy: 'rooftop' | 'interpolated' | 'geometric_center' | 'approximate';
  formattedAddress: string;
  confidence: number;
}

// =============================================================================
// CONTACT LOOKUP
// =============================================================================

export interface ContactLookupResult {
  found: boolean;
  contacts: Array<{
    contact: ContactPoint;
    party: {
      id: string;
      displayName: string;
      partyType: string;
    };
  }>;
}

export interface AddressLookupResult {
  found: boolean;
  addresses: Array<{
    address: Address;
    parties: Array<{
      partyId: string;
      displayName: string;
      isPrimary: boolean;
      isCurrent: boolean;
    }>;
  }>;
}

// =============================================================================
// SPANISH PROVINCES AND REGIONS
// =============================================================================

export const SPANISH_PROVINCES: Record<string, string> = {
  '01': 'Araba/Alava',
  '02': 'Albacete',
  '03': 'Alicante/Alacant',
  '04': 'Almeria',
  '05': 'Avila',
  '06': 'Badajoz',
  '07': 'Illes Balears',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Caceres',
  '11': 'Cadiz',
  '12': 'Castellon/Castello',
  '13': 'Ciudad Real',
  '14': 'Cordoba',
  '15': 'A Coruna',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Gipuzkoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaen',
  '24': 'Leon',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Malaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia/Valencia',
  '47': 'Valladolid',
  '48': 'Bizkaia',
  '49': 'Zamora',
  '50': 'Zaragoza',
  '51': 'Ceuta',
  '52': 'Melilla',
};

export const SPANISH_REGIONS: Record<string, string[]> = {
  'Andalucia': ['04', '11', '14', '18', '21', '23', '29', '41'],
  'Aragon': ['22', '44', '50'],
  'Asturias': ['33'],
  'Illes Balears': ['07'],
  'Canarias': ['35', '38'],
  'Cantabria': ['39'],
  'Castilla-La Mancha': ['02', '13', '16', '19', '45'],
  'Castilla y Leon': ['05', '09', '24', '34', '37', '40', '42', '47', '49'],
  'Catalunya': ['08', '17', '25', '43'],
  'Comunitat Valenciana': ['03', '12', '46'],
  'Extremadura': ['06', '10'],
  'Galicia': ['15', '27', '32', '36'],
  'Madrid': ['28'],
  'Murcia': ['30'],
  'Navarra': ['31'],
  'Pais Vasco': ['01', '20', '48'],
  'La Rioja': ['26'],
  'Ceuta': ['51'],
  'Melilla': ['52'],
};

export const STREET_TYPES: string[] = [
  'Calle', 'Avenida', 'Plaza', 'Paseo', 'Carretera',
  'Camino', 'Ronda', 'Travesia', 'Urbanizacion',
  'Poligono', 'Parque', 'Glorieta', 'Plazuela',
  'Carrer', 'Placa', 'Avinguda', 'Passeig',  // Catalan
  'Rua', 'Praza',                              // Galician
  'Kalea', 'Etorbidea',                        // Basque
];
