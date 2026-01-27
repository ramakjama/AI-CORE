// AI-CORE Database Utilities

import { type PaginationParams, type PaginatedResult } from '@ai-core/types';

// Pagination helper for Prisma
export interface PrismaPageParams {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export function toPrismaPageParams(params: PaginationParams): PrismaPageParams {
  const { page, limit, sortBy, sortOrder } = params;

  return {
    skip: (page - 1) * limit,
    take: limit,
    ...(sortBy && { orderBy: { [sortBy]: sortOrder ?? 'asc' } }),
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Transaction helper
export async function withTransaction<T>(
  prisma: { $transaction: (fn: (tx: unknown) => Promise<T>) => Promise<T> },
  fn: (tx: unknown) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}

// Soft delete helper
export interface SoftDeletable {
  deletedAt: Date | null;
}

export function softDeleteFilter(): { deletedAt: null } {
  return { deletedAt: null };
}

export function softDeleteData(): { deletedAt: Date } {
  return { deletedAt: new Date() };
}

// Timestamp helpers
export function timestamps() {
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateTimestamp() {
  return {
    updatedAt: new Date(),
  };
}
