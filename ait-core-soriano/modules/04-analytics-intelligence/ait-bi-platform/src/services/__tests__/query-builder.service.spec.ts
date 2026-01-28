import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService, QueryDefinition } from '../query-builder.service';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildQuery', () => {
    it('should build simple SELECT query', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }, { field: 'name' }],
        from: 'users',
      };

      const query = await service.buildQuery(definition);

      expect(query).toBeDefined();
      expect(query.sql).toContain('SELECT');
      expect(query.sql).toContain('id');
      expect(query.sql).toContain('name');
      expect(query.sql).toContain('FROM users');
    });

    it('should build query with WHERE clause', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
        where: [
          {
            field: 'status',
            operator: '=',
            value: 'active',
          },
        ],
      };

      const query = await service.buildQuery(definition);

      expect(query.sql).toContain('WHERE');
      expect(query.sql).toContain('status');
      expect(query.parameters).toHaveLength(1);
      expect(query.parameters[0]).toBe('active');
    });

    it('should build query with JOIN', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'users.id' }, { field: 'orders.total' }],
        from: 'users',
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            on: {
              left: 'users.id',
              right: 'orders.user_id',
            },
          },
        ],
      };

      const query = await service.buildQuery(definition);

      expect(query.sql).toContain('INNER JOIN orders');
      expect(query.sql).toContain('users.id = orders.user_id');
    });

    it('should build query with aggregation', async () => {
      const definition: QueryDefinition = {
        select: [
          { field: 'category' },
          { field: 'amount', aggregation: 'SUM', alias: 'total' },
        ],
        from: 'transactions',
        groupBy: ['category'],
      };

      const query = await service.buildQuery(definition);

      expect(query.sql).toContain('SUM(amount) AS total');
      expect(query.sql).toContain('GROUP BY category');
    });

    it('should build query with ORDER BY and LIMIT', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'name' }, { field: 'amount' }],
        from: 'products',
        orderBy: [{ field: 'amount', direction: 'DESC' }],
        limit: 10,
      };

      const query = await service.buildQuery(definition);

      expect(query.sql).toContain('ORDER BY amount DESC');
      expect(query.sql).toContain('LIMIT 10');
    });
  });

  describe('validateQuery', () => {
    it('should validate correct query', async () => {
      const query = {
        sql: '',
        parameters: [],
        definition: {
          select: [{ field: 'id' }],
          from: 'users',
        },
      };

      const validation = await service.validateQuery(query);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing SELECT', async () => {
      const query = {
        sql: '',
        parameters: [],
        definition: {
          select: [],
          from: 'users',
        },
      };

      const validation = await service.validateQuery(query);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing FROM', async () => {
      const query = {
        sql: '',
        parameters: [],
        definition: {
          select: [{ field: 'id' }],
          from: '',
        },
      };

      const validation = await service.validateQuery(query);

      expect(validation.isValid).toBe(false);
    });

    it('should warn about missing LIMIT', async () => {
      const query = {
        sql: '',
        parameters: [],
        definition: {
          select: [{ field: 'id' }],
          from: 'users',
        },
      };

      const validation = await service.validateQuery(query);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('executeQuery', () => {
    it('should execute query and return results', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
        limit: 10,
      };

      const query = await service.buildQuery(definition);
      const result = await service.executeQuery(query);

      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rowCount).toBe(result.rows.length);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.fields).toBeDefined();
    });
  });

  describe('optimizeQuery', () => {
    it('should add LIMIT if missing', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
      };

      const query = await service.buildQuery(definition);
      const optimized = await service.optimizeQuery(query);

      expect(optimized.definition.limit).toBeDefined();
      expect(optimized.definition.limit).toBeGreaterThan(0);
    });
  });

  describe('saveQuery', () => {
    it('should save query', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
      };

      const query = await service.buildQuery(definition);
      const saved = await service.saveQuery('test-query', query, 'user-123');

      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('test-query');
      expect(saved.userId).toBe('user-123');
      expect(saved.executionCount).toBe(0);
    });
  });

  describe('getSavedQueries', () => {
    it('should return user saved queries', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
      };

      const query = await service.buildQuery(definition);
      await service.saveQuery('query-1', query, 'user-123');
      await service.saveQuery('query-2', query, 'user-123');

      const queries = await service.getSavedQueries('user-123');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('naturalLanguageToQuery', () => {
    it('should convert natural language to query definition', async () => {
      const definition = await service.naturalLanguageToQuery(
        'Show me all active policies',
      );

      expect(definition).toBeDefined();
      expect(definition.select).toBeDefined();
      expect(definition.from).toBeDefined();
      expect(Array.isArray(definition.select)).toBe(true);
    });
  });

  describe('getExecutionPlan', () => {
    it('should return execution plan', async () => {
      const definition: QueryDefinition = {
        select: [{ field: 'id' }],
        from: 'users',
      };

      const query = await service.buildQuery(definition);
      const plan = await service.getExecutionPlan(query);

      expect(plan).toBeDefined();
      expect(plan.plan).toBeDefined();
      expect(plan.estimatedCost).toBeGreaterThanOrEqual(0);
      expect(plan.estimatedRows).toBeGreaterThanOrEqual(0);
    });
  });
});
