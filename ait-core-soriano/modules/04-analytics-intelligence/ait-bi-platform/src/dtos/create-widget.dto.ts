import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetType, ChartType } from '../entities/widget.entity';

export class CreateWidgetDto {
  @ApiProperty({ description: 'Widget name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: WidgetType, description: 'Widget type' })
  @IsEnum(WidgetType)
  type: WidgetType;

  @ApiPropertyOptional({ enum: ChartType, description: 'Chart type (for chart widgets)' })
  @IsEnum(ChartType)
  @IsOptional()
  chartType?: ChartType;

  @ApiProperty({ description: 'Dashboard ID' })
  @IsString()
  dashboardId: string;

  @ApiProperty({ description: 'Widget configuration' })
  @IsObject()
  configuration: any;

  @ApiProperty({ description: 'Data query configuration' })
  @IsObject()
  dataQuery: any;

  @ApiPropertyOptional({ description: 'Data source configuration' })
  @IsObject()
  @IsOptional()
  dataSource?: any;

  @ApiPropertyOptional({ description: 'Widget styling' })
  @IsObject()
  @IsOptional()
  styling?: any;

  @ApiProperty({ description: 'Widget position and size' })
  @IsObject()
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsNumber()
  @IsOptional()
  refreshInterval?: number;

  @ApiPropertyOptional({ description: 'Widget filters' })
  @IsObject()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ description: 'Widget interactions' })
  @IsObject()
  @IsOptional()
  interactions?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class UpdateWidgetDto {
  @ApiPropertyOptional({ description: 'Widget name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: WidgetType, description: 'Widget type' })
  @IsEnum(WidgetType)
  @IsOptional()
  type?: WidgetType;

  @ApiPropertyOptional({ enum: ChartType, description: 'Chart type' })
  @IsEnum(ChartType)
  @IsOptional()
  chartType?: ChartType;

  @ApiPropertyOptional({ description: 'Widget configuration' })
  @IsObject()
  @IsOptional()
  configuration?: any;

  @ApiPropertyOptional({ description: 'Data query configuration' })
  @IsObject()
  @IsOptional()
  dataQuery?: any;

  @ApiPropertyOptional({ description: 'Data source configuration' })
  @IsObject()
  @IsOptional()
  dataSource?: any;

  @ApiPropertyOptional({ description: 'Widget styling' })
  @IsObject()
  @IsOptional()
  styling?: any;

  @ApiPropertyOptional({ description: 'Widget position and size' })
  @IsObject()
  @IsOptional()
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsNumber()
  @IsOptional()
  refreshInterval?: number;

  @ApiPropertyOptional({ description: 'Is widget visible' })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Widget filters' })
  @IsObject()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ description: 'Widget interactions' })
  @IsObject()
  @IsOptional()
  interactions?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
