/**
 * JournalEntryService
 *
 * Servicio de lógica de negocio para asientos contables
 * Gestiona creación, validación, mayorización y eliminación de asientos
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { PgcEngineIntegrationService } from './pgc-engine-integration.service';
import {
  CreateJournalEntryDto,
  AutoCreateJournalEntryDto,
} from '../dto/create-journal-entry.dto';

interface ListEntriesFilter {
  status?: string;
  fiscalYear?: string;
  period?: string;
  accountCode?: string;
  fromDate?: string;
  toDate?: string;
  limit: number;
  offset: number;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; field?: string }>;
  warnings: Array<{ code: string; message: string }>;
}

@Injectable()
export class JournalEntryService {
  private readonly logger = new Logger(JournalEntryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pgcEngine: PgcEngineIntegrationService,
  ) {}

  // ============================================
  // CREATE JOURNAL ENTRY (Manual)
  // ============================================

  async createEntry(dto: CreateJournalEntryDto) {
    this.logger.log(`Creating journal entry: ${dto.description}`);

    // 1. Validar asiento
    const validation = await this.validateEntry(dto);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Asiento contable inválido',
        errors: validation.errors,
      });
    }

    // 2. Calcular totales
    const totalDebit = dto.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    // 3. Generar número de asiento
    const fiscalYear = new Date(dto.entryDate).getFullYear().toString();
    const entryNumber = await this.generateEntryNumber(fiscalYear);

    // 4. Crear asiento en BD
    try {
      const entry = await this.prisma.accountingEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(dto.entryDate),
          description: dto.description,
          totalDebit,
          totalCredit,
          status: dto.autoPost ? 'POSTED' : 'DRAFT',
          fiscalYear,
          period: String(new Date(dto.entryDate).getMonth() + 1).padStart(2, '0'),
          postDate: dto.autoPost ? new Date() : null,
          postedBy: dto.autoPost ? 'auto' : null,
          createdBy: 'user-temp', // TODO: obtener de contexto
          updatedBy: 'user-temp',
          companyId: 'default',
          tenantId: 'default',
          lines: {
            create: await Promise.all(
              dto.lines.map(async (line) => {
                const account = await this.pgcEngine.getAccount(line.accountCode);
                return {
                  accountCode: line.accountCode,
                  accountName: account?.name || '',
                  debit: line.debit || 0,
                  credit: line.credit || 0,
                  description: line.description || dto.description,
                };
              }),
            ),
          },
        },
        include: {
          lines: true,
        },
      });

      this.logger.log(`Journal entry created: ${entry.id} (${entry.entryNumber})`);

      // 5. Si autoPost = true, mayorizar a AI-PGC-ENGINE
      if (dto.autoPost) {
        await this.postEntryToPgcEngine(entry.id);
      }

      return entry;
    } catch (error) {
      this.logger.error(`Error creating journal entry: ${error.message}`);
      throw new InternalServerErrorException('Error al crear asiento contable');
    }
  }

  // ============================================
  // CREATE JOURNAL ENTRY (AI-Assisted)
  // ============================================

  async autoCreateEntry(dto: AutoCreateJournalEntryDto) {
    this.logger.log(`Creating AI-assisted journal entry: ${dto.description}`);

    // 1. Clasificar transacción con IA
    const classification = await this.pgcEngine.classifyTransaction(
      dto.description,
      dto.amount,
      dto.date,
    );

    // 2. Validar confianza de la IA
    if (classification.confidence < 0.7) {
      throw new BadRequestException({
        message: 'La IA no pudo clasificar esta transacción con suficiente confianza',
        aiClassification: classification,
        suggestion: 'Por favor, cree el asiento manualmente especificando las cuentas',
      });
    }

    // 3. Convertir clasificación IA → DTO manual
    const manualDto: CreateJournalEntryDto = {
      description: dto.description,
      entryDate: dto.date,
      lines: classification.entries.map((entry: any) => ({
        accountCode: entry.accountCode,
        debit: entry.type === 'DEBIT' ? dto.amount : undefined,
        credit: entry.type === 'CREDIT' ? dto.amount : undefined,
        description: entry.reasoning || dto.description,
      })),
      autoPost: dto.autoPost,
    };

    // 4. Crear asiento usando el método manual
    const entry = await this.createEntry(manualDto);

    // 5. Agregar metadata de IA
    return {
      ...entry,
      aiClassification: {
        confidence: classification.confidence,
        suggestedAccounts: classification.entries.map((e: any) => e.accountCode),
        reasoning: classification.reasoning,
      },
    };
  }

  // ============================================
  // GET JOURNAL ENTRY BY ID
  // ============================================

  async getEntry(id: string) {
    const entry = await this.prisma.accountingEntry.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    });

    if (!entry) {
      throw new NotFoundException(`Asiento contable no encontrado: ${id}`);
    }

    return entry;
  }

  // ============================================
  // LIST JOURNAL ENTRIES
  // ============================================

  async listEntries(filters: ListEntriesFilter) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters.period) {
      where.period = filters.period;
    }

    if (filters.fromDate || filters.toDate) {
      where.entryDate = {};
      if (filters.fromDate) {
        where.entryDate.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.entryDate.lte = new Date(filters.toDate);
      }
    }

    if (filters.accountCode) {
      where.lines = {
        some: {
          accountCode: filters.accountCode,
        },
      };
    }

    const [entries, total] = await Promise.all([
      this.prisma.accountingEntry.findMany({
        where,
        include: {
          lines: true,
        },
        orderBy: {
          entryDate: 'desc',
        },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.accountingEntry.count({ where }),
    ]);

    return {
      entries,
      total,
    };
  }

  // ============================================
  // POST JOURNAL ENTRY (Mayorizar)
  // ============================================

  async postEntry(id: string, userId: string) {
    // 1. Obtener asiento
    const entry = await this.getEntry(id);

    // 2. Validar que esté en estado DRAFT
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        `Asiento ya está en estado ${entry.status}, no se puede mayorizar`,
      );
    }

    // 3. Validar balance
    if (entry.totalDebit !== entry.totalCredit) {
      throw new BadRequestException(
        `Asiento descuadrado: débito €${entry.totalDebit} ≠ crédito €${entry.totalCredit}`,
      );
    }

    // 4. Actualizar estado a POSTED
    const updatedEntry = await this.prisma.accountingEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postDate: new Date(),
        postedBy: userId,
        updatedBy: userId,
      },
      include: {
        lines: true,
      },
    });

    // 5. Mayorizar en AI-PGC-ENGINE
    await this.postEntryToPgcEngine(id);

    this.logger.log(`Journal entry posted: ${id} (${entry.entryNumber})`);

    return updatedEntry;
  }

  // ============================================
  // UPDATE JOURNAL ENTRY
  // ============================================

  async updateEntry(id: string, dto: CreateJournalEntryDto) {
    // 1. Obtener asiento
    const entry = await this.getEntry(id);

    // 2. Validar que esté en DRAFT
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        `Asiento en estado ${entry.status} no se puede modificar`,
      );
    }

    // 3. Validar nuevo asiento
    const validation = await this.validateEntry(dto);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Asiento actualizado inválido',
        errors: validation.errors,
      });
    }

    // 4. Calcular totales
    const totalDebit = dto.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    // 5. Actualizar asiento (eliminar líneas antiguas, crear nuevas)
    const updatedEntry = await this.prisma.accountingEntry.update({
      where: { id },
      data: {
        description: dto.description,
        entryDate: new Date(dto.entryDate),
        totalDebit,
        totalCredit,
        updatedBy: 'user-temp',
        lines: {
          deleteMany: {},
          create: await Promise.all(
            dto.lines.map(async (line) => {
              const account = await this.pgcEngine.getAccount(line.accountCode);
              return {
                accountCode: line.accountCode,
                accountName: account?.name || '',
                debit: line.debit || 0,
                credit: line.credit || 0,
                description: line.description || dto.description,
              };
            }),
          ),
        },
      },
      include: {
        lines: true,
      },
    });

    this.logger.log(`Journal entry updated: ${id}`);

    return updatedEntry;
  }

  // ============================================
  // DELETE JOURNAL ENTRY
  // ============================================

  async deleteEntry(id: string) {
    const entry = await this.getEntry(id);

    if (entry.status === 'DRAFT') {
      // DRAFT: eliminar físicamente
      await this.prisma.accountingEntry.delete({
        where: { id },
      });
      this.logger.log(`Journal entry deleted: ${id}`);
    } else {
      // POSTED: cancelar (soft delete)
      await this.prisma.accountingEntry.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy: 'user-temp',
        },
      });
      this.logger.log(`Journal entry cancelled: ${id}`);
    }
  }

  // ============================================
  // VALIDATE JOURNAL ENTRY
  // ============================================

  async validateEntry(dto: CreateJournalEntryDto): Promise<ValidationResult> {
    const errors = [];
    const warnings = [];

    // 1. Validar que haya al menos 2 líneas
    if (dto.lines.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_LINES',
        message: 'Un asiento contable debe tener al menos 2 líneas',
        field: 'lines',
      });
    }

    // 2. Validar balance (débito = crédito)
    const totalDebit = dto.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push({
        code: 'UNBALANCED_ENTRY',
        message: `Asiento descuadrado: débito €${totalDebit.toFixed(2)} ≠ crédito €${totalCredit.toFixed(2)}`,
        field: 'lines',
      });
    }

    // 3. Validar que cada línea tenga debit O credit (no ambos)
    dto.lines.forEach((line, index) => {
      if (line.debit && line.credit) {
        errors.push({
          code: 'DUAL_ENTRY',
          message: `Línea ${index + 1}: No puede tener débito Y crédito simultáneamente`,
          field: `lines[${index}]`,
        });
      }
      if (!line.debit && !line.credit) {
        errors.push({
          code: 'EMPTY_ENTRY',
          message: `Línea ${index + 1}: Debe tener débito O crédito`,
          field: `lines[${index}]`,
        });
      }
    });

    // 4. Validar existencia de cuentas en PGC
    for (const [index, line] of dto.lines.entries()) {
      try {
        const account = await this.pgcEngine.getAccount(line.accountCode);
        if (!account) {
          errors.push({
            code: 'ACCOUNT_NOT_FOUND',
            message: `Línea ${index + 1}: Cuenta ${line.accountCode} no existe en PGC`,
            field: `lines[${index}].accountCode`,
          });
        }
      } catch (error) {
        errors.push({
          code: 'ACCOUNT_VALIDATION_ERROR',
          message: `Línea ${index + 1}: Error al validar cuenta ${line.accountCode}`,
          field: `lines[${index}].accountCode`,
        });
      }
    }

    // 5. Warnings (no bloquean creación)
    if (totalDebit > 100000) {
      warnings.push({
        code: 'HIGH_AMOUNT',
        message: `Asiento de monto elevado: €${totalDebit.toFixed(2)} (>€100K)`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateEntryNumber(fiscalYear: string): Promise<string> {
    const count = await this.prisma.accountingEntry.count({
      where: { fiscalYear },
    });
    const sequential = String(count + 1).padStart(6, '0');
    return `ASI-${fiscalYear}-${sequential}`;
  }

  private async postEntryToPgcEngine(entryId: string) {
    try {
      const entry = await this.getEntry(entryId);

      // Enviar a AI-PGC-ENGINE para mayorización
      await this.pgcEngine.postEntry({
        entryId: entry.id,
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate.toISOString().split('T')[0],
        description: entry.description,
        lines: entry.lines.map((line) => ({
          accountCode: line.accountCode,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
      });

      this.logger.log(`Entry posted to PGC Engine: ${entry.entryNumber}`);
    } catch (error) {
      this.logger.error(`Error posting to PGC Engine: ${error.message}`);
      // No lanzar error, continuar (mayorización local completada)
    }
  }
}
