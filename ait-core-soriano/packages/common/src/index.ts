/**
 * AI-Suite Common Package
 *
 * Shared types, interfaces, utilities, and constants for the AI-Suite platform.
 *
 * @packageDocumentation
 */

// Interfaces
export * from './interfaces';

// Types
export * from './types';

// Utilities
export * from './utils';

// Constants
export * from './constants';

// Version
export const VERSION = '1.0.0';

// Package info
export const PACKAGE_INFO = {
  name: '@ai-suite/common',
  version: VERSION,
  description: 'Shared types, interfaces, and utilities for AI-Suite',
} as const;
