import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  QueryBuilderService,
  QueryDefinition,
  Query as QueryType,
} from '../services/query-builder.service';

@ApiTags('Query Builder')
@Controller('api/v1/bi/query-builder')
export class QueryBuilderController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  @Post('build')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build SQL query from definition' })
  @ApiResponse({ status: 200, description: 'Query built successfully' })
  async buildQuery(@Body() definition: QueryDefinition) {
    return this.queryBuilderService.buildQuery(definition);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a query' })
  async executeQuery(@Body() query: QueryType) {
    return this.queryBuilderService.executeQuery(query);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate query structure' })
  async validateQuery(@Body() query: QueryType) {
    return this.queryBuilderService.validateQuery(query);
  }

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize query for better performance' })
  async optimizeQuery(@Body() query: QueryType) {
    return this.queryBuilderService.optimizeQuery(query);
  }

  @Post('save')
  @ApiOperation({ summary: 'Save query for reuse' })
  async saveQuery(
    @Body()
    body: {
      name: string;
      query: QueryType;
      description?: string;
    },
  ) {
    return this.queryBuilderService.saveQuery(
      body.name,
      body.query,
      'current-user-id',
      body.description,
    );
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get all saved queries for user' })
  async getSavedQueries(@Query('userId') userId: string = 'current-user-id') {
    return this.queryBuilderService.getSavedQueries(userId);
  }

  @Get('saved/:id')
  @ApiOperation({ summary: 'Get saved query by ID' })
  @ApiParam({ name: 'id', description: 'Saved query ID' })
  async getSavedQuery(@Param('id') id: string) {
    return this.queryBuilderService.getSavedQuery(id);
  }

  @Put('saved/:id')
  @ApiOperation({ summary: 'Update saved query' })
  async updateSavedQuery(@Param('id') id: string, @Body() updates: any) {
    return this.queryBuilderService.updateSavedQuery(id, updates);
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete saved query' })
  async deleteSavedQuery(@Param('id') id: string) {
    return this.queryBuilderService.deleteSavedQuery(id);
  }

  @Post('saved/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute saved query' })
  async executeSavedQuery(
    @Param('id') id: string,
    @Body() body: { parameters?: any[] },
  ) {
    return this.queryBuilderService.executeSavedQuery(id, body.parameters);
  }

  @Post('execution-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get query execution plan' })
  async getExecutionPlan(@Body() query: QueryType) {
    return this.queryBuilderService.getExecutionPlan(query);
  }

  @Post('natural-language')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert natural language to query' })
  async naturalLanguageToQuery(@Body() body: { prompt: string }) {
    return this.queryBuilderService.naturalLanguageToQuery(body.prompt);
  }
}
