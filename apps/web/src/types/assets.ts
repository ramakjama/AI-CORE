// Types for Asset Management (Patrimonio)

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  CAMPER = 'CAMPER',
  BOAT = 'BOAT',
  OTHER = 'OTHER'
}

export enum VehicleFuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  PLUGIN_HYBRID = 'PLUGIN_HYBRID',
  GAS = 'GAS',
  HYDROGEN = 'HYDROGEN'
}

export enum VehicleUsage {
  PRIVATE = 'PRIVATE',
  PROFESSIONAL = 'PROFESSIONAL',
  MIXED = 'MIXED'
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  PENTHOUSE = 'PENTHOUSE',
  DUPLEX = 'DUPLEX',
  STUDIO = 'STUDIO',
  COMMERCIAL = 'COMMERCIAL',
  OFFICE = 'OFFICE',
  GARAGE = 'GARAGE',
  STORAGE = 'STORAGE',
  LAND = 'LAND',
  BUILDING = 'BUILDING',
  OTHER = 'OTHER'
}

export enum PropertyUsage {
  PRIMARY_RESIDENCE = 'PRIMARY_RESIDENCE',
  SECONDARY_RESIDENCE = 'SECONDARY_RESIDENCE',
  RENTAL = 'RENTAL',
  INVESTMENT = 'INVESTMENT',
  VACANT = 'VACANT',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum ValuableType {
  JEWELRY = 'JEWELRY',
  ART = 'ART',
  WATCH = 'WATCH',
  ANTIQUE = 'ANTIQUE',
  COLLECTION = 'COLLECTION',
  MUSICAL_INSTRUMENT = 'MUSICAL_INSTRUMENT',
  ELECTRONICS = 'ELECTRONICS',
  OTHER = 'OTHER'
}

export enum InvestmentType {
  STOCKS = 'STOCKS',
  BONDS = 'BONDS',
  MUTUAL_FUNDS = 'MUTUAL_FUNDS',
  ETF = 'ETF',
  DEPOSIT = 'DEPOSIT',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  REAL_ESTATE_FUND = 'REAL_ESTATE_FUND',
  PENSION_PLAN = 'PENSION_PLAN',
  LIFE_INSURANCE_INVESTMENT = 'LIFE_INSURANCE_INVESTMENT',
  OTHER = 'OTHER'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export interface Photo {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
  isPrimary?: boolean;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export interface MaintenanceRecord {
  date: Date;
  type: string;
  description: string;
  cost: number;
  workshop?: string;
  mileage?: number;
}

export interface Vehicle {
  id: string;
  clientId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  fuelType: VehicleFuelType;
  mileage?: number;
  color?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  isFinanced: boolean;
  financingEntity?: string;
  remainingDebt?: number;
  usage: VehicleUsage;
  location?: string;
  photos: Photo[];
  documents: Document[];
  maintenanceHistory: MaintenanceRecord[];
  policyId?: string;
  itvExpiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mortgage {
  bank: string;
  principalAmount: number;
  remainingPrincipal: number;
  monthlyPayment: number;
  interestRate: number;
  startDate: Date;
  endDate: Date;
}

export interface Tenant {
  name: string;
  email?: string;
  phone?: string;
  contractStartDate: Date;
  contractEndDate?: Date;
  monthlyRent: number;
  deposit: number;
}

export interface PropertyCharacteristics {
  hasElevator: boolean;
  hasGarage: boolean;
  hasTerrace: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasStorageRoom: boolean;
  hasAirConditioning: boolean;
  hasHeating: boolean;
  energyCertificate?: string;
  orientation?: string;
}

export interface Property {
  id: string;
  clientId: string;
  type: PropertyType;
  usage: PropertyUsage;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  cadastralReference?: string;
  area: number;
  rooms?: number;
  bathrooms?: number;
  floor?: string;
  latitude?: number;
  longitude?: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  hasMortgage: boolean;
  mortgage?: Mortgage;
  characteristics: PropertyCharacteristics;
  tenant?: Tenant;
  photos: Photo[];
  documents: Document[];
  policyId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appraisal {
  date: Date;
  value: number;
  appraiser?: string;
  certificateUrl?: string;
}

export interface Valuable {
  id: string;
  clientId: string;
  type: ValuableType;
  description: string;
  brand?: string;
  artist?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  lastAppraisal?: Appraisal;
  location?: string;
  photos: Photo[];
  documents: Document[];
  policyId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  clientId: string;
  type: InvestmentType;
  productName: string;
  financialEntity: string;
  investmentDate: Date;
  principalAmount: number;
  currentValue: number;
  returnRate?: number;
  maturityDate?: Date;
  riskLevel: RiskLevel;
  documents: Document[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetSummary {
  totalValue: number;
  vehicles: {
    count: number;
    totalValue: number;
  };
  properties: {
    count: number;
    totalValue: number;
  };
  valuables: {
    count: number;
    totalValue: number;
  };
  investments: {
    count: number;
    totalValue: number;
    totalReturn: number;
  };
  distribution: {
    label: string;
    value: number;
    percentage: number;
  }[];
  evolution: {
    date: Date;
    value: number;
  }[];
}

export interface PatrimonyAnalysis {
  executiveSummary: string;
  strengths: string[];
  coverageGaps: string[];
  insuranceRecommendations: {
    assetType: string;
    assetId: string;
    assetName: string;
    recommendation: string;
    estimatedPremium?: number;
  }[];
  taxOptimizationOpportunities: string[];
  diversificationAnalysis: {
    currentAllocation: { category: string; percentage: number }[];
    recommendedAllocation: { category: string; percentage: number }[];
    suggestions: string[];
  };
  generatedAt: Date;
}

export interface VehicleFormData {
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  fuelType: VehicleFuelType;
  mileage?: number;
  color?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  isFinanced: boolean;
  financingEntity?: string;
  remainingDebt?: number;
  usage: VehicleUsage;
  location?: string;
  policyId?: string;
  itvExpiryDate?: Date;
  notes?: string;
}

export interface PropertyFormData {
  type: PropertyType;
  usage: PropertyUsage;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  cadastralReference?: string;
  area: number;
  rooms?: number;
  bathrooms?: number;
  floor?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  hasMortgage: boolean;
  mortgage?: Mortgage;
  characteristics: PropertyCharacteristics;
  tenant?: Tenant;
  policyId?: string;
  notes?: string;
}

export interface ValuableFormData {
  type: ValuableType;
  description: string;
  brand?: string;
  artist?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  location?: string;
  policyId?: string;
  notes?: string;
}

export interface InvestmentFormData {
  type: InvestmentType;
  productName: string;
  financialEntity: string;
  investmentDate: Date;
  principalAmount: number;
  currentValue: number;
  maturityDate?: Date;
  riskLevel: RiskLevel;
  notes?: string;
}
