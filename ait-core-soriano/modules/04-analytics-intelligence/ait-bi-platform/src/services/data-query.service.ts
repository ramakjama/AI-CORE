import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

export interface QueryConfig {
  type: 'sql' | 'api' | 'aggregation' | 'python';
  source: string;
  query?: string;
  endpoint?: string;
  method?: string;
  params?: any;
  aggregations?: any[];
  pythonScript?: string;
}

@Injectable()
export class DataQueryService {
  private readonly logger = new Logger(DataQueryService.name);
  private readonly pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:5000';

  constructor(private readonly httpService: HttpService) {}

  async executeQuery(config: QueryConfig): Promise<any> {
    this.logger.log(`Executing query: ${config.type} on ${config.source}`);

    try {
      switch (config.type) {
        case 'sql':
          return await this.executeSqlQuery(config);
        case 'api':
          return await this.executeApiQuery(config);
        case 'aggregation':
          return await this.executeAggregation(config);
        case 'python':
          return await this.executePythonQuery(config);
        default:
          throw new Error(`Unsupported query type: ${config.type}`);
      }
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  private async executeSqlQuery(config: QueryConfig): Promise<any> {
    // Integration with database service
    const response = await axios.post(`${process.env.DATABASE_SERVICE_URL}/query`, {
      query: config.query,
      params: config.params,
    });

    return response.data;
  }

  private async executeApiQuery(config: QueryConfig): Promise<any> {
    const method = config.method?.toLowerCase() || 'get';
    
    const response = await firstValueFrom(
      this.httpService.request({
        method,
        url: config.endpoint,
        params: config.params,
      })
    );

    return response.data;
  }

  private async executeAggregation(config: QueryConfig): Promise<any> {
    // Execute aggregations using Python statistical engine
    const response = await axios.post(`${this.pythonEngineUrl}/api/analytics/aggregate`, {
      source: config.source,
      aggregations: config.aggregations,
      params: config.params,
    });

    return response.data;
  }

  private async executePythonQuery(config: QueryConfig): Promise<any> {
    // Execute custom Python analysis
    const response = await axios.post(`${this.pythonEngineUrl}/api/analytics/execute`, {
      script: config.pythonScript,
      params: config.params,
    });

    return response.data;
  }

  async validateQuery(config: QueryConfig): Promise<{ valid: boolean; error?: string }> {
    try {
      // Perform dry-run validation
      if (config.type === 'sql') {
        // Validate SQL syntax
        const response = await axios.post(`${process.env.DATABASE_SERVICE_URL}/validate`, {
          query: config.query,
        });
        return { valid: response.data.valid, error: response.data.error };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async getQuerySchema(config: QueryConfig): Promise<any> {
    // Return schema/structure of query results
    const sampleResult = await this.executeQuery({
      ...config,
      params: { ...config.params, limit: 1 },
    });

    if (Array.isArray(sampleResult) && sampleResult.length > 0) {
      const sample = sampleResult[0];
      return Object.keys(sample).map(key => ({
        name: key,
        type: typeof sample[key],
      }));
    }

    return [];
  }
}
