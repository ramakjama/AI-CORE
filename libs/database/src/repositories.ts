// AI-CORE Database Repositories

import { prisma } from './client';

// Base repository interface
export interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
}

// Repository factory helper
export function createRepository<T, CreateInput, UpdateInput>(
  model: keyof typeof prisma
): Repository<T, CreateInput, UpdateInput> {
  const delegate = prisma[model] as {
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
    findMany: () => Promise<T[]>;
    create: (args: { data: CreateInput }) => Promise<T>;
    update: (args: { where: { id: string }; data: UpdateInput }) => Promise<T>;
    delete: (args: { where: { id: string } }) => Promise<T>;
  };

  return {
    async findById(id: string): Promise<T | null> {
      return delegate.findUnique({ where: { id } });
    },

    async findAll(): Promise<T[]> {
      return delegate.findMany();
    },

    async create(data: CreateInput): Promise<T> {
      return delegate.create({ data });
    },

    async update(id: string, data: UpdateInput): Promise<T> {
      return delegate.update({ where: { id }, data });
    },

    async delete(id: string): Promise<void> {
      await delegate.delete({ where: { id } });
    },
  };
}
