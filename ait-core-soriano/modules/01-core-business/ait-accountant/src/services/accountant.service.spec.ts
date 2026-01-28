import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { CreateAccountingEntryDto } from '../dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from '../dto/update-accounting-entry.dto';
import { AccountingEntryFilterDto } from '../dto/accounting-entry-filter.dto';
import { AccountingEntryFactory } from '../../../../../test/mocks/factories/accounting-entry.factory';

describe('AccountantService', () => {
  let service: AccountantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountantService],
    }).compile();

    service = module.get<AccountantService>(AccountantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEntry', () => {
    it('should create a new accounting entry', async () => {
      const createDto: CreateAccountingEntryDto = {
        description: 'Test entry',
        amount: 1000,
        type: 'debit',
        accountCode: '1000',
      };

      const result = await service.createEntry(createDto);

      expect(result).toHaveProperty('id');
      expect(result.description).toBe(createDto.description);
      expect(result.amount).toBe(createDto.amount);
      expect(result.type).toBe(createDto.type);
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should set default status to pending', async () => {
      const createDto: CreateAccountingEntryDto = {
        description: 'Test entry',
        amount: 1000,
        type: 'debit',
        accountCode: '1000',
      };

      const result = await service.createEntry(createDto);

      expect(result.status).toBe('pending');
    });
  });

  describe('getEntries', () => {
    it('should return paginated entries', async () => {
      const filterDto: AccountingEntryFilterDto = {
        page: 1,
        limit: 20,
      };

      const result = await service.getEntries(filterDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should use default pagination values', async () => {
      const filterDto: AccountingEntryFilterDto = {};

      const result = await service.getEntries(filterDto);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getEntryById', () => {
    it('should return an entry by id', async () => {
      const id = 'test-id';

      const result = await service.getEntryById(id);

      expect(result).toHaveProperty('id');
      expect(result.id).toBe(id);
    });
  });

  describe('updateEntry', () => {
    it('should update an entry', async () => {
      const id = 'test-id';
      const updateDto: UpdateAccountingEntryDto = {
        description: 'Updated description',
        amount: 2000,
      };

      const result = await service.updateEntry(id, updateDto);

      expect(result.id).toBe(id);
      expect(result.description).toBe(updateDto.description);
      expect(result.amount).toBe(updateDto.amount);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry', async () => {
      const id = 'test-id';

      const result = await service.deleteEntry(id);

      expect(result.success).toBe(true);
      expect(result.id).toBe(id);
    });
  });

  describe('approveEntry', () => {
    it('should approve an entry', async () => {
      const id = 'test-id';

      const result = await service.approveEntry(id);

      expect(result.id).toBe(id);
      expect(result.status).toBe('approved');
      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(result.approvedBy).toBeDefined();
    });
  });

  describe('rejectEntry', () => {
    it('should reject an entry with reason', async () => {
      const id = 'test-id';
      const reason = 'Invalid account code';

      const result = await service.rejectEntry(id, reason);

      expect(result.id).toBe(id);
      expect(result.status).toBe('rejected');
      expect(result.rejectedAt).toBeInstanceOf(Date);
      expect(result.rejectionReason).toBe(reason);
    });
  });

  describe('generateBalanceSheet', () => {
    it('should generate a balance sheet for current date', async () => {
      const result = await service.generateBalanceSheet();

      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('liabilities');
      expect(result).toHaveProperty('equity');
      expect(result.asOfDate).toBeInstanceOf(Date);
    });

    it('should generate a balance sheet for specific date', async () => {
      const date = '2024-01-01';

      const result = await service.generateBalanceSheet(date);

      expect(result.asOfDate).toEqual(new Date(date));
    });

    it('should have correct balance sheet structure', async () => {
      const result = await service.generateBalanceSheet();

      expect(result.assets).toHaveProperty('current');
      expect(result.assets).toHaveProperty('fixed');
      expect(result.assets).toHaveProperty('total');
      expect(result.liabilities).toHaveProperty('current');
      expect(result.liabilities).toHaveProperty('longTerm');
      expect(result.equity).toHaveProperty('capital');
      expect(result.equity).toHaveProperty('retainedEarnings');
    });
  });

  describe('generateProfitLoss', () => {
    it('should generate profit and loss statement', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const result = await service.generateProfitLoss(startDate, endDate);

      expect(result).toHaveProperty('period');
      expect(result.period.startDate).toBe(startDate);
      expect(result.period.endDate).toBe(endDate);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('costOfGoodsSold');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('operatingExpenses');
      expect(result).toHaveProperty('netIncome');
    });

    it('should have correct P&L structure', async () => {
      const result = await service.generateProfitLoss('2024-01-01', '2024-12-31');

      expect(result.revenue).toHaveProperty('sales');
      expect(result.revenue).toHaveProperty('services');
      expect(result.revenue).toHaveProperty('total');
      expect(result.operatingExpenses).toHaveProperty('salaries');
      expect(result.operatingExpenses).toHaveProperty('rent');
      expect(result.operatingExpenses).toHaveProperty('utilities');
    });
  });

  describe('generateTrialBalance', () => {
    it('should generate trial balance for current date', async () => {
      const result = await service.generateTrialBalance();

      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('totalDebits');
      expect(result).toHaveProperty('totalCredits');
      expect(result).toHaveProperty('balanced');
      expect(Array.isArray(result.accounts)).toBe(true);
    });

    it('should generate trial balance for specific date', async () => {
      const date = '2024-01-01';

      const result = await service.generateTrialBalance(date);

      expect(result.asOfDate).toEqual(new Date(date));
    });

    it('should indicate if trial balance is balanced', async () => {
      const result = await service.generateTrialBalance();

      expect(typeof result.balanced).toBe('boolean');
    });
  });

  describe('closeFiscalPeriod', () => {
    it('should close a fiscal period', async () => {
      const periodId = 'period-2024';

      const result = await service.closeFiscalPeriod(periodId);

      expect(result.periodId).toBe(periodId);
      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(result.closedBy).toBeDefined();
    });
  });
});
