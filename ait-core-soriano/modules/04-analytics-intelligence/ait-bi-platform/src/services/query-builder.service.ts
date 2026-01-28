import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface QueryDefinition {
  select: SelectClause[];
  from: string;
  joins?: JoinClause[];
  where?: WhereClause[];
  groupBy?: string[];
  having?: HavingClause[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
}

export interface SelectClause {
  field: string;
  alias?: string;
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'DISTINCT';
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: {
    left: string;
    right: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
  };
}

export interface WhereClause {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
  connector?: 'AND' | 'OR';
}

export interface HavingClause {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
  connector?: 'AND' | 'OR';
}

export interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface Query {
  sql: string;
  parameters: any[];
  definition: QueryDefinition;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  fields: FieldInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  userId: string;
  query: Query;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);
  private savedQueries: Map<string, SavedQuery> = new Map();

  /**
   * Build SQL query from definition
   */
  async buildQuery(definition: QueryDefinition): Promise<Query> {
    this.logger.log('Building query from definition');

    const validation = await this.validateQuery({ sql: '', parameters: [], definition });
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid query: ${validation.errors.join(', ')}`);
    }

    const parts: string[] = [];
    const parameters: any[] = [];
    let paramIndex = 1;

    // SELECT clause
    const selectParts = definition.select.map(clause => {
      if (clause.aggregation) {
        return `${clause.aggregation}(${clause.field})${clause.alias ? ` AS ${clause.alias}` : ''}`;
      }
      return `${clause.field}${clause.alias ? ` AS ${clause.alias}` : ''}`;
    });
    parts.push(`SELECT ${selectParts.join(', ')}`);

    // FROM clause
    parts.push(`FROM ${definition.from}`);

    // JOIN clauses
    if (definition.joins && definition.joins.length > 0) {
      definition.joins.forEach(join => {
        const operator = join.on.operator || '=';
        parts.push(
          `${join.type} JOIN ${join.table} ON ${join.on.left} ${operator} ${join.on.right}`,
        );
      });
    }

    // WHERE clause
    if (definition.where && definition.where.length > 0) {
      const whereParts: string[] = [];
      definition.where.forEach((clause, index) => {
        const connector = index > 0 ? ` ${clause.connector || 'AND'} ` : '';

        switch (clause.operator) {
          case 'IS NULL':
          case 'IS NOT NULL':
            whereParts.push(`${connector}${clause.field} ${clause.operator}`);
            break;
          case 'IN':
            parameters.push(clause.value);
            whereParts.push(`${connector}${clause.field} IN ($${paramIndex++})`);
            break;
          case 'BETWEEN':
            parameters.push(clause.value[0], clause.value[1]);
            whereParts.push(`${connector}${clause.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`);
            break;
          default:
            parameters.push(clause.value);
            whereParts.push(`${connector}${clause.field} ${clause.operator} $${paramIndex++}`);
        }
      });
      parts.push(`WHERE ${whereParts.join('')}`);
    }

    // GROUP BY clause
    if (definition.groupBy && definition.groupBy.length > 0) {
      parts.push(`GROUP BY ${definition.groupBy.join(', ')}`);
    }

    // HAVING clause
    if (definition.having && definition.having.length > 0) {
      const havingParts: string[] = [];
      definition.having.forEach((clause, index) => {
        const connector = index > 0 ? ` ${clause.connector || 'AND'} ` : '';
        parameters.push(clause.value);
        havingParts.push(`${connector}${clause.field} ${clause.operator} $${paramIndex++}`);
      });
      parts.push(`HAVING ${havingParts.join('')}`);
    }

    // ORDER BY clause
    if (definition.orderBy && definition.orderBy.length > 0) {
      const orderParts = definition.orderBy.map(
        clause => `${clause.field} ${clause.direction}`,
      );
      parts.push(`ORDER BY ${orderParts.join(', ')}`);
    }

    // LIMIT/OFFSET
    if (definition.limit) {
      parts.push(`LIMIT ${definition.limit}`);
    }
    if (definition.offset) {
      parts.push(`OFFSET ${definition.offset}`);
    }

    const sql = parts.join('\n');

    return {
      sql,
      parameters,
      definition,
    };
  }

  /**
   * Execute a query
   */
  async executeQuery(query: Query): Promise<QueryResult> {
    this.logger.log('Executing query');
    const startTime = Date.now();

    // Mock execution - in production, use TypeORM or pg to execute
    const mockRows = this.generateMockData(query.definition);

    const executionTime = Date.now() - startTime;

    return {
      rows: mockRows,
      rowCount: mockRows.length,
      executionTime,
      fields: this.extractFields(mockRows),
    };
  }

  /**
   * Validate query structure and syntax
   */
  async validateQuery(query: Query): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const def = query.definition;

    // Validate SELECT
    if (!def.select || def.select.length === 0) {
      errors.push('SELECT clause is required');
    }

    // Validate FROM
    if (!def.from) {
      errors.push('FROM clause is required');
    }

    // Validate field names
    const fieldPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
    def.select.forEach(clause => {
      if (!fieldPattern.test(clause.field)) {
        errors.push(`Invalid field name: ${clause.field}`);
      }
    });

    // Validate GROUP BY with aggregations
    const hasAggregations = def.select.some(s => s.aggregation);
    const hasGroupBy = def.groupBy && def.groupBy.length > 0;

    if (hasAggregations && !hasGroupBy) {
      const nonAggregatedFields = def.select.filter(s => !s.aggregation);
      if (nonAggregatedFields.length > 0) {
        warnings.push('Using aggregations without GROUP BY. Consider adding GROUP BY clause.');
      }
    }

    // Validate HAVING without GROUP BY
    if (def.having && def.having.length > 0 && !hasGroupBy) {
      errors.push('HAVING clause requires GROUP BY');
    }

    // Performance warnings
    if (def.where && def.where.some(w => w.operator === 'LIKE' && w.value?.startsWith('%'))) {
      warnings.push('Leading wildcard in LIKE may impact performance');
    }

    if (!def.limit) {
      warnings.push('No LIMIT specified. Consider adding LIMIT for better performance.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Optimize query for better performance
   */
  async optimizeQuery(query: Query): Promise<Query> {
    this.logger.log('Optimizing query');

    const optimized = { ...query };
    const def = { ...query.definition };

    // Add LIMIT if not present
    if (!def.limit) {
      def.limit = 1000;
    }

    // Reorder WHERE clauses (most selective first)
    if (def.where && def.where.length > 1) {
      def.where = this.optimizeWhereOrder(def.where);
    }

    // Use EXISTS instead of IN for subqueries
    // Add index hints where applicable
    // These would be more sophisticated in production

    optimized.definition = def;
    optimized.sql = (await this.buildQuery(def)).sql;

    return optimized;
  }

  /**
   * Save query for reuse
   */
  async saveQuery(name: string, query: Query, userId: string, description?: string): Promise<SavedQuery> {
    this.logger.log(`Saving query: ${name}`);

    const id = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const savedQuery: SavedQuery = {
      id,
      name,
      description,
      userId,
      query,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
    };

    this.savedQueries.set(id, savedQuery);

    return savedQuery;
  }

  /**
   * Get saved queries for user
   */
  async getSavedQueries(userId: string): Promise<SavedQuery[]> {
    return Array.from(this.savedQueries.values())
      .filter(q => q.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get saved query by ID
   */
  async getSavedQuery(id: string): Promise<SavedQuery> {
    const query = this.savedQueries.get(id);
    if (!query) {
      throw new BadRequestException(`Saved query ${id} not found`);
    }
    return query;
  }

  /**
   * Update saved query
   */
  async updateSavedQuery(
    id: string,
    updates: Partial<SavedQuery>,
  ): Promise<SavedQuery> {
    const query = await this.getSavedQuery(id);

    Object.assign(query, updates);
    query.updatedAt = new Date();

    this.savedQueries.set(id, query);

    return query;
  }

  /**
   * Delete saved query
   */
  async deleteSavedQuery(id: string): Promise<void> {
    this.savedQueries.delete(id);
  }

  /**
   * Execute saved query
   */
  async executeSavedQuery(id: string, parameters?: any[]): Promise<QueryResult> {
    const savedQuery = await this.getSavedQuery(id);

    const query = { ...savedQuery.query };
    if (parameters) {
      query.parameters = parameters;
    }

    const result = await this.executeQuery(query);

    // Update execution stats
    savedQuery.lastExecuted = new Date();
    savedQuery.executionCount++;
    this.savedQueries.set(id, savedQuery);

    return result;
  }

  /**
   * Get query execution plan (for optimization)
   */
  async getExecutionPlan(query: Query): Promise<{
    plan: string;
    estimatedCost: number;
    estimatedRows: number;
  }> {
    // Mock implementation - in production use EXPLAIN
    return {
      plan: 'Sequential Scan -> Sort -> Aggregate',
      estimatedCost: Math.random() * 1000,
      estimatedRows: Math.floor(Math.random() * 10000),
    };
  }

  /**
   * Convert natural language to query (AI-powered)
   */
  async naturalLanguageToQuery(prompt: string): Promise<QueryDefinition> {
    this.logger.log(`Converting natural language to query: ${prompt}`);

    // Mock implementation - in production use LLM/GPT
    // Example: "Show me all active policies" -> query definition

    return {
      select: [
        { field: 'policy_number' },
        { field: 'customer_name' },
        { field: 'premium' },
        { field: 'status' },
      ],
      from: 'policies',
      where: [
        {
          field: 'status',
          operator: '=',
          value: 'Active',
        },
      ],
      orderBy: [{ field: 'policy_number', direction: 'ASC' }],
      limit: 100,
    };
  }

  // ==================== HELPER METHODS ====================

  private optimizeWhereOrder(clauses: WhereClause[]): WhereClause[] {
    // Sort by selectivity (= before LIKE, etc.)
    return clauses.sort((a, b) => {
      const selectivity = { '=': 0, 'IN': 1, 'BETWEEN': 2, 'LIKE': 3 };
      return (selectivity[a.operator] || 99) - (selectivity[b.operator] || 99);
    });
  }

  private generateMockData(definition: QueryDefinition): any[] {
    const count = definition.limit || 10;
    const data: any[] = [];

    for (let i = 0; i < count; i++) {
      const row: any = {};
      definition.select.forEach(clause => {
        const fieldName = clause.alias || clause.field;

        if (clause.aggregation) {
          row[fieldName] = Math.floor(Math.random() * 10000);
        } else {
          row[fieldName] = this.generateMockValue(clause.field);
        }
      });
      data.push(row);
    }

    return data;
  }

  private generateMockValue(field: string): any {
    if (field.includes('date') || field.includes('time')) {
      return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    }
    if (field.includes('amount') || field.includes('premium') || field.includes('value')) {
      return Math.random() * 10000 + 100;
    }
    if (field.includes('count') || field.includes('number')) {
      return Math.floor(Math.random() * 1000);
    }
    if (field.includes('status')) {
      return ['Active', 'Pending', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)];
    }
    if (field.includes('name')) {
      return `Name_${Math.floor(Math.random() * 1000)}`;
    }
    return `Value_${Math.floor(Math.random() * 1000)}`;
  }

  private extractFields(rows: any[]): FieldInfo[] {
    if (rows.length === 0) return [];

    const firstRow = rows[0];
    return Object.keys(firstRow).map(key => ({
      name: key,
      type: typeof firstRow[key],
      nullable: true,
    }));
  }
}
