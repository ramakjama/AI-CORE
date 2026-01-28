/**
 * Common TypeScript types for AI-Suite
 */

// Primitive types
export type ID = string;
export type UUID = string;
export type Email = string;
export type URL = string;
export type ISODateString = string;
export type UnixTimestamp = number;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Deep partial
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// Deep required
export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

// Make specific keys required
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Make specific keys optional
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific keys nullable
export type NullableKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

// Extract keys of specific type
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

// Value type
export type ValueOf<T> = T[keyof T];

// Entries type
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

// Non-empty array
export type NonEmptyArray<T> = [T, ...T[]];

// Tuple with variable length
export type VariableTuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

// Async function type
export type AsyncFunction<T = void> = () => Promise<T>;

// Function with parameters
export type FunctionWithParams<P extends unknown[], R> = (...params: P) => R;

// Event handler type
export type EventHandler<E = Event> = (event: E) => void;

// Callback type
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;

// Predicate function
export type Predicate<T> = (value: T) => boolean;

// Comparator function
export type Comparator<T> = (a: T, b: T) => number;

// Mapper function
export type Mapper<T, U> = (value: T) => U;

// Reducer function
export type Reducer<T, U> = (accumulator: U, value: T) => U;

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
}

// Sort direction
export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

// Filter config
export interface FilterConfig<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// Range type
export interface Range<T> {
  min: T;
  max: T;
}

// Coordinates
export interface Coordinates {
  x: number;
  y: number;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// Size
export interface Size {
  width: number;
  height: number;
}

// Rect
export interface Rect extends Coordinates, Size {}

// Color
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export type HexColor = `#${string}`;

// Money
export interface Money {
  amount: number;
  currency: string;
}

// Address
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Phone number
export interface PhoneNumber {
  countryCode: string;
  number: string;
  type?: 'mobile' | 'home' | 'work' | 'other';
}

// Key-value pair
export interface KeyValue<K = string, V = unknown> {
  key: K;
  value: V;
}

// Named value
export interface NamedValue<T = unknown> {
  name: string;
  value: T;
}

// Option for select/dropdown
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

// Tree node
export interface TreeNode<T = unknown> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
  parent?: string;
}

// Linked list node
export interface LinkedNode<T = unknown> {
  data: T;
  next?: LinkedNode<T>;
  prev?: LinkedNode<T>;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Action/Event types
export interface Action<T = string, P = unknown> {
  type: T;
  payload?: P;
  meta?: Record<string, unknown>;
}

// Branded types for type safety
declare const brand: unique symbol;
export type Brand<T, B> = T & { [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type DocumentId = Brand<string, 'DocumentId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;

// Utility for creating branded types
export function createBrand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}
